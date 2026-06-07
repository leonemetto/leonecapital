import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const TRIAL_DAYS = 14;

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
    "Access-Control-Max-Age": "86400",
  };
}

function json(body: object, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, origin);

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthenticated" }, 401, origin);

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: userData, error: userErr } = await supa.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401, origin);

  const userId = userData.user.id;
  const now = new Date();
  const trialEnds = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { data: rows, error: rowsErr } = await supa
    .from("subscriptions")
    .select("id, plan, status, current_period_end, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (rowsErr) return json({ error: "failed to load subscription" }, 500, origin);

  const existingRows = rows ?? [];
  const existingAccess = existingRows.find((row) => {
    const status = row.status;
    const periodEnd = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
    const trialStillActive = status === "trialing" && periodEnd != null && periodEnd > now.getTime();
    return row.plan === "pro" && (status === "active" || status === "past_due" || status === "cancelling" || trialStillActive);
  });

  if (existingAccess) {
    return json({
      started: false,
      already_active: true,
      subscription: existingAccess,
    }, 200, origin);
  }

  const priorTrialOrPaid = existingRows.some((row) => row.plan === "pro" || row.plan === "elite");
  if (priorTrialOrPaid) {
    return json({
      started: false,
      trial_available: false,
      error: "trial already used",
    }, 200, origin);
  }

  const legacyFree = existingRows.find((row) => row.plan === "free");
  const trialPayload = {
    user_id: userId,
    plan: "pro",
    status: "trialing",
    provider: "manual",
    billing_cycle: "monthly",
    amount: 0,
    currency: "USD",
    channel: "other",
    started_at: now.toISOString(),
    current_period_start: now.toISOString(),
    current_period_end: trialEnds.toISOString(),
  };

  if (legacyFree?.id) {
    const { data, error } = await supa
      .from("subscriptions")
      .update(trialPayload)
      .eq("id", legacyFree.id)
      .select("id, plan, status, current_period_end")
      .single();

    if (error) return json({ error: "failed to start trial" }, 500, origin);
    return json({ started: true, subscription: data }, 200, origin);
  }

  const { data, error } = await supa
    .from("subscriptions")
    .insert(trialPayload)
    .select("id, plan, status, current_period_end")
    .single();

  if (error) return json({ error: "failed to start trial" }, 500, origin);
  return json({ started: true, subscription: data }, 200, origin);
});
