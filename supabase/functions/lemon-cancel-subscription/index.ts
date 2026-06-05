// lemon-cancel-subscription — user clicks "Cancel subscription" in Settings.
// We call LS to cancel the subscription on their side; LS then sends back
// a subscription_cancelled webhook which our lemon-webhook handler converts
// to status='cancelling' (access until ends_at).
//
// We optimistically flip the local row to status='cancelling' here too, so
// the Settings UI updates instantly. The webhook will reconcile if anything
// disagrees.
//
// verify_jwt=true — user must be authed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ALLOWED_ORIGINS = new Set([
  "https://edgeflow.capital",
  "https://www.edgeflow.capital",
  "http://localhost:5173",
  "http://localhost:8080",
]);

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://edgeflow.capital";
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function err(message: string, status: number, origin: string | null, extra?: object) {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return err("method not allowed", 405, origin);

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return err("unauthenticated", 401, origin);

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: userData, error: userErr } = await supa.auth.getUser(token);
  if (userErr || !userData?.user) return err("unauthenticated", 401, origin);
  const user = userData.user;

  // Find the user's active subscription
  const { data: sub } = await supa
    .from("subscriptions")
    .select("id, provider_subscription_id, status, current_period_end")
    .eq("user_id", user.id)
    .eq("provider", "lemonsqueezy")
    .in("status", ["active", "past_due", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return err("no active subscription to cancel", 404, origin);
  if (!sub.provider_subscription_id) {
    return err("subscription has no provider id (still pending webhook?)", 409, origin);
  }

  // Idempotency: if already cancelling, return success
  if (sub.status === "cancelling") {
    return new Response(JSON.stringify({ cancel_at: sub.current_period_end }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  }

  // Call LS to cancel
  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) return err("LEMONSQUEEZY_API_KEY not configured", 500, origin);

  const lsResp = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${sub.provider_subscription_id}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!lsResp.ok && lsResp.status !== 404) {
    const errBody = await lsResp.text();
    console.error("LS cancel failed", lsResp.status, errBody);
    return err("cancellation failed at provider", 502, origin, { ls_status: lsResp.status });
  }

  // Optimistic local update — the webhook will reconcile
  const nowIso = new Date().toISOString();
  await supa
    .from("subscriptions")
    .update({
      status: "cancelling",
      cancelled_at: nowIso,
      cancel_at: sub.current_period_end,
    })
    .eq("id", sub.id);

  return new Response(JSON.stringify({ cancel_at: sub.current_period_end }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
});
