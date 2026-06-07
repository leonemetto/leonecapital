import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Segment = "dropped_before_onboarding" | "onboarded_no_trades";

type ProfileRow = {
  user_id: string;
  nickname: string | null;
  onboarding_completed: boolean;
  created_at: string;
};

type OutreachRow = {
  user_id: string;
  campaign_key: string;
};

type Candidate = {
  userId: string;
  email: string;
  nickname: string;
  segment: Segment;
  subject: string;
  text: string;
};

const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const dryRun = args.has("--dry-run") || !send;
const campaignKey = getArgValue("--campaign") ?? "first_trade_activation_june_2026";
const limit = Number(getArgValue("--limit") ?? "0");

loadDotEnv();

const supabaseUrl = getEnv("SUPABASE_URL") ?? getEnv("VITE_SUPABASE_URL");
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = getEnv("RESEND_API_KEY");
const from = getEnv("OUTREACH_FROM") ?? "Leone at EdgeFlow <support@edgeflow.capital>";
const replyTo = getEnv("OUTREACH_REPLY_TO") ?? "support@edgeflow.capital";
const appUrl = getEnv("APP_URL") ?? "https://www.edgeflow.capital";

if (!supabaseUrl) fail("Missing SUPABASE_URL or VITE_SUPABASE_URL.");
if (!serviceRoleKey) fail("Missing SUPABASE_SERVICE_ROLE_KEY.");
if (send && !resendApiKey) fail("Missing RESEND_API_KEY. It is only required when using --send.");
if (send && args.has("--dry-run")) fail("Use either --dry-run or --send, not both.");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const profiles = await getProfiles();
const emailByUserId = await getAuthEmails();
const tradeCountByUserId = await getTradeCounts();
const alreadyContacted = await getAlreadyContacted();

const candidates = profiles
  .map((profile): Candidate | null => {
    const email = emailByUserId.get(profile.user_id);
    if (!email) return null;
    if (alreadyContacted.has(profile.user_id)) return null;

    const tradeCount = tradeCountByUserId.get(profile.user_id) ?? 0;
    const nickname = cleanNickname(profile.nickname);

    if (!profile.onboarding_completed) {
      return buildCandidate(profile.user_id, email, nickname, "dropped_before_onboarding");
    }

    if (tradeCount === 0) {
      return buildCandidate(profile.user_id, email, nickname, "onboarded_no_trades");
    }

    return null;
  })
  .filter((candidate): candidate is Candidate => candidate !== null)
  .slice(0, limit > 0 ? limit : undefined);

const dropped = candidates.filter((candidate) => candidate.segment === "dropped_before_onboarding").length;
const onboardedNoTrades = candidates.filter((candidate) => candidate.segment === "onboarded_no_trades").length;

console.log("");
console.log(`Campaign: ${campaignKey}`);
console.log(`Mode: ${dryRun ? "dry run" : "send"}`);
console.log(`From: ${from}`);
console.log(`Reply-To: ${replyTo}`);
console.log("");
console.log(`Profiles checked: ${profiles.length}`);
console.log(`Already contacted for this campaign: ${alreadyContacted.size}`);
console.log(`Ready to contact: ${candidates.length}`);
console.log(`- Dropped before onboarding: ${dropped}`);
console.log(`- Onboarded with zero trades: ${onboardedNoTrades}`);
console.log("");

for (const [index, candidate] of candidates.entries()) {
  printPreview(index + 1, candidate);

  if (!send) continue;

  const providerMessageId = await sendEmail(candidate);
  await recordOutreach(candidate, providerMessageId);
  console.log(`Sent and logged: ${candidate.email}`);
}

if (dryRun) {
  console.log("Dry run complete. Nothing was sent.");
  console.log("Run `npm run outreach:first-trade -- --send` when the preview looks right.");
} else {
  console.log(`Done. Sent ${candidates.length} email${candidates.length === 1 ? "" : "s"}.`);
}

