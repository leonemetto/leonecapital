// lemon-checkout-create — called by the upgrade modal when the user clicks
// "Upgrade to Pro". This function:
//   1. Verifies the user is authed (verify_jwt=true in config.toml)
//   2. Resolves the {plan, billing_cycle} to a Lemon Squeezy variant_id
//   3. Inserts a pending_intent row capturing consent at click-time
//   4. Calls LS POST /v1/checkouts to mint a hosted checkout URL
//   5. Returns the URL — the frontend then window.location's the user there
//
// Required Supabase Edge Function secrets:
//   LEMONSQUEEZY_API_KEY
//   LEMONSQUEEZY_STORE_ID
//   LEMONSQUEEZY_VARIANT_PRO_MONTHLY / _PRO_ANNUAL
//   SUPABASE_URL                  (auto)
//   SUPABASE_SERVICE_ROLE_KEY     (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  resolveCheckoutVariant,
  getStoreId,
  type Plan,
  type BillingCycle,
} from "../_shared/lemon-variants.ts";

const ALLOWED_ORIGINS = new Set([
  "https://edgeflow.capital",
  "https://www.edgeflow.capital",
  "http://localhost:5173",
  "http://localhost:8080",
]);

interface CheckoutRequest {
  plan: Plan;
  billing_cycle: BillingCycle;
  currency?: "USD" | "KES" | "EUR" | "GBP"; // captured for forensics; LS bills in USD
  terms_version_accepted: string;
  refunds_version_accepted: string;
  privacy_version_accepted: string;
  consent_checkbox_text: string;
}

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://edgeflow.capital";
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
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

  // 1) Auth — the verify_jwt=true config means Supabase already validated the
  //    JWT before this function runs. Extract the user from it.
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

  // 2) Parse + validate request
  let body: CheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return err("invalid JSON body", 400, origin);
  }
  if (body.plan !== "pro") return err("invalid plan", 400, origin);
  if (!["monthly", "annual"].includes(body.billing_cycle)) {
    return err("invalid billing_cycle", 400, origin);
  }
  if (!body.terms_version_accepted || !body.refunds_version_accepted || !body.privacy_version_accepted) {
    return err("missing consent versions", 400, origin);
  }
  if (!body.consent_checkbox_text) return err("missing consent_checkbox_text", 400, origin);

  // 3) Resolve variant
  const variant = resolveCheckoutVariant(body.plan, body.billing_cycle);
  const storeId = getStoreId();
  if (!variant || !storeId) {
    return err("LS variant or store not configured for this plan/cycle", 500, origin);
  }

  // 4) Insert pending_intent (captures consent + IP/UA snapshot)
  const intentId = crypto.randomUUID();
  const ipAtSignup =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const { error: intentErr } = await supa.from("pending_intents").insert({
    id: intentId,
    user_id: user.id,
    provider: "lemonsqueezy",
    provider_reference: intentId, // LS doesn't pre-allocate a reference; reuse our intent id
    plan: body.plan,
    billing_cycle: body.billing_cycle,
    currency: body.currency ?? "USD",
    amount: variant.amountCents,
    variant_id: variant.variantId,
    status: "pending",
    terms_version_accepted: body.terms_version_accepted,
    refunds_version_accepted: body.refunds_version_accepted,
    privacy_version_accepted: body.privacy_version_accepted,
    ip_at_signup: ipAtSignup,
    user_agent_at_signup: userAgent,
    consent_checkbox_text: body.consent_checkbox_text,
  });
  if (intentErr) return err("failed to create checkout intent", 500, origin, { detail: intentErr.message });

  // 5) Call Lemon Squeezy to mint the checkout URL
  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) return err("LEMONSQUEEZY_API_KEY is not configured", 500, origin);

  const lsResp = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email ?? undefined,
            custom: {
              user_id: user.id,
              intent_id: intentId,
            },
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          product_options: {
            redirect_url: "https://edgeflow.capital/billing/return",
            receipt_button_text: "Open EdgeFlow",
            receipt_link_url: "https://edgeflow.capital/dashboard",
          },
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
          preview: false,
        },
        relationships: {
          store:   { data: { type: "stores",   id: storeId } },
          variant: { data: { type: "variants", id: variant.variantId } },
        },
      },
    }),
  });

  if (!lsResp.ok) {
    const errBody = await lsResp.text();
    console.error("LS checkout create failed", lsResp.status, errBody);
    return err("checkout creation failed", 502, origin, { ls_status: lsResp.status });
  }
  const lsJson = await lsResp.json();
  const checkoutUrl = lsJson?.data?.attributes?.url;
  if (!checkoutUrl) {
    console.error("LS response missing url", lsJson);
    return err("checkout URL not returned by Lemon Squeezy", 502, origin);
  }

  return new Response(JSON.stringify({ url: checkoutUrl, intent_id: intentId }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
});
