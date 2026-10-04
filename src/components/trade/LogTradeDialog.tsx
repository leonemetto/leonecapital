import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { TradeForm } from '@/components/trade/TradeForm';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { CARD_REQUIRED, TRIAL_DAYS } from '@/config/billing';
import { useShell } from '@/components/shell/ShellContext';

/**
 * Logging a trade from any screen. The form keeps the last instrument, setup
 * and account so a second trade takes a few keystrokes.
 */
export function LogTradeDialog() {
  const { logTradeOpen, closeLogTrade } = useShell();
  const { addTrade, addMirroredTrade } = useSharedTrades();
  const { hasProAccess, hasSubscription, isLoading } = useSharedSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  // Remount the form after "save and log another" so every field resets cleanly.
  const [formKey, setFormKey] = useState(0);

  const locked = !isLoading && !hasProAccess;
  const neverSubscribed = CARD_REQUIRED && !hasSubscription;

  return (
    <>
      <Dialog open={logTradeOpen} onOpenChange={open => { if (!open) closeLogTrade(); }}>
        <DialogContent
          className="max-h-[92dvh] w-[calc(100%-24px)] max-w-[860px] gap-0 overflow-y-auto rounded-surface border-ef-line bg-ef-elev p-0 backdrop-blur-none sm:rounded-surface"
          style={{ boxShadow: 'var(--ef-shadow-pop)' }}
          // Start on the first required field, not the first button.
          onOpenAutoFocus={e => {
            const field = document.getElementById('trade-instrument');
            if (field) {
              e.preventDefault();
              field.focus();
            }
          }}
        >
          <div className="border-b border-ef-line px-6 pb-4 pt-5">
            <DialogTitle className="m-0 text-[17px] font-medium tracking-[-0.02em] text-ef-ink">Log a trade</DialogTitle>
            <DialogDescription className="m-0 mt-1 text-[12.5px] text-ef-ink-3">
              Instrument and P&amp;L are required. Everything else sharpens the analysis.
            </DialogDescription>
          </div>
          <div className="px-6 py-5">
            {locked ? (
              <div className="py-6 text-center">
                <p className="ef-label m-0">{neverSubscribed ? `${TRIAL_DAYS}-day Pro trial` : 'Pro trial ended'}</p>
                <h3 className="m-0 mt-3 text-[18px] font-medium tracking-[-0.02em] text-ef-ink">
                  {neverSubscribed ? `Try EdgeFlow Pro free for ${TRIAL_DAYS} days` : 'Upgrade to keep logging trades'}
                </h3>
                <p className="mx-auto mb-0 mt-2 max-w-[44ch] text-[13px] leading-relaxed text-ef-ink-3">
                  {neverSubscribed
                    ? `Add a card to unlock trade logging, imports, Atlas and advanced analysis. You pay nothing for ${TRIAL_DAYS} days.`
                    : 'Your data is safe. Upgrade to continue logging trades, importing history and using Atlas.'}
                </p>
                <button type="button" onClick={() => setUpgradeOpen(true)} className="ef-btn ef-btn-primary mt-5 h-9 px-4">
                  {neverSubscribed ? 'Start free trial' : 'Upgrade to Pro'}
                </button>
              </div>
            ) : (
              <TradeForm
                key={formKey}
                columns={2}
                onSubmit={addTrade}
                onMirroredSubmit={addMirroredTrade}
                onCancel={closeLogTrade}
                onSaved={({ another }) => {
                  if (another) setFormKey(k => k + 1);
                  else closeLogTrade();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