function buildCandidate(userId: string, email: string, nickname: string, segment: Segment): Candidate {
  if (segment === "dropped_before_onboarding") {
    const subject = "quick question";
    return {
      userId,
      email,
      nickname,
      segment,
      subject,
      text: `Hey ${nickname}, quick one — I saw you signed up for EdgeFlow but didn't get to logging a trade yet.

Was anything confusing, or did you just not have time?

I'm trying to make the first version actually useful for traders, so even a blunt answer helps.

- Leone
Founder, EdgeFlow`,
    };
  }

  const subject = "your EdgeFlow setup";
  return {
    userId,
    email,
    nickname,
    segment,
    subject,
    text: `Hey ${nickname}, quick one — you're set up on EdgeFlow but haven't logged a trade yet.

The product starts becoming useful once you add a few trades, because that's when it can show patterns in your performance.

If you log 3 recent trades today, wins or losses, I'll personally help you read what the data says.

${appUrl}/add-trade

- Leone
Founder, EdgeFlow`,
  };
}

async function getProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, nickname, onboarding_completed, created_at")
    .order("created_at", { ascending: true });

  if (error) fail(`Could not load profiles: ${error.message}`);
  return (data ?? []) as ProfileRow[];
}

async function getAuthEmails(): Promise<Map<string, string>> {
  const emailByUserId = new Map<string, string>();
  const perPage = 1000;

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) fail(`Could not load auth users: ${error.message}`);

    const users = data.users ?? [];
    for (const user of users) {
      if (user.email) emailByUserId.set(user.id, user.email);
    }

    if (users.length < perPage) break;
  }

  return emailByUserId;
}

async function getTradeCounts(): Promise<Map<string, number>> {
  const tradeCountByUserId = new Map<string, number>();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("trades")
      .select("user_id")
      .range(from, from + pageSize - 1);

    if (error) fail(`Could not load trades: ${error.message}`);

    for (const trade of data ?? []) {
      const userId = (trade as { user_id: string }).user_id;
      tradeCountByUserId.set(userId, (tradeCountByUserId.get(userId) ?? 0) + 1);
    }

    if (!data || data.length < pageSize) break;
  }

  return tradeCountByUserId;
}

async function getAlreadyContacted(): Promise<Set<string>> {
  const contacted = new Set<string>();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("user_outreach")
      .select("user_id, campaign_key")
      .eq("campaign_key", campaignKey)
      .range(from, from + pageSize - 1);

    if (error) fail(`Could not load user_outreach rows. Has the migration been applied? ${error.message}`);

    for (const row of (data ?? []) as OutreachRow[]) {
      contacted.add(row.user_id);
    }

    if (!data || data.length < pageSize) break;
  }

  return contacted;
}

async function sendEmail(candidate: Candidate): Promise<string> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: candidate.email,
      reply_to: replyTo,
      subject: candidate.subject,
      text: candidate.text,
    }),
  });

  const body = await response.json().catch(() => null) as { id?: string; message?: string; name?: string } | null;
  if (!response.ok) {
    const detail = body?.message ?? body?.name ?? response.statusText;
    fail(`Resend rejected ${candidate.email}: ${detail}`);
  }

  if (!body?.id) fail(`Resend accepted ${candidate.email}, but did not return a message id.`);
  return body.id;
}

async function recordOutreach(candidate: Candidate, providerMessageId: string): Promise<void> {
  const { error } = await supabase.from("user_outreach").insert({
    user_id: candidate.userId,
    email: candidate.email,
    campaign_key: campaignKey,
    segment: candidate.segment,
    subject: candidate.subject,
    provider_message_id: providerMessageId,
  });

  if (error) fail(`Email sent to ${candidate.email}, but logging failed: ${error.message}`);
}

function printPreview(index: number, candidate: Candidate): void {
  console.log(`--- ${index}. ${candidate.email} (${candidate.segment}) ---`);
  console.log(`Subject: ${candidate.subject}`);
  console.log(candidate.text);
  console.log("");
}

function loadDotEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (process.env[key]) continue;

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function cleanNickname(nickname: string | null): string {
  const clean = nickname?.trim();
  return clean || "there";
}

function getEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value?.slice(prefix.length);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
