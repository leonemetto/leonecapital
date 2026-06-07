import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

type Plan = 'pro';
type Cycle = 'monthly' | 'annual';

// Version stamps for consent capture — bump these any time the relevant page
// changes materially. Stored on the subscription row at the moment of purchase.
const TERMS_VERSION = '2026-06-04';
const REFUNDS_VERSION = '2026-06-04';
const PRIVACY_VERSION = '2026-06-04';

// USD-only pricing — Lemon Squeezy bills internationally and converts at
// checkout for non-USD cardholders. (A separate Intasend rail will add
// native KES pricing later.)
const PRICING: Record<`${Plan}_${Cycle}`, { amountMinor: number; display: string; perMonth?: string; savings?: string }> = {
  pro_monthly:   { amountMinor: 1_900,  display: '$19 / month' },
  pro_annual:    { amountMinor: 19_000, display: '$190 / year', perMonth: '$15.83 / mo', savings: 'Save ~16%' },
};

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan?: Plan;
}

export function UpgradeModal({ open, onOpenChange, initialPlan = 'pro' }: UpgradeModalProps) {
  const { user } = useAuth();
  const { isPro, isTrialing } = useSubscription();

  const plan: Plan = initialPlan;
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setConsent(false);
      setSubmitting(false);
    }
  }, [open]);

  const priceKey = `${plan}_${cycle}` as const;
  const pricing = PRICING[priceKey];

  const consentText = `I have read and agree to the Terms, Privacy Policy, and Refund Policy (versions Terms ${TERMS_VERSION}, Refunds ${REFUNDS_VERSION}, Privacy ${PRIVACY_VERSION}).`;

  const canSubmit = consent && (!isPro || isTrialing) && !submitting;

  async function handleSubmit() {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    if (!consent) {
      toast.error('Tick the agreement checkbox to continue');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('lemon-checkout-create', {
        body: {
          plan,
          billing_cycle: cycle,
          currency: 'USD',
          terms_version_accepted: TERMS_VERSION,
          refunds_version_accepted: REFUNDS_VERSION,
          privacy_version_accepted: PRIVACY_VERSION,
          consent_checkbox_text: consentText,
        },
      });
      if (error) {
        let detail = error.message ?? 'unknown error';
        type ErrWithContext = { context?: { body?: ReadableStream<Uint8Array> | string } };
        const ctx = (error as ErrWithContext).context;
        try {
          if (ctx?.body && typeof ctx.body !== 'string') {
            const text = await new Response(ctx.body).text();
            const parsed = JSON.parse(text);
            if (parsed?.error) detail = parsed.error;
          } else if (typeof ctx?.body === 'string') {
            const parsed = JSON.parse(ctx.body);
            if (parsed?.error) detail = parsed.error;
          }
        } catch {
          // ignore; fall back to generic message
        }
        toast.error(`Could not start checkout: ${detail}`);
        setSubmitting(false);
        return;
      }
      const url = (data as { url?: string })?.url;
      if (!url) {
        toast.error('Could not start checkout — please try again.');
        setSubmitting(false);
        return;
      }
      window.location.href = url;
    } catch (e) {
      console.error('upgrade submit failed', e);
      toast.error('Could not start checkout — please try again.');
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-[12px] border border-border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Plan</div>
            <div className="mt-1 text-lg font-semibold">EdgeFlow Pro</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unlimited trades, analytics, Atlas, Leak Detection, Optimizer, imports, and reports.
            </p>
          </div>

          {/* Cycle toggle */}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Billing</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setCycle('monthly')}
                className={`px-3 py-2 rounded-[10px] border text-sm font-medium transition ${
                  cycle === 'monthly'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent border-border text-foreground hover:bg-muted'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCycle('annual')}
                className={`px-3 py-2 rounded-[10px] border text-sm font-medium transition relative ${
                  cycle === 'annual'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent border-border text-foreground hover:bg-muted'
                }`}
              >
                Annual
                <span className="ml-1 text-[10px] text-[#10b981] font-semibold">−16%</span>
              </button>
            </div>
          </div>

          {/* Payment note */}
          <div className="text-xs text-muted-foreground">
            Billed in USD via Lemon Squeezy. International cards including Amex are supported — your bank handles FX automatically.
          </div>

          {/* Price card */}
          <div className="rounded-[12px] border border-border p-4 bg-muted/30">
            <div className="text-2xl font-semibold font-mono tabular-nums">{pricing.display}</div>
            {pricing.perMonth && (
              <div className="text-xs text-muted-foreground mt-1">
                {pricing.perMonth} · <span className="text-[#10b981]">{pricing.savings}</span>
              </div>
            )}
          </div>

          {/* Already-subscribed warning */}
          {isPro && !isTrialing && (
            <div className="rounded-[10px] border border-border bg-muted/30 p-3 text-xs">
              You already have an active subscription. Manage it in Settings → Subscription.
            </div>
          )}

          {/* Consent checkbox — REQUIRED for chargeback defense */}
          <button
            type="button"
            onClick={() => setConsent((v) => !v)}
            className={`w-full text-left flex items-start gap-3 rounded-[10px] border p-3 transition cursor-pointer ${
              consent
                ? 'border-[#10b981] bg-[#10b981]/10'
                : 'border-border bg-muted/30 hover:bg-muted/50'
            }`}
            aria-pressed={consent}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition ${
                consent ? 'border-[#10b981] bg-[#10b981]' : 'border-foreground/40 bg-background'
              }`}
            >
              {consent && (
                <svg viewBox="0 0 14 14" className="h-3 w-3 text-black" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7l3.5 3.5L12 4" />
                </svg>
              )}
            </span>
            <span className="text-xs text-foreground/80 leading-relaxed">
              I have read and agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>Terms</a>,{' '}
              <a href="/privacy" target="_blank" rel="noopener" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>, and{' '}
              <a href="/refunds" target="_blank" rel="noopener" className="underline hover:text-foreground" onClick={(e) => e.stopPropagation()}>Refund Policy</a>. I understand my subscription will auto-renew until I cancel.
            </span>
          </button>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-[24px] font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            {submitting ? 'Starting checkout…' : `Continue to checkout — ${pricing.display}`}
          </Button>

          <p className="text-[10px] text-muted-foreground/70 text-center">
            Secure checkout via Lemon Squeezy. We never see your card details.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
