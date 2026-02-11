import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function validateRequest(body: unknown): { messages: { role: string; content: string }[]; tradesSummary: string } {
  if (!body || typeof body !== "object") throw new Error("Invalid request body");

  const { messages, tradesSummary } = body as Record<string, unknown>;

  // Validate tradesSummary
  if (typeof tradesSummary !== "string" || tradesSummary.length > 50000) {
    throw new Error("Invalid or too long tradesSummary");
  }

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
    throw new Error("Messages must be an array with 1-100 items");
  }

  const validRoles = new Set(["user", "assistant"]);
  const validated = messages.map((m: unknown, i: number) => {
    if (!m || typeof m !== "object") throw new Error(`Invalid message at index ${i}`);
    const msg = m as Record<string, unknown>;
    if (typeof msg.role !== "string" || !validRoles.has(msg.role)) {
      throw new Error(`Invalid role at index ${i}`);
    }
    if (typeof msg.content !== "string" || msg.content.length === 0 || msg.content.length > 10000) {
      throw new Error(`Invalid or too long content at index ${i}`);
    }
    return { role: msg.role, content: msg.content };
  });

  return { messages: validated, tradesSummary };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.json();
    const { messages, tradesSummary } = validateRequest(rawBody);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert trading coach and analyst. The user is a trader who logs their trades in a journal app. You have access to their trading data summary below.

TRADING DATA:
${tradesSummary}

Based on this data, provide actionable, specific advice. Identify patterns in their wins and losses across sessions, instruments, strategies, and directions. Be encouraging but honest. Use concrete numbers from their data. Keep answers concise and focused.

If they ask a general trading question unrelated to their data, answer it but try to relate it back to their specific performance when possible.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("trade-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
