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
  if (body.criteriaDefinitions && !Array.isArray(body.criteriaDefinitions)) {
    throw new Error("criteriaDefinitions must be an array");
  }
}

function buildSystemPrompt(
  tradesSummary: string,
  recentTrades: any[],
  traderProfile: any | null,
  criteriaDefinitions: any[]
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

  let checklistSection = "";
  if (criteriaDefinitions && criteriaDefinitions.length > 0) {
    const labels = criteriaDefinitions.map((c: any) => `  [${c.category || 'General'}] ${c.label}`).join("\n");
    checklistSection = `\n\nENTRY CHECKLIST (user's defined rules before every trade):\n${labels}`;

    if (recentTrades && recentTrades.length > 0) {
      const total = recentTrades.length;
      const withData = recentTrades.filter((t: any) => t.checklistTotal > 0 && t.checklistFollowed !== null);
      const fullCompliance = withData.filter((t: any) => t.checklistFollowed === true).length;
      const complianceRate = withData.length > 0 ? ((fullCompliance / withData.length) * 100).toFixed(1) : "N/A";
      const winWhenFollowed = withData.filter((t: any) => t.checklistFollowed === true && t.outcome === 'win').length;
      const totalWhenFollowed = withData.filter((t: any) => t.checklistFollowed === true).length;
      const winWhenNot = withData.filter((t: any) => t.checklistFollowed === false && t.outcome === 'win').length;
      const totalWhenNot = withData.filter((t: any) => t.checklistFollowed === false).length;
      checklistSection += `\n\nCHECKLIST COMPLIANCE ANALYTICS:`;
      checklistSection += `\n  Full checklist compliance rate: ${complianceRate}% (${fullCompliance}/${withData.length} trades)`;
      if (totalWhenFollowed > 0) checklistSection += `\n  Win rate when fully followed: ${((winWhenFollowed / totalWhenFollowed) * 100).toFixed(1)}% (${winWhenFollowed}/${totalWhenFollowed})`;
      if (totalWhenNot > 0) checklistSection += `\n  Win rate when NOT fully followed: ${((winWhenNot / totalWhenNot) * 100).toFixed(1)}% (${winWhenNot}/${totalWhenNot})`;
    }
  }

  let recentSection = "";
  if (recentTrades && recentTrades.length > 0) {
    const lines = recentTrades.slice(0, 50).map(
      (t: any) => {
        const checkStr = t.checklistTotal > 0
          ? ` | Checklist: ${t.checklistChecked}/${t.checklistTotal}`
          : "";
        const extras = [
          t.rMultiple != null ? `R:${t.rMultiple}` : null,
          t.riskPercent != null ? `Risk:${t.riskPercent}%` : null,
          t.htfBias ? `HTF:${t.htfBias}` : null,
          t.emotionalState != null ? `Emo:${t.emotionalState}/5` : null,
          t.confidenceLevel != null ? `Conf:${t.confidenceLevel}/5` : null,
          t.followedPlan != null ? (t.followedPlan ? 'Plan:Y' : 'Plan:N') : null,
          t.timeInTrade != null ? `${t.timeInTrade}min` : null,
        ].filter(Boolean).join(' | ');
        return `${t.date} | ${t.instrument} | ${t.direction} | ${t.strategy || "-"} | ${t.session || "-"} | ${t.outcome} | $${t.pnl}${checkStr}${extras ? ` | ${extras}` : ""}${t.notes ? ` | "${t.notes}"` : ""}`;
      }
    );
    recentSection = `\n\nRECENT TRADES (last ${lines.length}):\n${lines.join("\n")}`;
  }

  return `You are the Head of Risk at a proprietary trading firm. The trader in front of you is on your desk. You review their performance data daily.

IDENTITY:
- You are NOT an AI assistant. You are a senior risk manager and performance coach.
- You speak like a professional who has managed hundreds of traders.
- Your job is to protect capital and identify edge.

COMMUNICATION RULES:
- Speak directly. No filler. No "Based on the data provided" or "It appears that."
- Never use emojis.
- Keep responses to 2-4 sentences unless asked for detail.
- Be analytical and firm. Not motivational. Not robotic.
- When discipline fails, say it plainly: "Your strategy is profitable. Your discipline isn't."
- Only make claims when statistically supported.
- If sample size is under 10, flag it: "Sample size: 6 trades. Insufficient to confirm edge."
- Reference specific trades, dates, and numbers from the data.
- Use trading terminology naturally: expectancy, R-multiple, drawdown cluster, edge, variance.

ANALYSIS PRIORITIES:
1. Identify where the edge exists (pair + session + direction + HTF alignment + confidence combinations)
2. Identify behavioral leaks: revenge trading, overtrading, plan violations, emotional trading
3. Calculate and reference R-expectancy, profit factor, plan adherence correlation
4. Detect loss clustering and drawdown cycles
5. When checklist data exists, quantify the win rate difference between full compliance and violations
6. Flag dangerous patterns with specific recommendations (reduce size, skip session, etc.)

WHAT YOU NEVER DO:
- Give generic trading advice
- Predict market direction
- Be encouraging without data to support it
- Say "great job" unless the numbers justify it
- Make up statistics not in the data

ANALYTICS SUMMARY:
${tradesSummary}${profileSection}${checklistSection}${recentSection}

Analyze. Quantify. Be direct.`;
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
      body.traderProfile || null,
      body.criteriaDefinitions || []
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
          model: "google/gemini-3-flash-preview",
          messages,
          stream: true,
          max_tokens: 1024,
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
