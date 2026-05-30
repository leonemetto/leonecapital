// support-inbox — receives webhooks from Resend Inbound when mail arrives at
// support@edgeflow.capital (or any alias on the domain), then fans out to:
//   1. Telegram Action Required channel — instant ping
//   2. Gmail via Resend send — forward to leone.metto@gmail.com
//   3. support_emails table — audit trail for chargeback defense
//
// Required Supabase secrets:
//   - SUPABASE_URL                     (auto)
//   - SUPABASE_SERVICE_ROLE_KEY        (auto)
//   - RESEND_API_KEY                   (for forwarding outbound)
//   - RESEND_WEBHOOK_SECRET            (to verify inbound webhook signatures)
//   - TELEGRAM_BOT_TOKEN
//   - TELEGRAM_ACTION_REQUIRED_CHAT_ID  (e.g. "-1003991046783")
//   - GMAIL_FORWARD_ADDRESS            (e.g. "leone.metto@gmail.com")

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Resend Inbound payload shapes are loose: `from`/`to`/`cc`/`bcc` can come as
// plain strings ("leone@x.com"), display-name strings ("Leone <leone@x.com>"),
// arrays of either, or {email,name} objects. We normalise everything.
type EmailLike = string | { email?: string; address?: string; name?: string };

type ResendInboundEvent = {
  type?: string;
  created_at?: string;
  data: {
    email_id?: string;
    from?: EmailLike | EmailLike[];
    to?: EmailLike | EmailLike[];
    cc?: EmailLike | EmailLike[];
    bcc?: EmailLike | EmailLike[];
    subject?: string;
    text?: string;
    html?: string;
    headers?: Record<string, string> | Array<{ name: string; value: string }>;
  };
};

function parseEmailLike(v: EmailLike | EmailLike[] | undefined): { email: string; name?: string } | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.length ? parseEmailLike(v[0]) : null;
  if (typeof v === "object") {
    const email = v.email ?? v.address;
    return email ? { email, name: v.name } : null;
  }
  // string form — accept "Name <email@x>" or bare "email@x"
  const s = v.trim();
  const m = s.match(/^\s*(?:"?([^"<]+?)"?\s*)?<([^>]+)>\s*$/);
  if (m) {
    const name = m[1]?.trim();
    const email = m[2].trim();
    return { email, name: name && name.length > 0 ? name : undefined };
  }
  return { email: s };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function isPaystackDispute(from: string, subject: string): boolean {
  const f = (from || "").toLowerCase();
  const s = (subject || "").toLowerCase();
  return f.includes("paystack") && (
    s.includes("dispute") || s.includes("chargeback") || s.includes("refund")
  );
}

function classifyInbox(toEmail: string, isDispute: boolean): { tag: string; hint?: string } {
  if (isDispute) {
    return { tag: "🚨 <b>PAYSTACK DISPUTE</b>", hint: "16-hour response window — drop everything" };
  }
  const local = toEmail.toLowerCase().split("@")[0] || "";
  if (local === "support") {
    return { tag: "📧 <b>Support email</b>" };
  }
  if (local === "noreply" || local === "no-reply") {
    return {
      tag: "↩️ <b>Reply to noreply</b>",
      hint: "User replied to a transactional email — likely needs help. Reply from support@",
    };
  }
  if (local === "dpo") {
    return {
      tag: "🔒 <b>Data protection request</b>",
      hint: "GDPR / Kenya DPA — respond within 30 days",
    };
  }
  if (local === "leone") {
    return { tag: "👤 <b>Direct to founder</b>" };
  }
  if (local === "hello" || local === "hi" || local === "contact") {
    return { tag: "👋 <b>General inbox</b>" };
  }
  return { tag: `📬 <b>Catch-all: ${toEmail}</b>` };
}

