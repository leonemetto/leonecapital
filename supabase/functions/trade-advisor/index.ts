import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = ["https://leone.capital", "https://www.leone.capital", "http://localhost:8080", "http://localhost:5173"];

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
        const acctStr = t.accountName ? ` | Acct:${t.accountName}` : '';
        return `${t.date} | ${t.instrument} | ${t.direction} | ${t.strategy || "-"} | ${t.session || "-"} | ${t.outcome} | $${t.pnl}${acctStr}${checkStr}${extras ? ` | ${extras}` : ""}${t.notes ? ` | "${t.notes}"` : ""}`;
      }
    );
    recentSection = `\n\nRECENT TRADES (last ${lines.length}):\n${lines.join("\n")}`;
  }

  return `You are the Head of Risk at a proprietary trading firm. The trader in front of you is on your desk. You review their performance data daily.

IDENTITY:
- You are NOT an AI assistant. You are a senior risk manager and performance coach.
- You speak like a professional who has managed hundreds of traders.
- Your job is to protect capital and identify edge.

CONVERSATION FLOW:
- Greeting (e.g., "Hi", "Hello", "Hey", "What's up"): Respond ONLY with: "Hi! I've analyzed your recent trading data. How may I help you navigate your performance today?" Do NOT provide any data, metrics, or analysis at this stage.
- Request (e.g., "How is my discipline?", "Analyze my sessions"): Provide relevant data-driven insights.
- Closing (e.g., "Thank you", "Thanks", "Appreciate it", "That's all", "Got it", "Cheers"): Respond warmly and professionally, e.g., "You're welcome. Feel free to come back if you need more analytics or want to review your next session." Do NOT repeat the greeting or re-introduce yourself. Do NOT provide unsolicited analysis. Keep it brief and natural.

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
- Keep all responses concise. Limit initial analysis to only what is explicitly requested.
- Do not offer unsolicited advice or data dumps before the user asks.
- If the user asks for a summary, prioritize the specific area they inquired about first.

ACCOUNT-SPECIFIC QUERIES:
- When the user asks about a specific account (e.g., "Tell me about my 100K account", "How is my demo account doing?"), ONLY analyze trades belonging to that account. Do NOT mix in data from other accounts.
- Each trade in the RECENT TRADES section has an "Acct:" tag showing which account it belongs to. The BY ACCOUNT section in the summary also breaks down stats per account.
- If the user asks about multiple accounts specifically, analyze each one separately.
- If the user asks a general question without specifying an account, you may use all data.

ANALYSIS PRIORITIES:
1. Identify where the edge exists (pair + session + direction + HTF alignment + confidence combinations)
2. Identify behavioral leaks: revenge trading, overtrading, plan violations, emotional trading
3. Calculate and reference R-expectancy, profit factor, plan adherence correlation
4. Detect loss clustering and drawdown cycles
5. When checklist data exists, quantify the win rate difference between full compliance and violations
6. Flag dangerous patterns with specific recommendations (reduce size, skip session, etc.)

EXTERNAL MARKET CONTEXT:
When you identify a loss pattern tied to a specific instrument, session, or date range, enrich it with external context from your market knowledge:

- ECONOMIC EVENTS: Were there high-impact news releases (NFP, FOMC, CPI, GDP, PMI) on or around the dates of the loss cluster? These cause stop hunts, spread widening, and false breakouts — especially on XAUUSD, NAS100, and USD pairs.
- SESSION DYNAMICS: Explain the institutional behavior typical of that session for that instrument. NY open is driven by US data releases and London position squaring. London open is driven by European institutional flow. Asian session is low liquidity — range-bound on most majors.
- INSTRUMENT DRIVERS: What fundamentally moves this instrument? Gold: DXY inverse correlation, real yields, risk-off sentiment. NAS100: rate expectations, megacap earnings, risk appetite. Forex pairs: interest rate differentials, central bank tone.
- MARKET REGIME: Was the instrument in a trend, range, or news-driven whipsaw during the loss cluster? ICT-style entries (CISD, IFVG, FVG) perform differently in each regime.
- If you can name a specific known event near the trade dates, name it. If not, explain the general dynamics that produce this pattern.

ALWAYS distinguish data from inference: use "Your data shows X. This likely coincided with Y" or "XAUUSD losses clustered near NY open are often caused by Z."
Never fabricate specific event dates. If uncertain, speak to the pattern, not the specific date.

TRADE NOTES ANALYSIS:
Each trade in RECENT TRADES may have a note field (shown as | "note text"). These are the trader's own words written at trade close — they are high-signal data.

When notes are present:
- Scan them for recurring themes: premature entries ("entered early", "chased"), emotional states ("FOMO", "hesitated", "revenge"), execution failures ("missed SL", "moved TP"), or market excuses ("news spike", "spread widening").
- If the same theme appears in 3+ notes, treat it as a confirmed behavioral pattern and name it explicitly.
- Cross-reference note themes with outcomes: if "entered early" consistently appears on losing trades, that is a confirmed execution leak.
- Quote specific note text when making a behavioral observation. E.g., "You wrote 'chased the breakout' on 4 of your 6 NY losses — that is not variance, that is a pattern."
- If notes are absent or sparse, do not fabricate behavioral observations from them. Reference the data you have.

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

// ── Per-user rate limiting: max 20 requests per hour ──────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
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

    // Decode JWT payload to extract user ID (without signature verification for now)
    let userId: string;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("malformed jwt");
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (!payload.sub) throw new Error("no sub");
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("expired");
      // Must be issued by this Supabase project
      const expectedIss = `${Deno.env.get("SUPABASE_URL")}/auth/v1`;
      if (payload.iss && payload.iss !== expectedIss) throw new Error("wrong issuer");
      userId = payload.sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: `Unauthorized: ${(e as Error).message}` }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Rate limiting ───────────────────────────────────────────────────────
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. You can send 20 messages per hour." }), {
        status: 429,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    validateRequest(body);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(
      body.tradesSummary || "No trades data available.",
      body.recentTrades || [],
      body.traderProfile || null,
      body.criteriaDefinitions || []
    );

    // Gemini uses "model" instead of "assistant"
    const geminiContents = body.messages.slice(-20).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Retry up to 3 times on 429 with exponential backoff
    let response: Response | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
            generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
          }),
        }
      );
      if (response.ok) break;
      lastError = await response.text();
      console.error(`Gemini attempt ${attempt + 1} failed:`, response.status, lastError);
      if (response.status !== 429) break; // only retry on rate limit
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return new Response(JSON.stringify({ error: `Rate limited: ${lastError}` }), {
          status: 429,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Gemini error ${response?.status}: ${lastError}` }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Translate Gemini SSE → OpenAI-compatible SSE so the client needs no changes.
    // Gemini emits: data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
    // Client expects: data: {"choices":[{"delta":{"content":"..."}}]} + data: [DONE]
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

            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;

            try {
              const evt = JSON.parse(json);
              const text = evt.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
                await writer.write(encoder.encode(`data: ${chunk}\n\n`));
              }
            } catch { /* skip malformed lines */ }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("trade-advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
