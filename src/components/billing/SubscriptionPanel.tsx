import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
    case 'active': return { label: 'Active', color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30' };
    case 'past_due': return { label: 'Payment failed — retrying', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    case 'cancelling': return { label: 'Cancelling at period end', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    case 'cancelled': return { label: 'Cancelled', color: 'text-muted-foreground bg-muted border-border' };
    case 'expired': return { label: 'Expired (payment failed)', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    case 'trialing': return { label: 'Trial', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    default: return { label: 'Free', color: 'text-muted-foreground bg-muted border-border' };
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
    return <div className="text-sm text-muted-foreground">Loading subscription…</div>;
  }

  const badge = statusBadge(status);
  const showUpgrade = !isPro || isTrialing || status === 'cancelled' || status === 'expired';
  const showCancel = isPro && (status === 'active' || status === 'past_due');
  const showReactivateNotice = status === 'cancelling';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/60 font-semibold">Plan</div>
          <div className="text-lg font-semibold mt-1">
            {isTrialing ? 'Pro Trial' : tier === 'free' ? 'No active plan' : tier === 'elite' ? 'Elite' : 'Pro'}
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {row && isPro && (
        <div className="rounded-[12px] border border-border bg-muted/20 p-4 space-y-2 text-sm">
          {!isTrialing && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(row.amount, row.currency)} / {row.billing_cycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span>
                  {row.channel === 'mpesa' ? 'M-Pesa' : row.channel === 'card' ? 'Card' : row.channel ?? '—'}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {isTrialing ? 'Trial ends' : showReactivateNotice ? 'Access until' : 'Next billing'}
            </span>
            <span className="font-mono tabular-nums">
              {formatDate(row.cancel_at ?? row.current_period_end)}
            </span>
          </div>
        </div>
      )}

      {showReactivateNotice && (
        <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Your subscription is cancelling. Access continues until {formatDate(row?.cancel_at ?? row?.current_period_end ?? null)}.
          To keep it going, contact{' '}
          <a href="mailto:support@edgeflow.capital" className="underline">support@edgeflow.capital</a>{' '}
          and we'll re-enable before the end date.
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {showUpgrade && (
          <Button
            onClick={() => setUpgradeOpen(true)}
            className="rounded-[24px] bg-foreground text-background font-semibold hover:bg-foreground/90"
          >
            {isTrialExpired ? 'Upgrade to Pro' : isTrialing ? 'Upgrade now' : tier === 'free' ? 'Upgrade to Pro' : 'Resubscribe'}
          </Button>
        )}

        {showCancel && !confirmCancel && (
          <Button
            variant="outline"
            onClick={() => setConfirmCancel(true)}
            className="rounded-[24px]"
          >
            Cancel subscription
          </Button>
        )}

        {confirmCancel && (
          <div className="w-full rounded-[12px] border border-border bg-muted/30 p-4 space-y-3">
            <div className="text-sm">
              You'll keep Pro access until{' '}
              <span className="font-semibold">{formatDate(row?.current_period_end ?? null)}</span>.
              Your trade data stays on your account either way.
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-[24px] bg-foreground text-background"
              >
                {cancelling ? 'Cancelling…' : 'Yes, cancel'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className="rounded-[24px]"
              >
                Keep subscription
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/70 pt-1">
        Refund policy: <a href="/refunds" className="underline hover:text-foreground">edgeflow.capital/refunds</a>.
        Questions: <a href="mailto:support@edgeflow.capital" className="underline hover:text-foreground">support@edgeflow.capital</a>.
      </p>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} initialPlan="pro" />
    </div>
  );
}
