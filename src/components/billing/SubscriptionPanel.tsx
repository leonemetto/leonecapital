import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, useInvalidateSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { UpgradeModal } from './UpgradeModal';

type SubRow = {
  plan: string | null;
  status: string | null;
  billing_cycle: string | null;
  amount: number | null;
  currency: string | null;
  channel: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
};

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return '—';
  if (currency === 'KES') return `KES ${(amount / 100).toLocaleString()}`;
  if (currency === 'USD') return `$${(amount / 100).toFixed(2)}`;
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(status: string | null): { label: string; color: string } {
  switch (status) {
    case 'active': return { label: 'Active', color: 'text-ef-pos bg-ef-pos-wash' };
    case 'past_due': return { label: 'Payment failed, retrying', color: 'text-ef-warn bg-ef-warn-wash' };
    case 'cancelling': return { label: 'Cancelling at period end', color: 'text-ef-warn bg-ef-warn-wash' };
    case 'cancelled': return { label: 'Cancelled', color: 'text-ef-ink-3 bg-ef-sunken' };
    case 'expired': return { label: 'Expired (payment failed)', color: 'text-ef-neg bg-ef-neg-wash' };
    case 'trialing': return { label: 'Trial', color: 'text-ef-ink-2 bg-ef-cool-wash' };
    default: return { label: 'Free', color: 'text-ef-ink-3 bg-ef-sunken' };
  }
}

export function SubscriptionPanel() {
  const { user } = useAuth();
  const { tier, status, isPro, isTrialing, isTrialExpired, isLoading } = useSubscription();
  const invalidate = useInvalidateSubscription();
  const [row, setRow] = useState<SubRow | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, billing_cycle, amount, currency, channel, current_period_end, cancel_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setRow(data as SubRow | null);
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id, status]);

  async function handleCancel() {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('lemon-cancel-subscription', { body: {} });
      if (error) {
        // supabase-js v2 hides the function's response body behind a generic
        // "non-2xx" message. Read it manually so we can show what actually broke.
        let detail = error.message ?? 'unknown error';
        type ErrWithContext = { context?: { body?: ReadableStream<Uint8Array> | string; status?: number } };
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
          // ignore parsing failures, fall back to generic message
        }
        console.error('cancel failed', { error, detail });
        toast.error(`Could not cancel: ${detail}`);
        return;
      }
      const cancelAt = (data as { cancel_at?: string })?.cancel_at;
      toast.success(`Cancelled. Access continues until ${formatDate(cancelAt ?? null)}.`);
      invalidate();
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded-control bg-ef-sunken" aria-busy="true" aria-label="Loading subscription" />;
  }

  const badge = statusBadge(status);
  const showUpgrade = !isPro || isTrialing || status === 'cancelled' || status === 'expired';
  const showCancel = isPro && (status === 'active' || status === 'past_due');
  const showReactivateNotice = status === 'cancelling';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="ef-label">Plan</div>
          <div className="mt-1.5 text-[18px] font-medium tracking-[-0.02em] text-ef-ink">
            {isTrialing ? 'Pro Trial' : tier === 'free' ? 'No active plan' : tier === 'elite' ? 'Elite' : 'Pro'}
          </div>
        </div>
        <span className={`ef-num inline-flex h-6 items-center rounded-chip px-2 text-[11px] font-medium ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {row && isPro && (
        <div className="space-y-2 rounded-control border border-ef-line bg-ef-bg p-4 text-[13px] text-ef-ink">
          {!isTrialing && (
            <>
              <div className="flex justify-between">
                <span className="text-ef-ink-3">Billing</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(row.amount, row.currency)} / {row.billing_cycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ef-ink-3">Method</span>
                <span>
                  {row.channel === 'mpesa' ? 'M-Pesa' : row.channel === 'card' ? 'Card' : row.channel ?? '—'}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-ef-ink-3">
              {isTrialing ? 'Trial ends' : showReactivateNotice ? 'Access until' : 'Next billing'}
            </span>
            <span className="font-mono tabular-nums">
              {formatDate(row.cancel_at ?? row.current_period_end)}
            </span>
          </div>
        </div>
      )}

      {showReactivateNotice && (
        <div className="rounded-control bg-ef-warn-wash p-3 text-[12.5px] leading-relaxed text-ef-ink">
          Your subscription is cancelling. Access continues until {formatDate(row?.cancel_at ?? row?.current_period_end ?? null)}.
          To keep it going, contact{' '}
          <a href="mailto:support@edgeflow.capital" className="underline">support@edgeflow.capital</a>{' '}
          and we'll re-enable before the end date.
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {showUpgrade && (
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="ef-btn ef-btn-primary h-9 px-4"
          >
            {isTrialExpired ? 'Upgrade to Pro' : isTrialing ? 'Upgrade now' : tier === 'free' ? 'Upgrade to Pro' : 'Resubscribe'}
          </button>
        )}

        {showCancel && !confirmCancel && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="ef-btn ef-btn-secondary h-9"
          >
            Cancel subscription
          </button>
        )}

        {confirmCancel && (
          <div className="w-full space-y-3 rounded-control border border-ef-line bg-ef-bg p-4">
            <div className="text-[13px] leading-relaxed text-ef-ink-2">
              You'll keep Pro access until{' '}
              <span className="font-semibold">{formatDate(row?.current_period_end ?? null)}</span>.
              Your trade data stays on your account either way.
            </div>
            <div className="flex gap-2">
              <button
            type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="ef-btn ef-btn-primary h-9"
              >
                {cancelling ? 'Cancelling…' : 'Yes, cancel'}
              </button>
              <button
            type="button"
                    onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className="ef-btn ef-btn-secondary h-9"
              >
                Keep subscription
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="pt-1 text-[11.5px] leading-relaxed text-ef-ink-4">
        Refund policy: <a href="/refunds" className="underline underline-offset-2 hover:text-ef-ink">edgeflow.capital/refunds</a>.
        Questions: <a href="mailto:support@edgeflow.capital" className="underline underline-offset-2 hover:text-ef-ink">support@edgeflow.capital</a>.
      </p>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} initialPlan="pro" />
    </div>
  );
}
