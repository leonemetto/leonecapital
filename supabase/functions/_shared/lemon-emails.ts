// lemon-emails.ts — Resend templates fired from the lemon-webhook handler at
// each lifecycle moment. Five templates total:
//
//   welcome-to-pro      first subscription_created (or _resumed)
//   payment-failed      subscription_payment_failed
//   subscription-cancelled  subscription_cancelled
//   subscription-expired    subscription_expired
//   refund-processed    subscription_payment_refunded / order_refunded
//
// All emails go from "EdgeFlow <noreply@leone.capital>" (the existing verified
// Resend sender). Failure to send is logged but does not throw — the webhook
// must still 200 LS even if the email rail is degraded.

const FROM = "EdgeFlow <noreply@leone.capital>";
const APP_URL = "https://edgeflow.capital";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function send(args: SendArgs): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping email", { subject: args.subject });
    return;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: FROM, ...args }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error("resend send failed", resp.status, body);
    }
  } catch (e) {
    console.error("resend send threw", e);
  }
}

function wrap(bodyHtml: string, ctaHref: string, ctaLabel: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>EdgeFlow</title></head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e7e5e0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#000000;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;background:#141413;border:1px solid #23221f;border-radius:14px;padding:32px;">
        <tr><td>
          <div style="font-size:20px;font-weight:600;letter-spacing:-0.01em;margin-bottom:24px;">EdgeFlow</div>
          ${bodyHtml}
          <div style="margin:32px 0 8px 0;">
            <a href="${ctaHref}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:24px;font-size:14px;">${ctaLabel}</a>
          </div>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #23221f;font-size:12px;color:#7d7a72;line-height:1.6;">
            Questions or feedback? Just reply to this email — it reaches me (Leone) directly.<br>
            <a href="${APP_URL}/refunds" style="color:#7d7a72;text-decoration:underline;">Refund policy</a> ·
            <a href="${APP_URL}/terms" style="color:#7d7a72;text-decoration:underline;">Terms</a> ·
            <a href="${APP_URL}/privacy" style="color:#7d7a72;text-decoration:underline;">Privacy</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendWelcomeToPro(args: { to: string; plan: string; billingCycle: string }) {
  const planLabel = args.plan === "elite" ? "EdgeFlow Elite" : "EdgeFlow Pro";
  const cycleLabel = args.billingCycle === "annual" ? "annual" : "monthly";
  const body = `
    <h1 style="font-size:24px;font-weight:600;margin:0 0 16px 0;color:#ffffff;">Welcome to ${planLabel}.</h1>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      Your ${cycleLabel} subscription is active. Sign in and your full analytics, leak detection, and Atlas AI coach are unlocked — no extra setup needed.
    </p>
    <p style="margin:0 0 8px 0;line-height:1.6;font-size:14px;color:#a8a59c;">
      What's most valuable in your first week: log a few real trades, then ask Atlas "what's my biggest leak?" — it cross-references your patterns and tells you the one thing to fix first.
    </p>
  `;
  await send({
    to: args.to,
    subject: `Welcome to ${planLabel}`,
    html: wrap(body, `${APP_URL}/dashboard`, "Open EdgeFlow"),
  });
}

export async function sendPaymentFailed(args: { to: string; customerPortalUrl: string | null }) {
  const cta = args.customerPortalUrl ?? `${APP_URL}/profile`;
  const body = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 16px 0;color:#ffffff;">Your card couldn't be charged.</h1>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      We tried to renew your EdgeFlow subscription and the charge failed. This usually means the card expired or the bank declined.
    </p>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      <strong style="color:#ffffff;">You still have access for now</strong> — we'll keep retrying for up to 7 days. To avoid losing access, update your payment method below.
    </p>
  `;
  await send({
    to: args.to,
    subject: "Update your payment method — EdgeFlow",
    html: wrap(body, cta, "Update payment method"),
  });
}

export async function sendSubscriptionCancelled(args: { to: string; cancelAt: string | null }) {
  const dateStr = args.cancelAt
    ? new Date(args.cancelAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : "the end of your current billing period";
  const body = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 16px 0;color:#ffffff;">Subscription cancelled.</h1>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      Your subscription has been cancelled. You'll keep full access until <strong style="color:#ffffff;">${dateStr}</strong>, then your account will move to read-only access.
    </p>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      Your trade data stays on your account either way — nothing gets deleted. Export anytime as CSV from Settings.
    </p>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#a8a59c;">
      If you cancelled by mistake or want to come back, just reply to this email and I'll get you re-enabled.
    </p>
  `;
  await send({
    to: args.to,
    subject: "Subscription cancelled — EdgeFlow",
    html: wrap(body, `${APP_URL}/profile`, "View account"),
  });
}

export async function sendSubscriptionExpired(args: { to: string }) {
  const body = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 16px 0;color:#ffffff;">Your subscription has ended.</h1>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      We tried to renew your subscription several times and couldn't process the payment. Your account now has read-only access.
    </p>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      Your trade data is safe — nothing is deleted. Upgrade again anytime to restore trade logging, imports, Atlas, and advanced analysis.
    </p>
  `;
  await send({
    to: args.to,
    subject: "Subscription ended — EdgeFlow",
    html: wrap(body, `${APP_URL}/profile`, "Restart subscription"),
  });
}

export async function sendRefundProcessed(args: { to: string; amountUsd: string; }) {
  const body = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 16px 0;color:#ffffff;">Refund processed.</h1>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      We've issued your refund of <strong style="color:#ffffff;">${args.amountUsd}</strong>. It should appear on your card within 5–10 business days, depending on your bank.
    </p>
    <p style="margin:0 0 16px 0;line-height:1.6;font-size:15px;">
      Your trade data stays on your account — nothing has been deleted. If you ever want to come back, just sign in and resubscribe.
    </p>
    <p style="margin:0;line-height:1.6;font-size:14px;color:#a8a59c;">
      If there's anything that didn't work for you, I'd genuinely appreciate the feedback — just reply to this email.
    </p>
  `;
  await send({
    to: args.to,
    subject: "Refund processed — EdgeFlow",
    html: wrap(body, `${APP_URL}`, "Visit edgeflow.capital"),
  });
}
