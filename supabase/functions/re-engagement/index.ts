import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Called by Supabase cron daily at 08:00 UTC
// Sends re-engagement emails to users inactive for exactly 3 or 7 days

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "EdgeFlow <noreply@leone.capital>";
const APP_URL = "https://www.leone.capital";

function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function email3Day(nickname: string, tradeCount: number): { subject: string; html: string } {
  const tradesLeft = Math.max(0, 10 - tradeCount);
  const aiLine = tradeCount >= 10
    ? `<p style="margin:0 0 16px">Your <strong>AI Advisor</strong> is ready — you have enough data for it to surface real patterns in your trading.</p>`
    : `<p style="margin:0 0 16px">You're <strong>${tradesLeft} trade${tradesLeft !== 1 ? 's' : ''} away</strong> from unlocking your AI Advisor. Log a few more and it will start identifying patterns specific to your trading.</p>`;

  return {
    subject: `${nickname}, your trading edge is waiting`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,sans-serif;color:#fff">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 24px">
    <tr><td>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35)">EdgeFlow</p>
      <h1 style="margin:0 0 24px;font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.2">Your journal is waiting,<br>${nickname}.</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7)">You haven't logged a trade in 3 days. The traders who improve fastest are the ones who log consistently — not perfectly.</p>
      ${aiLine}
      <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7)">Takes 60 seconds. Open your journal and log today's trade.</p>
      <a href="${APP_URL}/add-trade" style="display:inline-block;background:#fff;color:#000;font-size:14px;font-weight:600;padding:12px 28px;border-radius:24px;text-decoration:none">Log a Trade</a>
      <p style="margin:32px 0 0;font-size:12px;color:rgba(255,255,255,0.25)">You're receiving this because you have an EdgeFlow account. <a href="${APP_URL}/profile" style="color:rgba(255,255,255,0.4)">Manage preferences</a></p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function email7Day(nickname: string, tradeCount: number): { subject: string; html: string } {
  return {
    subject: `${nickname}, it's been a week — here's what you're missing`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,sans-serif;color:#fff">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 24px">
    <tr><td>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35)">EdgeFlow</p>
      <h1 style="margin:0 0 24px;font-size:26px;font-weight:700;letter-spacing:-0.5px;line-height:1.2">A week without data<br>is a week without edge.</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7)">You have <strong>${tradeCount} trade${tradeCount !== 1 ? 's' : ''}</strong> logged. That data is sitting there, but the patterns only get clearer when you keep building on them.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7)">Traders who journal for 30 consecutive days discover at least one leak that costs them more than any subscription fee. You're 7 days behind.</p>
      <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7)">Come back. Log one trade. That's all it takes to restart the streak.</p>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#fff;color:#000;font-size:14px;font-weight:600;padding:12px 28px;border-radius:24px;text-decoration:none">Open Dashboard</a>
      <p style="margin:32px 0 0;font-size:12px;color:rgba(255,255,255,0.25)">You're receiving this because you have an EdgeFlow account. <a href="${APP_URL}/profile" style="color:rgba(255,255,255,0.4)">Manage preferences</a></p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Resend error for ${to}:`, err);
  }
}

const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

serve(async (req) => {
  // Verify caller is Supabase cron or an authorized admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const incomingSecret = authHeader.replace("Bearer ", "").trim();
  if (!CRON_SECRET || incomingSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users with their last trade date and trade count
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, nickname, email:id");

    if (error) throw error;

    // Get auth users for emails
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsers = authData?.users ?? [];
    const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? ""]));

    let sent3 = 0, sent7 = 0;

    for (const profile of users ?? []) {
      const email = emailMap.get(profile.id);
      if (!email) continue;

      // Get last trade date + count for this user
      const { data: trades } = await supabase
        .from("trades")
        .select("date")
        .eq("user_id", profile.id)
        .order("date", { ascending: false });

      const tradeCount = trades?.length ?? 0;
      const lastTradeDate = trades?.[0]?.date ?? null;

      // Also check last login from auth
      const authUser = authUsers.find((u) => u.id === profile.id);
      const lastActive = lastTradeDate ?? authUser?.last_sign_in_at?.slice(0, 10) ?? null;
      if (!lastActive) continue;

      const days = daysSince(lastActive);
      const nickname = profile.nickname || "Trader";

      if (days === 3) {
        const { subject, html } = email3Day(nickname, tradeCount);
        await sendEmail(email, subject, html);
        sent3++;
      } else if (days === 7) {
        const { subject, html } = email7Day(nickname, tradeCount);
        await sendEmail(email, subject, html);
        sent7++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent3day: sent3, sent7day: sent7 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("re-engagement error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
