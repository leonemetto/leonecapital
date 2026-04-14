import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Called by Supabase cron every Monday at 07:00 UTC
// Sends a weekly performance digest to every active user (≥1 trade in last 7 days)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "EdgeFlow <noreply@leone.capital>";
const APP_URL = "https://www.leone.capital";

interface WeekStats {
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
  bestDay: string;
  worstDay: string;
  topInstrument: string;
}

function calcWeekStats(trades: any[]): WeekStats {
  const wins = trades.filter((t) => t.outcome === "win").length;
  const losses = trades.filter((t) => t.outcome === "loss").length;
  const netPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

  // Best/worst day by P&L
  const byDay = new Map<string, number>();
  for (const t of trades) {
    byDay.set(t.date, (byDay.get(t.date) ?? 0) + (t.pnl ?? 0));
  }
  let bestDay = "", worstDay = "", bestPnl = -Infinity, worstPnl = Infinity;
  for (const [day, pnl] of byDay) {
    if (pnl > bestPnl) { bestPnl = pnl; bestDay = day; }
    if (pnl < worstPnl) { worstPnl = pnl; worstDay = day; }
  }

  // Top instrument by net P&L
  const byInst = new Map<string, number>();
  for (const t of trades) byInst.set(t.instrument, (byInst.get(t.instrument) ?? 0) + (t.pnl ?? 0));
  let topInstrument = "", topPnl = -Infinity;
  for (const [inst, pnl] of byInst) {
    if (pnl > topPnl) { topPnl = pnl; topInstrument = inst; }
  }

  return { trades: trades.length, wins, losses, netPnl, winRate, bestDay, worstDay, topInstrument };
}

async function getGeminiInsight(stats: WeekStats, trades: any[]): Promise<string> {
  if (!GEMINI_API_KEY) return "";
  const tradeLines = trades.slice(0, 20).map((t) =>
    `${t.date} | ${t.instrument} | ${t.direction} | ${t.outcome} | $${t.pnl}${t.session ? ` | ${t.session}` : ""}${t.emotionalState ? ` | Emo:${t.emotionalState}/5` : ""}`
  ).join("\n");

  const prompt = `You are a trading performance analyst. A trader had the following week:
- ${stats.trades} trades, ${stats.winRate}% win rate, $${stats.netPnl.toFixed(2)} net P&L
- Best day: ${stats.bestDay}, Worst day: ${stats.worstDay}
- Top instrument: ${stats.topInstrument}

Recent trades:
${tradeLines}

Write ONE concise insight (2-3 sentences max) about the most important pattern or takeaway from this week. Be specific, use the data, no generic advice. No emojis.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.5 },
        }),
      }
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  } catch {
    return "";
  }
}

function pnlColor(pnl: number): string {
  return pnl >= 0 ? "#10b981" : "#f87171";
}

function buildEmailHtml(nickname: string, stats: WeekStats, insight: string, weekLabel: string): string {
  const pnlStr = `${stats.netPnl >= 0 ? "+" : ""}$${stats.netPnl.toFixed(2)}`;
  const pnlCol = pnlColor(stats.netPnl);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,sans-serif;color:#fff">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 24px">
    <tr><td>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35)">EdgeFlow — Weekly Digest</p>
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;letter-spacing:-0.5px">${nickname}'s week in review</h1>
      <p style="margin:0 0 32px;font-size:13px;color:rgba(255,255,255,0.35)">${weekLabel}</p>

      <!-- Stats row -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:0.5px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:24px">
        <tr>
          <td style="padding:20px;text-align:center;border-right:0.5px solid rgba(255,255,255,0.08)">
            <p style="margin:0 0 4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.35)">Net P&L</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:${pnlCol}">${pnlStr}</p>
          </td>
          <td style="padding:20px;text-align:center;border-right:0.5px solid rgba(255,255,255,0.08)">
            <p style="margin:0 0 4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.35)">Win Rate</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:${stats.winRate >= 50 ? "#10b981" : "#f87171"}">${stats.winRate}%</p>
          </td>
          <td style="padding:20px;text-align:center;border-right:0.5px solid rgba(255,255,255,0.08)">
            <p style="margin:0 0 4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.35)">Trades</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:#fff">${stats.trades}</p>
          </td>
          <td style="padding:20px;text-align:center">
            <p style="margin:0 0 4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.35)">W / L</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:#fff">${stats.wins}<span style="color:rgba(255,255,255,0.3);font-size:16px"> / </span>${stats.losses}</p>
          </td>
        </tr>
      </table>

      ${stats.topInstrument ? `
      <!-- Top instrument -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        <tr>
          <td style="padding:14px 16px;background:rgba(255,255,255,0.02);border:0.5px solid rgba(255,255,255,0.07);border-radius:10px">
            <p style="margin:0 0 2px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.35)">Top Instrument</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#fff">${stats.topInstrument}</p>
          </td>
        </tr>
      </table>` : ""}

      ${insight ? `
      <!-- AI Insight -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
        <tr>
          <td style="padding:20px;background:rgba(255,255,255,0.02);border:0.5px solid rgba(255,255,255,0.08);border-radius:12px;border-left:2px solid rgba(255,255,255,0.2)">
            <p style="margin:0 0 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.35)">AI Insight</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.8)">${insight}</p>
          </td>
        </tr>
      </table>` : ""}

      <a href="${APP_URL}/analyst" style="display:inline-block;background:#fff;color:#000;font-size:14px;font-weight:600;padding:12px 28px;border-radius:24px;text-decoration:none;margin-bottom:32px">View Full Analysis</a>

      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25)">EdgeFlow — Professional Trading Journal &nbsp;·&nbsp; <a href="${APP_URL}/profile" style="color:rgba(255,255,255,0.4)">Manage preferences</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users ?? [];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const weekLabel = `${weekAgo} — ${now.toISOString().slice(0, 10)}`;

    const { data: profiles } = await supabase.from("profiles").select("id, nickname");
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.nickname ?? "Trader"]));

    let sent = 0;
    for (const user of authUsers) {
      if (!user.email) continue;

      const { data: trades } = await supabase
        .from("trades")
        .select("date, instrument, direction, outcome, pnl, session, emotionalState:emotional_state")
        .eq("user_id", user.id)
        .gte("date", weekAgo)
        .order("date", { ascending: false });

      if (!trades || trades.length === 0) continue; // only email active users

      const stats = calcWeekStats(trades);
      const insight = await getGeminiInsight(stats, trades);
      const nickname = profileMap.get(user.id) ?? "Trader";
      const html = buildEmailHtml(nickname, stats, insight, weekLabel);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM,
          to: user.email,
          subject: `${nickname}, your week in trading — ${stats.trades} trades, ${stats.winRate}% win rate`,
          html,
        }),
      });
      if (res.ok) sent++;
      else console.error("Resend error for", user.email, await res.text());
    }

    return new Response(JSON.stringify({ ok: true, sent }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("weekly-digest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
