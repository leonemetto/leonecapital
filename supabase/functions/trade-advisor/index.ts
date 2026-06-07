import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildSystemPrompt } from "../_shared/atlas-prompt.ts";

const ALLOWED_ORIGINS = ["https://edgeflow.capital", "https://www.edgeflow.capital", "https://leone.capital", "https://www.leone.capital", "http://localhost:8080", "http://localhost:5173"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function validateRequest(body: any) {
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new Error("messages array is required");
  }
  for (const m of body.messages) {
    if (!["user", "assistant"].includes(m.role)) throw new Error("Invalid role");
    if (typeof m.content !== "string" || m.content.length > 8000)
      throw new Error("Content must be a string under 8000 chars");
  }
  if (body.tradesSummary && typeof body.tradesSummary !== "string") {
    throw new Error("tradesSummary must be a string");
  }
  if (body.recentTrades && !Array.isArray(body.recentTrades)) {
    throw new Error("recentTrades must be an array");
  }
  if (body.criteriaDefinitions && !Array.isArray(body.criteriaDefinitions)) {
    throw new Error("criteriaDefinitions must be an array");
  }
}
// Hourly rate limiter — abuse prevention for all tiers (not the free-tier AI cap)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxRequests = 20;
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // ── JWT verification ────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Service role client for reads that bypass RLS (subscriptions, profiles)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Cryptographic JWT verification via Supabase Auth (not manual base64 decode)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // ── Subscription tier check ─────────────────────────────────────────────
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tier = subscription?.plan ?? "free";
    const status = subscription?.status ?? "active";
    const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end).getTime() : null;
    const trialActive = status === "trialing" && periodEnd !== null && periodEnd > Date.now();
    const isPro = (tier === "pro" || tier === "elite") &&
      (status === "active" || status === "past_due" || status === "cancelling" || trialActive);

    if (!isPro) {
      return new Response(
        JSON.stringify({ error: "upgrade_required" }),
        {
          status: 402,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // ── Hourly rate limit (all tiers) ───────────────────────────────────────
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. You can send 20 messages per hour." }),
        {
          status: 429,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    validateRequest(body);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(
      body.tradesSummary || "No trades data available.",
      body.recentTrades || [],
      body.traderProfile || null,
      body.criteriaDefinitions || []
    );

    const anthropicMessages = body.messages.slice(-20).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let response: Response | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          system: systemPrompt,
          messages: anthropicMessages,
          stream: true,
        }),
      });
      if (response.ok) break;
      lastError = await response.text();
      console.error(`Anthropic attempt ${attempt + 1} failed:`, response.status, lastError);
      if (response.status !== 429) break;
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return new Response(
          JSON.stringify({ error: "The AI service is temporarily at capacity. Please try again in a few seconds." }),
          {
            status: 429,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: `AI error (${response?.status}): ${lastError.slice(0, 300)}` }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ── Stream Anthropic SSE → OpenAI-compatible SSE ────────────────────────
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let newline: number;
          while ((newline = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, newline).replace(/\r$/, "");
            buf = buf.slice(newline + 1);

            if (line.startsWith("event:")) continue;
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;

            try {
              const evt = JSON.parse(json);
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta.text) {
                const chunk = JSON.stringify({ choices: [{ delta: { content: evt.delta.text } }] });
                await writer.write(encoder.encode(`data: ${chunk}\n\n`));

              } else if (evt.type === "message_stop") {
                await writer.write(encoder.encode("data: [DONE]\n\n"));
              }
            } catch { /* skip malformed lines */ }
          }
        }
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("trade-advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