async function verifyResendSignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  // Resend Inbound uses Svix-style signature headers.
  // Svix format: signature = base64(hmac-sha256(secret, "<svix-id>.<svix-timestamp>.<body>"))
  // and a single header "svix-signature" with format "v1,<sig>" (or multiple comma-separated).
  const svixId = headers.get("svix-id");
  const svixTs = headers.get("svix-timestamp");
  const svixSig = headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) return false;

  // Replay protection: reject anything older than 5 minutes
  const ts = parseInt(svixTs, 10);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  // Svix secrets are prefixed "whsec_<base64>". Strip prefix and decode.
  const cleaned = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = `${svixId}.${svixTs}.${rawBody}`;
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  // svix-signature can contain multiple versions: "v1,xxx v1,yyy"
  return svixSig.split(" ").some(part => {
    const [, sig] = part.split(",");
    return sig && sig === expected;
  });
}

// Resend webhooks for email.received DO NOT include the body — only metadata.
// We must call back to Resend's API with the email_id to fetch the full content.
// The exact endpoint isn't clearly documented as of writing; we try multiple
// candidate URLs and return the first that succeeds. The one that works gets
// logged so we can simplify this later.
const RESEND_INBOUND_ENDPOINTS = [
  // Official endpoint per Resend SDK: resend.emails.receiving.get(emailId)
  (id: string) => `https://api.resend.com/emails/receiving/${id}`,
];

async function fetchInboundEmail(apiKey: string, emailId: string): Promise<{ text?: string; html?: string; subject?: string } | null> {
  for (const buildUrl of RESEND_INBOUND_ENDPOINTS) {
    const url = buildUrl(emailId);
    try {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const body = await resp.json();
        console.log("inbound fetch ok via", url, "keys:", Object.keys(body));
        // Body fields might be at root or nested under data
        const root = body?.data ?? body;
        return {
          text: root?.text ?? root?.body_text ?? root?.plain_text ?? undefined,
          html: root?.html ?? root?.body_html ?? undefined,
          subject: root?.subject ?? undefined,
        };
      }
      // 404 etc. — try next candidate
      console.log("inbound fetch miss", url, resp.status);
    } catch (e) {
      console.warn("inbound fetch error", url, e);
    }
  }
  console.error("all inbound fetch candidates failed for", emailId);
  return null;
}

async function postToTelegram(token: string, chatId: string, html: string): Promise<number | null> {
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const json = await resp.json();
    if (!json.ok) {
      console.error("telegram error", json);
      return null;
    }
    return json.result?.message_id ?? null;
  } catch (e) {
    console.error("telegram fetch failed", e);
    return null;
  }
}

