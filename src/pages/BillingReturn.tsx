import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, useInvalidateSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';

const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 10_000;

export default function BillingReturn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref');
  const { user, loading: authLoading } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();
  const invalidate = useInvalidateSubscription();
  const [phase, setPhase] = useState<'polling' | 'success' | 'timeout'>('polling');
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Not logged in — send them to login with the ref preserved
      navigate(`/auth?intent=billing-return${reference ? `&ref=${encodeURIComponent(reference)}` : ''}`);
      return;
    }

    // Already Pro on first read — likely a fast webhook delivery
    if (isPro && phase === 'polling') {
      setPhase('success');
      return;
    }

    const id = setInterval(() => {
      invalidate();
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        setPhase((p) => (p === 'polling' ? 'timeout' : p));
        clearInterval(id);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [authLoading, user, isPro, navigate, invalidate, reference, phase]);

  useEffect(() => {
    if (phase === 'polling' && isPro) {
      setPhase('success');
    }
  }, [isPro, phase]);

  useEffect(() => {
    if (phase === 'success') {
      const t = setTimeout(() => navigate('/dashboard?upgraded=1'), 1800);
      return () => clearTimeout(t);
    }
  }, [phase, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <Helmet>
        <title>Activating your subscription — EdgeFlow</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-md w-full text-center space-y-6">
        {phase === 'polling' && (
          <>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
            <h1 className="text-xl font-semibold">Activating your subscription…</h1>
            <p className="text-sm text-muted-foreground">
              This usually takes a couple of seconds. Don't close this page.
            </p>
            {reference && (
              <p className="text-[10px] text-muted-foreground/60 font-mono">Ref: {reference}</p>
            )}
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981] text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-semibold">Welcome to EdgeFlow Pro</h1>
            <p className="text-sm text-muted-foreground">
              Your subscription is active. Redirecting you to the dashboard…
            </p>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/50 text-amber-400 text-2xl">
              !
            </div>
            <h1 className="text-xl font-semibold">Payment received — still activating</h1>
            <p className="text-sm text-muted-foreground">
              Your payment went through, but our system is still processing it. This usually clears within a minute.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button
                onClick={() => {
                  startedAt.current = Date.now();
                  setPhase('polling');
                  invalidate();
                }}
                className="rounded-[24px] bg-foreground text-background"
              >
                Check again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="rounded-[24px]"
              >
                Go to dashboard
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground/70 pt-2">
              If access doesn't activate within an hour,{' '}
              <a href="mailto:support@edgeflow.capital" className="underline hover:text-foreground">email support@edgeflow.capital</a>{' '}
              with reference <span className="font-mono">{reference ?? '(none)'}</span>.
            </p>
            {!subLoading && <div className="text-[10px] text-muted-foreground/50">subscription cache reloaded</div>}
          </>
        )}
      </div>
    </div>
  );
}
