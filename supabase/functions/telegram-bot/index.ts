import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const TG = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function send(chatId: string, text: string) {
  await fetch(`${TG}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function getStats(supabase: ReturnType<typeof createClient>) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const [
    { count: todayTrades },
    { count: yesterdayTrades },
    { count: totalTrades },
    { count: onboardingCompleted },
  ] = await Promise.all([
    supabase.from("trades").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("trades").select("*", { count: "exact", head: true })
      .gte("created_at", yesterday).lt("created_at", today),
    supabase.from("trades").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_completed", true),
  ]);

  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const allUsers = authData?.users ?? [];
  const totalAuthUsers = allUsers.length;
  const todayAuthSignups = allUsers.filter((u: any) => u.created_at?.slice(0, 10) === today).length;
  const yesterdayAuthSignups = allUsers.filter((u: any) => u.created_at?.slice(0, 10) === yesterday).length;
  const onboardingDropoff = totalAuthUsers - (onboardingCompleted ?? 0);

  return {
    totalUsers: totalAuthUsers,
    todaySignups: todayAuthSignups,
    yesterdaySignups: yesterdayAuthSignups,
    todayTrades,
    yesterdayTrades,
    totalTrades,
    onboardingCompleted,
    onboardingDropoff,
    allUsers,
  };
}

async function getUsersWithZeroTrades(supabase: ReturnType<typeof createClient>, allUsers: any[]) {
  const { data: usersWithTrades } = await supabase
    .from("trades").select("user_id").limit(1000);
  const activeIds = new Set((usersWithTrades ?? []).map((t: any) => t.user_id));
  return allUsers.filter((u: any) => !activeIds.has(u.id));
}

async function handleCommand(command: string, args: string, chatId: string, supabase: ReturnType<typeof createClient>) {
  const cmd = command.toLowerCase().split("@")[0];

  if (cmd === "/start" || cmd === "/help") {
    await send(chatId,
      `*EdgeFlow Command Center* 🚀\n\n` +
      `📊 *STATS*\n` +
      `/stats — live snapshot\n` +
      `/users — recent signups\n` +
      `/trades — trading activity\n\n` +
      `🤖 *AGENT*\n` +
      `/ask [question] — Claude answers using your live data\n\n` +
      `*Examples:*\n` +
      `/ask which users have 0 trades?\n` +
      `/ask what instruments are most popular?\n` +
      `/ask who signed up today?`
    );
    return;
  }

  if (cmd === "/stats") {
    const { totalUsers, todaySignups, yesterdaySignups, todayTrades, totalTrades, onboardingCompleted, onboardingDropoff } = await getStats(supabase);
    const label = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    await send(chatId,
      `📊 *Live Stats — ${label}*\n\n` +
      `👥 Total signups: *${totalUsers}*\n` +
      `🟢 New today: *${todaySignups}* | Yesterday: *${yesterdaySignups}*\n` +
      `✅ Completed onboarding: *${onboardingCompleted ?? 0}*\n` +
      `⚠️ Dropped off: *${onboardingDropoff}*\n\n` +
      `📈 Trades today: *${todayTrades ?? 0}*\n` +
      `📚 Total trades: *${totalTrades ?? 0}*`
    );
    return;
  }

  if (cmd === "/users") {
    const { allUsers, totalUsers } = await getStats(supabase);
    const recent = [...allUsers]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);

    const list = recent.map((u: any) => {
      const date = new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `• ${u.email} — ${date}`;
    }).join("\n");

    await send(chatId, `👥 *Recent Signups*\nTotal: *${totalUsers}*\n\n${list}`);
    return;
  }

  if (cmd === "/trades") {
    const { todayTrades, yesterdayTrades, totalTrades, allUsers } = await getStats(supabase);

    const { data: recentTrades } = await supabase
      .from("trades")
      .select("instrument, direction, outcome, pnl, user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    const trades = recentTrades ?? [];
    const wins = trades.filter((t: any) => t.outcome === "win").length;
    const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

    const instrumentCounts: Record<string, number> = {};
    trades.forEach((t: any) => {
      if (t.instrument) instrumentCounts[t.instrument] = (instrumentCounts[t.instrument] ?? 0) + 1;
    });
    const topInstruments = Object.entries(instrumentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ");

    const zeroTradeUsers = await getUsersWithZeroTrades(supabase, allUsers);

    await send(chatId,
      `📈 *Trading Activity*\n\n` +
      `Today: *${todayTrades ?? 0}* | Yesterday: *${yesterdayTrades ?? 0}*\n` +
      `Total trades: *${totalTrades ?? 0}*\n` +
      `Win rate (last 50): *${winRate}%*\n` +
      `Top instruments: ${topInstruments || "none yet"}\n\n` +
      `😴 Users with 0 trades: *${zeroTradeUsers.length}*`
    );
    return;
  }

  if (cmd === "/ask") {
    if (!args.trim()) {
      await send(chatId, "Usage: /ask [your question]\n\nExample:\n/ask which users have never logged a trade?");
      return;
    }

    await send(chatId, "🤔 _Thinking..._");

    const { totalUsers, todaySignups, todayTrades, totalTrades, onboardingCompleted, onboardingDropoff, allUsers } = await getStats(supabase);

    const { data: recentTrades } = await supabase
      .from("trades")
      .select("instrument, direction, outcome, pnl, strategy, session, date, followed_plan, emotional_state, user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    // Onboarding funnel data
    const { data: accounts } = await supabase
      .from("accounts")
      .select("user_id");
    const { data: criteriaSettings } = await supabase
      .from("criteria_settings")
      .select("user_id");
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nickname, onboarding_completed, created_at");

    const usersWithAccounts = new Set((accounts ?? []).map((a: any) => a.user_id));
    const usersWithCriteria = new Set((criteriaSettings ?? []).map((c: any) => c.user_id));
    const usersWithTrades2 = new Set((recentTrades ?? []).map((t: any) => t.user_id));

    const funnelData = allUsers.map((u: any) => {
      const profile = (profiles ?? []).find((p: any) => p.id === u.id);
      const step = !profile ? "step1_no_profile"
        : !usersWithAccounts.has(u.id) ? "step2_no_account"
        : !usersWithCriteria.has(u.id) ? "step3_no_criteria"
        : !profile.onboarding_completed ? "step4_incomplete"
        : !usersWithTrades2.has(u.id) ? "completed_no_trades"
        : "active";
      return { email: u.email, step, joined: u.created_at?.slice(0, 10) };
    });

    const zeroTradeUsers = await getUsersWithZeroTrades(supabase, allUsers);
    const today = new Date().toISOString().slice(0, 10);
    const todayUsers = allUsers
      .filter((u: any) => u.created_at?.slice(0, 10) === today)
      .map((u: any) => u.email);

    const context =
      `You are the EdgeFlow ops assistant for a solo founder.\n` +
      `EdgeFlow is an AI trading journal SaaS at edgeflow.capital.\n\n` +
      `LIVE STATS:\n` +
      `- Total signups: ${totalUsers}\n` +
      `- New today: ${todaySignups}\n` +
      `- Completed onboarding: ${onboardingCompleted}\n` +
      `- Dropped off in onboarding: ${onboardingDropoff}\n` +
      `- Users with 0 trades: ${zeroTradeUsers.length} — ${zeroTradeUsers.map((u: any) => u.email).join(", ") || "none"}\n` +
      `- Trades today: ${todayTrades}\n` +
      `- Total trades: ${totalTrades}\n\n` +
      `TODAY'S SIGNUPS: ${todayUsers.join(", ") || "none yet"}\n\n` +
      `ALL USERS (email + signup date):\n` +
      allUsers.map((u: any) => `${u.email} — ${u.created_at?.slice(0, 10)}`).join("\n") + "\n\n" +
      `ONBOARDING FUNNEL (where each user dropped off):\n` +
      `- step1_no_profile = never created profile\n` +
      `- step2_no_account = no trading account added\n` +
      `- step3_no_criteria = no checklist criteria\n` +
      `- step4_incomplete = started but didn't finish\n` +
      `- completed_no_trades = finished onboarding, 0 trades\n` +
      `- active = completed + has trades\n` +
      funnelData.map((u: any) => `${u.email} → ${u.step} (joined ${u.joined})`).join("\n") + "\n\n" +
      `RECENT TRADES (last 50):\n${JSON.stringify(recentTrades, null, 2)}\n\n` +
      `Answer in under 150 words. Be direct and specific. No fluff.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: `${context}\n\nQuestion: ${args}` }],
      }),
    });

    const data = await res.json();
    const answer = data.content?.[0]?.text ?? "Could not get an answer.";
    await send(chatId, `🤖 *Atlas says:*\n\n${answer}`);
    return;
  }

  await send(chatId, "Unknown command. Type /help to see available commands.");
}

async function sendMorningBrief(supabase: ReturnType<typeof createClient>) {
  const { totalUsers, todaySignups, yesterdaySignups, todayTrades, yesterdayTrades, totalTrades, onboardingCompleted, onboardingDropoff, allUsers } = await getStats(supabase);
  const zeroTradeUsers = await getUsersWithZeroTrades(supabase, allUsers);

  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const signupTrend = yesterdaySignups > 0
    ? ` (+${yesterdaySignups} yesterday)`
    : "";

  await send(
    TELEGRAM_CHAT_ID,
    `☀️ *Morning Briefing — ${date}*\n\n` +
    `👥 Total users: *${totalUsers}*${signupTrend}\n` +
    `✅ Onboarded: *${onboardingCompleted ?? 0}* | Dropped: *${onboardingDropoff}*\n` +
    `😴 Never traded: *${zeroTradeUsers.length}*\n\n` +
    `📈 Trades yesterday: *${yesterdayTrades ?? 0}*\n` +
    `📚 Total trades: *${totalTrades ?? 0}*\n\n` +
    `_Type /stats for live numbers or /ask anything_`
  );
}

serve(async (req) => {
  try {
    const body = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Morning briefing — called by pg_cron
    if (body.type === "morning-brief") {
      const secret = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
      if (secret !== CRON_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      await sendMorningBrief(supabase);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Sentry webhook — error alert
    if (body.action === "created" && body.data?.issue) {
      const issue = body.data.issue;
      const title = issue.title ?? "Unknown error";
      const culprit = issue.culprit ?? "";
      const level = issue.level ?? "error";
      const count = issue.count ?? 1;
      const emoji = level === "fatal" ? "💀" : level === "error" ? "🔴" : "🟡";

      await send(
        TELEGRAM_CHAT_ID,
        `${emoji} *New ${level.toUpperCase()} — Sentry*\n\n` +
        `*${title}*\n` +
        `${culprit ? `File: \`${culprit}\`\n` : ""}` +
        `Hits: ${count}\n\n` +
        `_Check Sentry for full trace_`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }

    // GitHub Action deploy notification
    if (body.type === "deploy") {
      const { status, commit, branch } = body;
      const emoji = status === "success" ? "🚀" : "❌";
      await send(
        TELEGRAM_CHAT_ID,
        `${emoji} *Deploy ${status}*\n` +
        `${commit ? `"${commit}"\n` : ""}` +
        `Branch: ${branch ?? "main"}\n` +
        `edgeflow.capital`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Supabase DB webhook — new signup
    if (body.type === "INSERT" && body.table === "profiles") {
      const record = body.record;
      const { data: authUser } = await supabase.auth.admin.getUserById(record.id);
      const email = authUser?.user?.email ?? "unknown";
      const nickname = record.nickname ?? null;

      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const totalUsers = authData?.users?.length ?? "?";

      const nameStr = nickname ? ` (${nickname})` : "";
      await send(
        TELEGRAM_CHAT_ID,
        `🟢 *New Signup #${totalUsers}*\n${email}${nameStr}\n\n👥 Total: *${totalUsers}*`
      );
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Telegram webhook — incoming message from you
    if (body.message) {
      const msg = body.message;
      const chatId = msg.chat.id.toString();
      const text: string = msg.text ?? "";

      if (chatId !== TELEGRAM_CHAT_ID) {
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }

      const parts = text.trim().split(" ");
      const command = parts[0];
      const args = parts.slice(1).join(" ");
      await handleCommand(command, args, chatId, supabase);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("telegram-bot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
