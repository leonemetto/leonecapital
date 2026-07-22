// Lemon.js overlay checkout.
//
// Instead of redirecting the user to checkout.lemonsqueezy.com, we open the
// Lemon Squeezy checkout as an overlay ON TOP of edgeflow.capital — the user
// never leaves our page. Lemon Squeezy (as Merchant of Record) still owns the
// card form inside that overlay; we cannot self-host the card fields.
//
// If Lemon.js fails to load (adblock, offline, CSP), callers fall back to a
// full-page redirect so checkout never breaks.

const LEMON_JS_SRC = 'https://assets.lemonsqueezy.com/lemon.js';

type LemonEvent = { event: string; data?: unknown };

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (opts: { eventHandler: (event: LemonEvent) => void }) => void;
      Url: { Open: (url: string) => void; Close: () => void };
      Refresh: () => void;
    };
  }
}

let loadPromise: Promise<boolean> | null = null;

function loadLemonJs(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  if (window.createLemonSqueezy) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LEMON_JS_SRC}"]`);
    if (existing) {
      if (window.createLemonSqueezy) return resolve(true);
      existing.addEventListener('load', () => resolve(!!window.createLemonSqueezy));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = LEMON_JS_SRC;
    script.defer = true;
    script.onload = () => resolve(!!window.createLemonSqueezy);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return loadPromise;
}

function toEmbedUrl(url: string): string {
  if (/[?&]embed=1\b/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}embed=1`;
}

interface OverlayHandlers {
  onSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Opens the given Lemon Squeezy checkout URL as an in-page overlay.
 * Returns true if the overlay opened, false if Lemon.js was unavailable
 * (in which case the caller should fall back to a redirect).
 */
export async function openLemonOverlay(url: string, handlers: OverlayHandlers = {}): Promise<boolean> {
  const ok = await loadLemonJs();
  if (!ok || !window.createLemonSqueezy || !window.LemonSqueezy) return false;

  window.createLemonSqueezy();
  window.LemonSqueezy.Setup({
    eventHandler: (event) => {
      if (event.event === 'Checkout.Success') {
        handlers.onSuccess?.();
      } else if (event.event === 'Checkout.Closed') {
        handlers.onClose?.();
      }
    },
  });
  window.LemonSqueezy.Url.Open(toEmbedUrl(url));
  return true;
}
