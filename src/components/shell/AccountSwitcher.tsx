import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretUpDown, Check, GearSix, Plus } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSharedAccounts, ALL_ACCOUNTS } from '@/contexts/AccountsContext';
import { useSharedTrades } from '@/contexts/TradesContext';
import { getAccountBalance } from '@/lib/accountProgress';
import { fmtMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TradingAccount } from '@/types/account';

const qty = (a: TradingAccount) => (a.quantity && a.quantity > 0 ? a.quantity : 1);

/**
 * One account scope for the whole app. It replaces the separate selectors the
 * dashboard, trades and analytics pages each used to carry.
 */
export function AccountSwitcher({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { accounts, selectedAccountId, setSelectedAccountId } = useSharedAccounts();
  const { trades } = useSharedTrades();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, getAccountBalance(a, trades) * qty(a));
    return map;
  }, [accounts, trades]);

  const total = useMemo(() => Array.from(balances.values()).reduce((s, v) => s + v, 0), [balances]);
  const selected = accounts.find(a => a.id === selectedAccountId) ?? null;
  const label = selected ? selected.name : accounts.length === 1 ? accounts[0].name : 'All accounts';
  const shown = selected ? balances.get(selected.id) ?? 0 : total;

  const go = (path: string) => {
    setOpen(false);
    onNavigate?.();
    navigate(path);
  };

  const pick = (id: string) => {
    setSelectedAccountId(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Account: ${label}. Balance ${fmtMoney(shown)}. Change account`}
          className={cn(
            'ef-focus group w-full rounded-control border border-ef-line bg-ef-elev text-left transition-colors hover:border-ef-line-strong',
            collapsed ? 'flex h-11 items-center justify-center' : 'px-3 py-2.5',
          )}
        >
          {collapsed ? (
            <span className="ef-num text-[10px] font-medium text-ef-ink-2">{label.slice(0, 3).toUpperCase()}</span>
          ) : (
            <>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-ef-ink-2">{label}</span>
                <CaretUpDown className="h-3.5 w-3.5 shrink-0 text-ef-ink-4 group-hover:text-ef-ink-2" />
              </span>
              <span className="ef-num mt-1 block text-[17px] font-medium leading-none tracking-[-0.03em] text-ef-ink">
                {fmtMoney(shown)}
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side={collapsed ? 'right' : 'bottom'}
        className="w-[272px] rounded-surface border-ef-line bg-ef-elev p-1.5 backdrop-blur-none"
        style={{ boxShadow: 'var(--ef-shadow-pop)' }}
      >
        <p className="ef-label px-2.5 pb-1.5 pt-2">Accounts</p>
        <ul className="m-0 max-h-[320px] list-none overflow-y-auto p-0">
          {accounts.length > 1 && (
            <li>
              <Row
                active={selectedAccountId === ALL_ACCOUNTS}
                name="All accounts"
                meta={`${accounts.length} accounts`}
                balance={total}
                onClick={() => pick(ALL_ACCOUNTS)}
              />
            </li>
          )}
          {accounts.map(a => (
            <li key={a.id}>
              <Row
                active={selectedAccountId === a.id || accounts.length === 1}
                name={a.name}
                meta={`${a.type}${qty(a) > 1 ? ` · ×${qty(a)}` : ''} · ${a.currency}`}
                balance={balances.get(a.id) ?? 0}
                onClick={() => pick(a.id)}
              />
            </li>
          ))}
          {accounts.length === 0 && <li className="px-2.5 py-3 text-[12.5px] text-ef-ink-3">No accounts yet.</li>}
        </ul>
        <div className="mt-1 flex gap-1 border-t border-ef-line pt-1.5">
          <button type="button" onClick={() => go('/accounts')} className="ef-btn ef-btn-ghost ef-btn-sm flex-1 justify-start">
            <GearSix className="h-3.5 w-3.5" /> Manage
          </button>
          <button type="button" onClick={() => go('/accounts')} className="ef-btn ef-btn-ghost ef-btn-sm flex-1 justify-start">
            <Plus className="h-3.5 w-3.5" /> Add account
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Row({
  active,
  name,
  meta,
  balance,
  onClick,
}: {
  active: boolean;
  name: string;
  meta: string;
  balance: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ef-focus flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-ef-hover',
        active && 'bg-ef-sunken',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ef-ink">{name}</span>
        <span className="ef-num block text-[10.5px] uppercase tracking-[0.06em] text-ef-ink-4">{meta}</span>
      </span>
      <span className="ef-num shrink-0 text-[12.5px] text-ef-ink-2">{fmtMoney(balance)}</span>
      <Check className={cn('h-3.5 w-3.5 shrink-0 text-ef-ink', !active && 'invisible')} weight="bold" />
    </button>
  );
}
