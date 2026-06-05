// lemon-reconcile — pg_cron calls this every 10 min with x-reconcile-key.
//
// What it does:
//   1. SELECT pending_intents where status='pending' AND created_at < now()-10min
//      AND (last_checked_at IS NULL OR last_checked_at < now()-5min)
//   2. For each intent: look up the customer's subscriptions in LS via
//      GET /v1/subscriptions?filter[user_email]=... and check whether one
//      maps to our variant_id and is active.
//   3. If a matching active sub is found and no local subscription row exists
//      for that LS subscription_id, synthesize an UPSERT (the missing webhook).
//   4. After 24h still pending → mark 'orphaned' so we know to follow up.
//
// verify_jwt=false in config.toml; auth is shared-secret via x-reconcile-key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { upsertSubscriptionFromLemon } from "../_shared/lemon-subscription-state.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  const expected = Deno.env.get("RECONCILE_INTERNAL_KEY") ?? "";
  const provided = req.headers.get("x-reconcile-key") ?? "";
  if (!expected || provided !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: stale } = await supa
    .from("pending_intents")
    .select("id, user_id, provider_reference, variant_id, created_at, last_checked_at")
    .eq("status", "pending")
    .eq("provider", "lemonsqueezy")
    .lt("created_at", tenMinAgo)
    .or(`last_checked_at.is.null,last_checked_at.lt.${fiveMinAgo}`)
    .limit(50);

  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
  let recovered = 0;
  let orphaned = 0;
  const errors: string[] = [];

  for (const intent of stale ?? []) {
    try {
      // 24h+ pending → mark orphaned (we've already given LS the chance to
      // notify us via webhook AND a reasonable window for the user to retry)
      if (intent.created_at < twentyFourHoursAgo) {
        await supa
          .from("pending_intents")
          .update({ status: "orphaned", last_checked_at: new Date().toISOString() })
          .eq("id", intent.id);
        orphaned++;
        continue;
      }

      if (!apiKey) {
        errors.push(`LEMONSQUEEZY_API_KEY missing; cannot reconcile intent ${intent.id}`);
        continue;
      }

      // Look up the user's email
      const { data: userRow } = await supa
        .from("auth.users" as any)
        .select("email")
        .eq("id", intent.user_id)
        .maybeSingle();
      const email = (userRow as any)?.email;
      if (!email) {
        errors.push(`no email for user ${intent.user_id}`);
        continue;
      }

      // Ask LS for any subscriptions tied to this email + variant
      const url = new URL("https://api.lemonsqueezy.com/v1/subscriptions");
      url.searchParams.set("filter[user_email]", email);
      if (intent.variant_id) url.searchParams.set("filter[variant_id]", String(intent.variant_id));

      const lsResp = await fetch(url.toString(), {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!lsResp.ok) {
        errors.push(`LS query failed (${lsResp.status}) for intent ${intent.id}`);
        await supa
          .from("pending_intents")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", intent.id);
        continue;
      }

      const lsJson = await lsResp.json();
      const matches = (lsJson?.data ?? []) as any[];
      const activeMatch = matches.find((m) =>
        ["active", "on_trial", "past_due", "cancelled"].includes(m?.attributes?.status)
      );

      if (!activeMatch) {
        // No matching paid sub → either failed checkout or still in progress.
        // Just bump last_checked_at and try again next sweep.
        await supa
          .from("pending_intents")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", intent.id);
        continue;
      }

      // Synthesize the missing webhook
      await upsertSubscriptionFromLemon(supa as any, {
        subscriptionId: String(activeMatch.id),
        customerId: String(activeMatch.attributes.customer_id),
        variantId: String(activeMatch.attributes.variant_id),
        status: String(activeMatch.attributes.status),
        renewsAt: activeMatch.attributes.renews_at ?? null,
        endsAt: activeMatch.attributes.ends_at ?? null,
        trialEndsAt: activeMatch.attributes.trial_ends_at ?? null,
        createdAt: activeMatch.attributes.created_at ?? new Date().toISOString(),
        cardBrand: activeMatch.attributes.card_brand ?? null,
        userId: intent.user_id,
        intentId: intent.id,
      });

      // upsertSubscriptionFromLemon already marks the intent completed
      recovered++;
    } catch (e) {
      errors.push(`intent ${intent.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      checked: stale?.length ?? 0,
      recovered,
      orphaned,
      errors: errors.length ? errors : undefined,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
