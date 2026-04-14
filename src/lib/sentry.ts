import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // no-op in dev if DSN not set

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "production" or "development"
    // Only send errors in production
    enabled: import.meta.env.PROD,
    // Capture 10% of sessions for performance monitoring
    tracesSampleRate: 0.1,
    // Never log PII — strip user emails from breadcrumbs
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    },
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}

export { Sentry };