async function forwardToGmail(
  apiKey: string,
  toAddress: string,
  fromEmail: string,
  fromName: string | undefined,
  subject: string,
  text: string,
  html: string,
): Promise<string | null> {
  try {
    const displayFrom = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    const wrappedSubject = `[support@] ${subject || "(no subject)"}`;
    const wrappedText = `--- Forwarded from ${displayFrom} ---\n\n${text || ""}`;
    const wrappedHtml = html
      ? `<div style="border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:12px;font-family:sans-serif;color:#555;font-size:13px"><strong>Forwarded from:</strong> ${escapeHtml(displayFrom)}</div>${html}`
      : `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(wrappedText)}</pre>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "EdgeFlow Support <support@edgeflow.capital>",
        to: [toAddress],
        reply_to: fromEmail,
        subject: wrappedSubject,
        text: wrappedText,
        html: wrappedHtml,
      }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      console.error("resend send error", json);
      return null;
    }
    return json.id ?? null;
  } catch (e) {
    console.error("resend send failed", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY")!;
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET")!;
  const tgToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const tgChat = Deno.env.get("TELEGRAM_ACTION_REQUIRED_CHAT_ID")!;
  const gmailAddr = Deno.env.get("GMAIL_FORWARD_ADDRESS")!;

  const rawBody = await req.text();

  // Verify webhook signature so random POSTs can't pollute our audit trail
  // or trick us into emailing arbitrary addresses.
  if (webhookSecret) {
    const ok = await verifyResendSignature(rawBody, req.headers, webhookSecret);
    if (!ok) {
      console.warn("invalid resend signature");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  let evt: ResendInboundEvent;
  try {
    evt = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const fromParsed = parseEmailLike(evt?.data?.from);
  if (!fromParsed) {
    console.warn("ignoring event with no parseable from", { type: evt?.type, dataKeys: Object.keys(evt?.data ?? {}) });
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const fromEmail = fromParsed.email;
  const fromName = fromParsed.name;
  const toParsed = parseEmailLike(evt.data.to);
  const toEmail = toParsed?.email ?? "support@edgeflow.capital";
  const emailId = evt.data.email_id;

  // Resend webhook payload contains only metadata. Fetch the full body
  // separately. If the fetch fails, we still proceed with empty body
  // (Telegram still pings, audit row still inserted — we never lose evidence
  // of receipt even if Resend's API call fails).
  let bodyText = "";
  let bodyHtml = "";
  let subject = evt.data.subject ?? "";
  if (emailId) {
    const fetched = await fetchInboundEmail(resendKey, emailId);
    if (fetched) {
      bodyText = fetched.text ?? "";
      bodyHtml = fetched.html ?? "";
      // prefer fetched subject if webhook didn't include it
      if (!subject && fetched.subject) subject = fetched.subject;
    }
  }

  const isDispute = isPaystackDispute(fromEmail, subject);

  const supabase = createClient(supabaseUrl, serviceKey);

  // Idempotency — if Resend retries the webhook, return the existing row
  // without re-pinging Telegram or re-forwarding.
  if (emailId) {
    const { data: existing } = await supabase
      .from("support_emails")
      .select("id")
      .eq("resend_email_id", emailId)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, duplicate: true, id: existing.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  // 1. Insert audit row first so we never lose evidence of receipt
  const { data: inserted, error: insertErr } = await supabase
    .from("support_emails")
    .insert({
      resend_email_id: emailId ?? null,
      from_email: fromEmail,
      from_name: fromName ?? null,
      to_email: toEmail,
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      is_paystack_dispute: isDispute,
      raw_payload: evt,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("insert error", insertErr);
    return new Response(JSON.stringify({ error: "db insert failed", detail: insertErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const rowId = inserted.id;

  // 2. Telegram ping — bold subject, sender, preview, classified by recipient
  const sender = fromName ? `${fromName} (${fromEmail})` : fromEmail;
  const preview = truncate(bodyText.replace(/\s+/g, " ").trim(), 280);
  const { tag, hint } = classifyInbox(toEmail, isDispute);
  const tgLines = [
    tag,
    "",
    `<b>From:</b> ${escapeHtml(sender)}`,
    `<b>To:</b> ${escapeHtml(toEmail)}`,
    `<b>Subject:</b> ${escapeHtml(subject || "(no subject)")}`,
    "",
    escapeHtml(preview),
  ];
  if (hint) {
    tgLines.push("", `⚠️ <i>${escapeHtml(hint)}</i>`);
  }
  tgLines.push("", `<i>Reply via Gmail → support@edgeflow.capital</i>`);
  const tgHtml = tgLines.join("\n");

  const [tgMsgId, gmailId] = await Promise.all([
    postToTelegram(tgToken, tgChat, tgHtml),
    forwardToGmail(resendKey, gmailAddr, fromEmail, fromName, subject, bodyText, bodyHtml),
  ]);

  // 3. Update audit row with fan-out results
  await supabase
    .from("support_emails")
    .update({
      telegram_message_id: tgMsgId,
      telegram_posted_at: tgMsgId ? new Date().toISOString() : null,
      gmail_forward_resend_id: gmailId,
      gmail_forwarded_at: gmailId ? new Date().toISOString() : null,
    })
    .eq("id", rowId);

  return new Response(
    JSON.stringify({ ok: true, id: rowId, telegram_message_id: tgMsgId, gmail_forward_resend_id: gmailId }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
