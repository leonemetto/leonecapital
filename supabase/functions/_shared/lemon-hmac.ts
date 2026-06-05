// lemon-hmac.ts — Verify webhook signatures from Lemon Squeezy.
//
// LS signs every webhook with HMAC SHA-256 of the RAW request body using the
// signing secret you configure on the webhook endpoint in their dashboard. The
// hex digest comes in the `x-signature` header. We compare in constant time.
//
// Two secrets supported so you can rotate without downtime:
//   LEMONSQUEEZY_WEBHOOK_SECRET           — current signing secret
//   LEMONSQUEEZY_WEBHOOK_SECRET_PREVIOUS  — optional; valid for an overlap window
//
// CRITICAL: read the raw body via req.text() BEFORE any JSON.parse. The HMAC
// is computed over the exact bytes LS sent, so a JSON re-stringify would not
// match (different whitespace, key order, etc.).

export async function verifyLemonSignature(
  rawBody: string,
  headerSignature: string,
  secrets: string[],
): Promise<boolean> {
  if (!headerSignature) return false;
  const encoder = new TextEncoder();

  for (const secret of secrets) {
    if (!secret) continue;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const computed = Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (timingSafeEqual(computed, headerSignature)) return true;
  }
  return false;
}

// Constant-time string comparison. Prevents leaking the HMAC via timing side
// channels (probably overkill for an HTTPS endpoint but the cost is zero).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
