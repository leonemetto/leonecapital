import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSharedTrades } from '@/contexts/TradesContext';
import { toast } from 'sonner';

type Plan = 'pro' | 'elite';
type Cycle = 'monthly' | 'annual';
type Currency = 'KES' | 'USD';

// Set to true once Paystack enables USD on the merchant account AND the
// PAYSTACK_PLAN_CODES secret has the 4 USD plan codes filled in.
// Until then, all customers (KE and international) are billed in KES — the
// customer's bank handles FX for international cards.
const USD_AVAILABLE = false;

// Version stamps for consent capture — bump these any time the relevant page
// changes materially. Stored on the subscription row at the moment of purchase.
const TERMS_VERSION = '2026-05-28';
const REFUNDS_VERSION = '2026-05-28';
const PRIVACY_VERSION = '2026-05-29';

// Local copy of the pricing table from supabase/functions/_shared/paystack-plans.ts.
// Keep these in sync — discrepancies will be caught by Paystack rejecting the
// charge but the user-facing UI must be honest.
const PRICING: Record<`${Plan}_${Cycle}_${Lowercase<Currency>}`, { amountMinor: number; display: string; perMonth?: string; savings?: string }> = {
  pro_monthly_kes:   { amountMinor: 149_900,   display: 'KES 1,499 / month' },
  pro_annual_kes:    { amountMinor: 1_499_000, display: 'KES 14,990 / year', perMonth: 'KES 1,249 / mo', savings: 'Save ~16%' },
  pro_monthly_usd:   { amountMinor: 1_900,     display: '$19 / month' },
  pro_annual_usd:    { amountMinor: 19_000,    display: '$190 / year', perMonth: '$15.83 / mo', savings: 'Save ~16%' },
  elite_monthly_kes: { amountMinor: 299_900,   display: 'KES 2,999 / month' },
  elite_annual_kes:  { amountMinor: 2_999_000, display: 'KES 29,990 / year', perMonth: 'KES 2,499 / mo', savings: 'Save ~16%' },
  elite_monthly_usd: { amountMinor: 3_900,     display: '$39 / month' },
  elite_annual_usd:  { amountMinor: 39_000,    display: '$390 / year', perMonth: '$32.50 / mo', savings: 'Save ~16%' },
};

function detectDefaultCurrency(): Currency {
  // While USD is not yet activated on the Paystack account, force KES for
  // everyone. International cards still work — the customer's bank handles FX.
  if (!USD_AVAILABLE) return 'KES';
  // Kenyan timezone → KES (M-Pesa primary). Everyone else → USD (card primary).
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Africa/Nairobi') return 'KES';
  } catch {
    // ignore
  }
  return 'USD';
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan?: Plan;
}

export function UpgradeModal({ open, onOpenChange, initialPlan = 'pro' }: UpgradeModalProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { trades } = useSharedTrades();
  // is_demo is on the DB row but stripped from the Trade type, so we approximate
  // client-side and let the backend enforce the real check (it returns 403 with
  // reason=free_plan_gate which we surface in the toast below).
  const hasLoggedTrade = trades.length >= 1;

  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set currency default once on first open
  useEffect(() => {
    if (open) {
      setCurrency(detectDefaultCurrency());
      setConsent(false);
      setSubmitting(false);
    }
  }, [open]);

  const priceKey = `${plan}_${cycle}_${currency.toLowerCase() as Lowercase<Currency>}` as const;
  const pricing = PRICING[priceKey];

  const consentText = `I have read and agree to the Terms, Privacy Policy, and Refund Policy (versions Terms ${TERMS_VERSION}, Refunds ${REFUNDS_VERSION}, Privacy ${PRIVACY_VERSION}).`;

  const canSubmit = consent && hasLoggedTrade && !isPro && !submitting;

  async function handleSubmit() {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    if (!consent) {
      toast.error('Tick the agreement checkbox to continue');
      return;
    }
    if (!hasLoggedTrade) {
      toast.error('Log at least one real trade before upgrading');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-init-transaction', {
        body: {
          plan,
          billing_cycle: cycle,
          currency,
          terms_version: TERMS_VERSION,
          refunds_version: REFUNDS_VERSION,
          privacy_version: PRIVACY_VERSION,
          consent_checkbox_text: consentText,
        },
      });
      if (error) {
        type InvokeContext = { context?: { reason?: string } };
        const reason = (error as InvokeContext).context?.reason;
        if (reason === 'free_plan_gate') {
          toast.error('Log at least one real trade before upgrading.');
        } else if (reason === 'already_subscribed') {
          toast.error('You already have an active subscription.');
        } else {
          toast.error(`Could not start checkout: ${error.message ?? 'unknown error'}`);
        }
        setSubmitting(false);
        return;
      }
      const url = (data as { authorization_url?: string })?.authorization_url;
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
          <DialogTitle>Upgrade to {plan === 'elite' ? 'Elite' : 'Pro'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Plan selector */}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Plan</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`px-3 py-2 rounded-[10px] border text-sm font-medium transition ${
                  plan === 'pro'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent border-border text-foreground hover:bg-muted'
                }`}
              >
                Pro
              </button>
              <button
                type="button"
                onClick={() => setPlan('elite')}
                className={`px-3 py-2 rounded-[10px] border text-sm font-medium transition ${
                  plan === 'elite'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent border-border text-foreground hover:bg-muted'
                }`}
              >
                Elite
              </button>
            </div>
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

          {/* Currency override — hidden until USD is enabled on Paystack */}
          {USD_AVAILABLE ? (
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Pay in</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrency('KES')}
                  className={`px-3 py-2 rounded-[10px] border text-sm font-medium transition ${
                    currency === 'KES'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent border-border text-foreground hover:bg-muted'
                  }`}
                >
                  KES (M-Pesa)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-2 rounded-[10px] border text-sm font-medium transition ${
                    currency === 'USD'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent border-border text-foreground hover:bg-muted'
                  }`}
                >
                  USD (Card)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Pay in KES via M-Pesa or international card. Your bank handles FX for non-Kenyan cards.
            </div>
          )}

          {/* Price card */}
          <div className="rounded-[12px] border border-border p-4 bg-muted/30">
            <div className="text-2xl font-semibold font-mono tabular-nums">{pricing.display}</div>
            {pricing.perMonth && (
              <div className="text-xs text-muted-foreground mt-1">
                {pricing.perMonth} · <span className="text-[#10b981]">{pricing.savings}</span>
              </div>
            )}
          </div>

          {/* Free-plan gate warning */}
          {!hasLoggedTrade && (
            <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              Log at least one real trade before upgrading. This is for your protection — we want to make sure EdgeFlow is right for your trading first.
            </div>
          )}

          {/* Already-subscribed warning */}
          {isPro && (
            <div className="rounded-[10px] border border-border bg-muted/30 p-3 text-xs">
              You already have an active subscription. Manage it in Settings → Subscription.
            </div>
          )}

          {/* Consent checkbox — REQUIRED for chargeback defense.
              Custom-styled so the box is obviously visible on dark backgrounds. */}
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
            {submitting ? 'Starting checkout…' : `Continue to Paystack — ${pricing.display}`}
          </Button>

          <p className="text-[10px] text-muted-foreground/70 text-center">
            Secure checkout via Paystack. We never see your card details.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
