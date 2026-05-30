// paystack-cancel-subscription — called when the user clicks Cancel in
// Settings → Subscription. Tells Paystack to stop renewals AND updates our
// local row so the UI immediately reflects "cancelling — access until X".
//
// The actual access cut-off happens when Paystack later fires
// subscription.disable (when next_payment_date arrives). The webhook handles
// the transition cancelling → cancelled at that moment.
//
// Required secrets:
//   PAYSTACK_SECRET_KEY
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Deploy with verify_jwt = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!paystackKey) return jsonResponse({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

  // ─── Auth ────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return jsonResponse({ error: "missing bearer token" }, 401);

  const authClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userResp, error: userErr } = await authClient.auth.getUser(jwt);
  if (userErr || !userResp.user) return jsonResponse({ error: "invalid token" }, 401);
  const user = userResp.user;

  // ─── Find the active subscription ────────────────────────────────────────
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: sub, error: subErr } = await adminClient
    .from("subscriptions")
    .select("id, status, paystack_subscription_id, paystack_authorization_code, current_period_end, cancel_at")
    .eq("user_id", user.id)
    .in("status", ["active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr) {
    console.error("subscription lookup failed", subErr);
    return jsonResponse({ error: "failed to look up subscription" }, 500);
  }
  if (!sub) {
    // Idempotency: if there's no active sub, the user has already cancelled or
    // never subscribed. Return a friendly success either way.
    const { data: cancelling } = await adminClient
      .from("subscriptions")
      .select("id, current_period_end, cancel_at")
      .eq("user_id", user.id)
      .eq("status", "cancelling")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cancelling) {
      return jsonResponse({
        ok: true,
        already_cancelling: true,
        cancel_at: cancelling.cancel_at ?? cancelling.current_period_end,
      });
    }
    return jsonResponse({ error: "no active subscription to cancel" }, 404);
  }

  if (!sub.paystack_subscription_id || !sub.paystack_authorization_code) {
    // Subscription row exists but Paystack hasn't sent subscription.create yet.
    // Mark cancelling locally so the UI shows correctly; the webhook will tidy
    // up once Paystack catches up.
    await adminClient
      .from("subscriptions")
      .update({
        status: "cancelling",
        cancelled_at: new Date().toISOString(),
        cancel_at: sub.current_period_end,
      })
      .eq("id", sub.id);
    return jsonResponse({
      ok: true,
      paystack_skipped: "subscription_not_yet_synced",
      cancel_at: sub.current_period_end,
    });
  }

  // ─── Call Paystack ───────────────────────────────────────────────────────
  // /subscription/disable takes the subscription code + the email token from
  // the most recent authorization. The token rotates on each charge; we read
  // the latest from our DB (set by subscription.create webhook).
  const disableResp = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: sub.paystack_subscription_id,
      token: sub.paystack_authorization_code,
    }),
  });
  const disableJson = await disableResp.json();
  if (!disableResp.ok || !disableJson?.status) {
    console.error("paystack disable failed", disableJson);
    return jsonResponse({ error: "payment provider rejected cancellation", paystack_message: disableJson?.message }, 502);
  }

  // ─── Update local state ──────────────────────────────────────────────────
  // We optimistically set cancel_at = current_period_end. The webhook will
  // refine this when subscription.not_renew arrives with the authoritative
  // next_payment_date.
  await adminClient
    .from("subscriptions")
    .update({
      status: "cancelling",
      cancelled_at: new Date().toISOString(),
      cancel_at: sub.current_period_end,
    })
    .eq("id", sub.id);

  return jsonResponse({
    ok: true,
    cancel_at: sub.current_period_end,
  });
});
