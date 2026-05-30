// paystack-hmac.ts — HMAC SHA-512 verification for Paystack webhooks.
//
// Paystack signs every webhook body with HMAC SHA-512 using your SECRET KEY
// (NOT a separate "webhook secret" — same key you use for API calls). The
// signature comes in the `x-paystack-signature` header as a hex string.
//
// Reference: https://paystack.com/docs/payments/webhooks/#verify-event-origin
//
// We support a previous-key fallback so you can rotate keys without dropping
// in-flight webhooks. Set BOTH `PAYSTACK_SECRET_KEY` and
// `PAYSTACK_SECRET_KEY_PREVIOUS` during the 24-hour rotation window.

function hexEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return hexEncode(sig);
}

export async function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null,
  primarySecret: string,
  previousSecret?: string,
): Promise<boolean> {
  if (!signatureHeader || !primarySecret) return false;
  const expected = await hmacSha512Hex(primarySecret, rawBody);
  if (timingSafeEqual(expected, signatureHeader)) return true;
  if (previousSecret) {
    const fallback = await hmacSha512Hex(previousSecret, rawBody);
    if (timingSafeEqual(fallback, signatureHeader)) return true;
  }
  return false;
}
