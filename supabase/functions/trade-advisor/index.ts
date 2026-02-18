import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
}

function buildSystemPrompt(
  tradesSummary: string,
  recentTrades: any[],
  traderProfile: any | null
): string {
  let profileSection = "";
  if (traderProfile) {
    const parts: string[] = [];
    if (traderProfile.trading_style) parts.push(`Trading Style: ${traderProfile.trading_style}`);
    if (traderProfile.favorite_instruments) parts.push(`Favorite Instruments: ${traderProfile.favorite_instruments}`);
    if (traderProfile.favorite_sessions) parts.push(`Favorite Sessions: ${traderProfile.favorite_sessions}`);
    if (traderProfile.account_goals) parts.push(`Account Goals: ${traderProfile.account_goals}`);
    if (traderProfile.common_mistakes) parts.push(`Known Mistakes: ${traderProfile.common_mistakes}`);
    if (traderProfile.trading_rules) parts.push(`Personal Rules: ${traderProfile.trading_rules}`);
    if (traderProfile.risk_per_trade) parts.push(`Risk Per Trade: ${traderProfile.risk_per_trade}`);
    if (traderProfile.mental_triggers) parts.push(`Mental/Emotional Triggers: ${traderProfile.mental_triggers}`);
    if (traderProfile.notes) parts.push(`Additional Notes: ${traderProfile.notes}`);

    const memory = traderProfile.behavioral_memory;
    if (Array.isArray(memory) && memory.length > 0) {
      parts.push(`\nBEHAVIORAL MEMORY (past AI observations):\n${memory.slice(-10).map((m: any) => `- ${typeof m === 'string' ? m : m.insight || JSON.stringify(m)}`).join("\n")}`);
    }
    if (parts.length > 0) profileSection = `\n\nTRADER PROFILE:\n${parts.join("\n")}`;
  }

  let recentSection = "";
  if (recentTrades && recentTrades.length > 0) {
    const lines = recentTrades.slice(0, 50).map(
      (t: any) =>
        `${t.date} | ${t.instrument} | ${t.direction} | ${t.strategy || "-"} | ${t.session || "-"} | ${t.outcome} | $${t.pnl}${t.notes ? ` | "${t.notes}"` : ""}`
    );
    recentSection = `\n\nRECENT TRADES (last ${lines.length}):\nDate | Instrument | Direction | Strategy | Session | Outcome | P&L | Notes\n${lines.join("\n")}`;
  }

  return `You are the user's personal Risk Manager and Quant Coach. You have deep knowledge of trading psychology, risk management, and quantitative analysis.

ROLE & BEHAVIOR:
- Act as a strict but supportive risk manager who identifies behavioral leaks
- Focus on finding "drains" — patterns like FOMO, revenge trading, overtrading, session drift, rule-breaking
- Reference specific trades and patterns from the data, not generic advice
- When trade data is present, calculate and reference Profit Factor and identify Max Adverse Excursion patterns (using P&L as proxy)
- Keep responses concise: 2-4 sentences max unless asked for detail
- Be conversational, direct, and occasionally use trading slang
- If the user's actions contradict their stated rules or goals, call it out firmly but constructively

ANALYTICS SUMMARY:
${tradesSummary}${profileSection}${recentSection}

Use all this context to give hyper-personalized, data-driven advice. Never make up trades or stats not in the data.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    validateRequest(body);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(
      body.tradesSummary || "No trades data available.",
      body.recentTrades || [],
      body.traderProfile || null
    );

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...body.messages.slice(-20).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages,
          stream: true,
          max_completion_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("trade-advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
