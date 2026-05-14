import { lazy, ComponentType } from 'react';

// Stale chunk after deploy: retry the dynamic import once, then force a one-time
// full reload. A sessionStorage flag prevents reload loops.
const RELOAD_FLAG = 'ef:chunk-reloaded';

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Unable to preload CSS/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  );
}

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;
      try {
        return await factory();
      } catch (err2) {
        if (isChunkLoadError(err2) && typeof window !== 'undefined') {
          if (!sessionStorage.getItem(RELOAD_FLAG)) {
            sessionStorage.setItem(RELOAD_FLAG, '1');
            window.location.reload();
            return new Promise(() => {}) as never;
          }
        }
        throw err2;
      }
    }
  });
}
