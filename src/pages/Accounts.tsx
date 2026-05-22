import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSharedTrades } from '@/contexts/TradesContext';
import { AccountFormData, TradingAccount, ACCOUNT_TYPES, CURRENCIES } from '@/types/account';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Plus, Wallet, Trash, PencilSimple, Check, X, Gear, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Trade } from '@/types/trade';

type BalanceEditState = { id: string; balance: string } | null;
type NameEditState = { id: string; name: string } | null;
type ChallengeEditState = {
  id: string;
  challengeSize: string;
  profitTargetPct: string;
  maxDailyDdPct: string;
  maxTotalDdPct: string;
  trailingDrawdown: boolean;
  challengeStartDate: string;
} | null;

function AccountSparkline({ trades, accountId }: { trades: Trade[]; accountId: string }) {
  const points = useMemo(() => {
    const accountTrades = trades
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (accountTrades.length < 2) return null;
    let cum = 0;
    return accountTrades.map(t => { cum += t.pnl; return cum; });
  }, [trades, accountId]);

  if (!points) return null;

  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const W = 120, H = 36;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(v => H - ((v - min) / range) * H);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const color = last >= 0 ? 'var(--ef-pos)' : 'var(--ef-neg)';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.5" fill={color} />
    </svg>
  );
}

const FIELD_LABEL = 'text-[10px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/60';
const FIELD_INPUT = 'mt-1 h-9';

const BADGE_STYLES: Record<string, string> = {
  live: 'bg-white text-black',
  demo: 'bg-muted text-muted-foreground',
  prop: 'bg-amber-400/20 text-amber-300',
};

const Accounts = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, selectedAccountId, setSelectedAccountId } = useSharedAccounts();
  const { trades } = useSharedTrades();
  const [open, setOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<BalanceEditState>(null);
  const [editingName, setEditingName] = useState<NameEditState>(null);
  const [editingQuantity, setEditingQuantity] = useState<{ id: string; quantity: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeEditState>(null);

  const openChallengeEditor = (account: TradingAccount) => {
    setEditingChallenge({
      id: account.id,
      challengeSize: account.challengeSize != null ? String(account.challengeSize) : '',
      profitTargetPct: account.profitTargetPct != null ? String(account.profitTargetPct) : '10',
      maxDailyDdPct: account.maxDailyDdPct != null ? String(account.maxDailyDdPct) : '5',
      maxTotalDdPct: account.maxTotalDdPct != null ? String(account.maxTotalDdPct) : '10',
      trailingDrawdown: account.trailingDrawdown ?? false,
      challengeStartDate: account.challengeStartDate ?? '',
    });
  };

  const saveChallengeSettings = async () => {
    if (!editingChallenge) return;
    const size = parseFloat(editingChallenge.challengeSize);
    if (!editingChallenge.challengeSize || isNaN(size) || size <= 0) {
      toast.error('Account size must be greater than 0');
      return;
    }
    try {
      await updateAccount(editingChallenge.id, {
        challengeSize: size,
        profitTargetPct: parseFloat(editingChallenge.profitTargetPct) || 10,
        maxDailyDdPct: parseFloat(editingChallenge.maxDailyDdPct) || 5,
        maxTotalDdPct: parseFloat(editingChallenge.maxTotalDdPct) || 10,
        trailingDrawdown: editingChallenge.trailingDrawdown,
        challengeStartDate: editingChallenge.challengeStartDate || undefined,
      });
      toast.success('Challenge settings saved');
      setEditingChallenge(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save challenge settings');
    }
  };

  const pendingDeleteTradeCount = useMemo(
    () => (pendingDelete ? trades.filter(t => t.accountId === pendingDelete.id).length : 0),
    [pendingDelete, trades],
  );

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    try {
      await deleteAccount(id);
      if (selectedAccountId === id) setSelectedAccountId('__all__');
      toast.success(`Deleted "${name}" and all its trades`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setPendingDelete(null);
    }
  };
  const [form, setForm] = useState<AccountFormData>({
    name: '', type: 'live', startingBalance: 0, currentBalance: 0, currency: 'USD', copyWeight: 1, quantity: 1, // copyWeight hidden from UI; advanced override only
  });

  const update = (key: string, value: string | number | boolean) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Account name is required'); return; }
    try {
      await addAccount(form);
      toast.success('Account created!');
      setForm({ name: '', type: 'live', startingBalance: 0, currentBalance: 0, currency: 'USD', copyWeight: 1, quantity: 1, // copyWeight hidden from UI; advanced override only
        challengeSize: undefined, profitTargetPct: undefined, maxDailyDdPct: undefined,
        maxTotalDdPct: undefined, trailingDrawdown: false, challengeStartDate: undefined });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    }
  };

  const getAccountBalance = (accountId: string, currentBalance: number) => {
    const totalPnl = trades.filter(t => t.accountId === accountId).reduce((sum, t) => sum + t.pnl, 0);
    return currentBalance + totalPnl;
  };

  const getAccountTradeCount = (accountId: string) => trades.filter(t => t.accountId === accountId).length;

  const currencySymbol = (c: string) => c === 'USD' ? '$' : c === 'EUR' ? '€' : c === 'GBP' ? '£' : '';

  return (
    <AppLayout>
      <PageHeader
        title="Trading Accounts"
        subtitle="Manage accounts and track balances"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 transition-colors"
            style={{
              height: 34, padding: '0 14px', borderRadius: 10,
              background: 'var(--ef-ink)', color: 'var(--ef-bg)',
              fontSize: 13, fontWeight: 500, border: 'none',
            }}
          >
            <Plus className="h-3.5 w-3.5" weight="bold" /> New Account
          </button>
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Trading Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <Label className={FIELD_LABEL}>Account Name</Label>
                <Input
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="e.g. Main Live Account"
                  className={FIELD_INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={FIELD_LABEL}>Type</Label>
                  <Select value={form.type} onValueChange={v => update('type', v)}>
                    <SelectTrigger className={FIELD_INPUT}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Currency</Label>
                  <Select value={form.currency} onValueChange={v => update('currency', v)}>
                    <SelectTrigger className={FIELD_INPUT}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className={FIELD_LABEL}>Starting Balance</Label>
                <Input
                  type="number" step="any"
                  value={form.startingBalance || ''}
                  onChange={e => update('startingBalance', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={cn(FIELD_INPUT, 'font-mono')}
                />
              </div>
              <div>
                <Label className={FIELD_LABEL}>Current Balance</Label>
                <Input
                  type="number" step="any"
                  value={form.currentBalance || ''}
                  onChange={e => update('currentBalance', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={cn(FIELD_INPUT, 'font-mono')}
                />
              </div>
              <div>
                <Label className={FIELD_LABEL}>Mirror Quantity</Label>
                <Input
                  type="number" step="1" min="1"
                  value={form.quantity ?? 1}
                  onChange={e => update('quantity', parseInt(e.target.value, 10) || 1)}
                  placeholder="1"
                  className={cn(FIELD_INPUT, 'font-mono')}
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Default 1. If this row represents 20 identical funded accounts you mirror across, set to 20.
                </p>
              </div>

              {/* Prop firm challenge config */}
              {form.type === 'prop' && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-amber-300/70 font-semibold">Challenge Settings</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={FIELD_LABEL}>Account Size ($)</Label>
                      <Input
                        type="number" step="any"
                        value={form.challengeSize || ''}
                        onChange={e => update('challengeSize', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 100000"
                        className={cn(FIELD_INPUT, 'font-mono')}
                      />
                    </div>
                    <div>
                      <Label className={FIELD_LABEL}>Profit Target (%)</Label>
                      <Input
                        type="number" step="0.1"
                        value={form.profitTargetPct || ''}
                        onChange={e => update('profitTargetPct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 10"
                        className={cn(FIELD_INPUT, 'font-mono')}
                      />
                    </div>
                    <div>
                      <Label className={FIELD_LABEL}>Max Daily DD (%)</Label>
                      <Input
                        type="number" step="0.1"
                        value={form.maxDailyDdPct || ''}
                        onChange={e => update('maxDailyDdPct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 5"
                        className={cn(FIELD_INPUT, 'font-mono')}
                      />
                    </div>
                    <div>
                      <Label className={FIELD_LABEL}>Max Total DD (%)</Label>
                      <Input
                        type="number" step="0.1"
                        value={form.maxTotalDdPct || ''}
                        onChange={e => update('maxTotalDdPct', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 10"
                        className={cn(FIELD_INPUT, 'font-mono')}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className={FIELD_LABEL}>Challenge Start Date</Label>
                    <Input
                      type="date"
                      value={form.challengeStartDate || ''}
                      onChange={e => update('challengeStartDate', e.target.value)}
                      className={cn(FIELD_INPUT, 'font-mono')}
                    />
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border">
                    <input
                      type="checkbox"
                      id="trailing-dd"
                      checked={form.trailingDrawdown ?? false}
                      onChange={e => update('trailingDrawdown', e.target.checked)}
                      className="h-3.5 w-3.5 accent-amber-400"
                    />
                    <label htmlFor="trailing-dd" className="text-xs text-foreground/80 cursor-pointer">
                      Trailing drawdown (from equity high watermark) — used by FTMO, Apex, etc.
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" style={{ width: '100%', height: 36, borderRadius: 10, background: 'var(--ef-ink)', color: 'var(--ef-bg)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', cursor: 'pointer' }}>
                <Wallet className="h-3.5 w-3.5" weight="bold" /> Create Account
              </button>
            </form>
          </DialogContent>
        </Dialog>

      {/* Empty state */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center" style={{ gap: 12 }}>
          <Wallet size={36} color="var(--ef-ink-4)" weight="light" />
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ef-ink)' }}>No accounts yet</div>
          <div style={{ fontSize: 13, color: 'var(--ef-ink-3)' }}>Create a trading account to start tracking balances</div>
          <button onClick={() => setOpen(true)} style={{ marginTop: 8, height: 36, padding: '0 18px', borderRadius: 24, background: 'var(--ef-ink)', color: 'var(--ef-bg)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer' }}>
            <Plus className="h-3.5 w-3.5" weight="bold" /> Create First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((account, i) => {
            const currentBalance = getAccountBalance(account.id, account.currentBalance);
            const pnl = currentBalance - account.startingBalance;
            const pnlPercent = account.startingBalance > 0 ? (pnl / account.startingBalance) * 100 : 0;
            const tradeCount = getAccountTradeCount(account.id);
            const accountTrades = trades.filter(t => t.accountId === account.id);
            const winRate = tradeCount > 0 ? Math.round((accountTrades.filter(t => t.pnl > 0).length / tradeCount) * 100) : null;

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)', borderRadius: 14, padding: '20px' }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wallet className="h-4 w-4 shrink-0 text-muted-foreground/60" weight="regular" />
                    {editingName?.id === account.id ? (
                      <span className="flex items-center gap-1 min-w-0">
                        <Input
                          value={editingName.name}
                          onChange={e => setEditingName({ ...editingName, name: e.target.value })}
                          className="h-6 w-36 text-[12px] px-1.5"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const name = editingName.name.trim();
                              if (!name) { toast.error('Name cannot be empty'); return; }
                              updateAccount(account.id, { name });
                              setEditingName(null);
                              toast.success('Account renamed');
                            }
                            if (e.key === 'Escape') setEditingName(null);
                          }}
                        />
                        <button
                          onClick={() => {
                            const name = editingName.name.trim();
                            if (!name) { toast.error('Name cannot be empty'); return; }
                            updateAccount(account.id, { name });
                            setEditingName(null);
                            toast.success('Account renamed');
                          }}
                          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Check className="h-3 w-3" weight="bold" />
                        </button>
                        <button onClick={() => setEditingName(null)} className="p-0.5 rounded hover:bg-muted text-muted-foreground/60">
                          <X className="h-3 w-3" weight="bold" />
                        </button>
                      </span>
                    ) : (
                      <button
                        className="flex items-center gap-1 group min-w-0"
                        onClick={() => setEditingName({ id: account.id, name: account.name })}
                        title="Click to rename"
                      >
                        <span className="text-sm font-semibold text-foreground truncate">{account.name}</span>
                        <PencilSimple className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity text-muted-foreground" weight="bold" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', BADGE_STYLES[account.type] || 'bg-muted text-muted-foreground')}>
                      {account.type}
                    </span>
                    <button
                      onClick={() => setPendingDelete({ id: account.id, name: account.name })}
                      className="p-1 rounded text-muted-foreground/50 hover:text-[var(--ef-neg)] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
                    >
                      <Trash className="h-3.5 w-3.5" weight="regular" />
                    </button>
                  </div>
                </div>

                {/* Balance + sparkline */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className={FIELD_LABEL}>Current Balance</span>
                    <p className="text-[22px] text-foreground mt-0.5 leading-none metric-number">
                      {currencySymbol(account.currency)}{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <AccountSparkline trades={trades} accountId={account.id} />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 rounded-md bg-muted/40 border border-border px-2.5 py-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 leading-none mb-0.5">P&L</p>
                    <p className={cn('text-[11px] leading-none metric-number', pnl >= 0 ? 'text-[var(--ef-pos)]' : 'text-[var(--ef-neg)]')}>
                      {pnl >= 0 ? '+' : ''}{currencySymbol(account.currency)}{Math.abs(pnl).toFixed(0)}
                      <span className="text-[9px] ml-1 opacity-70 font-normal" style={{ letterSpacing: 'normal' }}>({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
                    </p>
                  </div>
                  <div className="flex-1 rounded-md bg-muted/40 border border-border px-2.5 py-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 leading-none mb-0.5">Win Rate</p>
                    <p className={cn('text-[11px] leading-none metric-number', winRate !== null && winRate >= 50 ? 'text-[var(--ef-pos)]' : 'text-muted-foreground/60')}>
                      {winRate !== null ? `${winRate}%` : '—'}
                    </p>
                  </div>
                  <div className="flex-1 rounded-md bg-muted/40 border border-border px-2.5 py-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 leading-none mb-0.5">Trades</p>
                    <p className="text-[11px] font-bold font-mono leading-none text-foreground">{tradeCount}</p>
                  </div>
                </div>

                {/* Starting balance edit */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                  <span>Starting: {account.currency}</span>
                  {editingBalance?.id === account.id ? (
                    <span className="flex items-center gap-1">
                      <Input
                        type="number" step="any"
                        value={editingBalance.balance}
                        onChange={e => setEditingBalance({ ...editingBalance, balance: e.target.value })}
                        className="h-6 w-24 text-[10px] font-mono px-1.5"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat(editingBalance.balance);
                          if (isNaN(val)) { toast.error('Invalid balance'); return; }
                          updateAccount(account.id, { startingBalance: val });
                          setEditingBalance(null);
                          toast.success('Balance updated');
                        }}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground/60 hover:text-foreground"
                      >
                        <Check className="h-3 w-3" weight="bold" />
                      </button>
                      <button onClick={() => setEditingBalance(null)} className="p-0.5 rounded hover:bg-muted text-muted-foreground/60">
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      {account.startingBalance.toLocaleString()}
                      <button
                        onClick={() => setEditingBalance({ id: account.id, balance: String(account.startingBalance) })}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      >
                        <PencilSimple className="h-2.5 w-2.5" weight="bold" />
                      </button>
                    </span>
                  )}
                </div>
                {/* Prop challenge settings summary + edit */}
                {account.type === 'prop' && (
                  <div className="mt-3 pt-3 border-t border-dashed border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-amber-300/70">Challenge Settings</span>
                      <button
                        onClick={() => openChallengeEditor(account)}
                        className="flex items-center gap-1 text-[10px] text-amber-300/70 hover:text-amber-300 transition-colors"
                      >
                        <Gear className="h-3 w-3" weight="fill" />
                        Edit
                      </button>
                    </div>
                    {(!account.challengeSize || account.challengeSize <= 0) ? (
                      <button
                        onClick={() => openChallengeEditor(account)}
                        className="w-full flex items-center gap-2 text-[11px] text-amber-300/80 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2.5 py-2 hover:bg-amber-400/15 transition-colors"
                      >
                        <Warning className="h-3.5 w-3.5 shrink-0" weight="fill" />
                        Account size not set — click to configure
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/50">Size</span>
                          <span className="font-mono text-foreground/80">${account.challengeSize.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/50">Target</span>
                          <span className="font-mono text-foreground/80">{account.profitTargetPct ?? 10}%</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/50">Daily DD</span>
                          <span className="font-mono text-foreground/80">{account.maxDailyDdPct ?? 5}%</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground/50">Total DD</span>
                          <span className="font-mono text-foreground/80">{account.maxTotalDdPct ?? 10}%{account.trailingDrawdown ? ' trail' : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Mirror quantity (for users mirroring across N identical funded accounts) */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-1">
                  <span>Mirror quantity:</span>
                  {editingQuantity?.id === account.id ? (
                    <span className="flex items-center gap-1">
                      <Input
                        type="number" step="1" min="1"
                        value={editingQuantity.quantity}
                        onChange={e => setEditingQuantity({ ...editingQuantity, quantity: e.target.value })}
                        className="h-6 w-20 text-[10px] font-mono px-1.5"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const val = parseInt(editingQuantity.quantity, 10);
                          if (isNaN(val) || val < 1) { toast.error('Quantity must be ≥ 1'); return; }
                          updateAccount(account.id, { quantity: val });
                          setEditingQuantity(null);
                          toast.success('Quantity updated');
                        }}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground/60 hover:text-foreground"
                      >
                        <Check className="h-3 w-3" weight="bold" />
                      </button>
                      <button onClick={() => setEditingQuantity(null)} className="p-0.5 rounded hover:bg-muted text-muted-foreground/60">
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="font-mono">
                        {account.quantity ?? 1}
                        {(account.quantity ?? 1) > 1 && <span className="text-muted-foreground/50"> mirrored</span>}
                      </span>
                      <button
                        onClick={() => setEditingQuantity({ id: account.id, quantity: String(account.quantity ?? 1) })}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      >
                        <PencilSimple className="h-2.5 w-2.5" weight="bold" />
                      </button>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Challenge settings editor dialog */}
      <Dialog open={!!editingChallenge} onOpenChange={o => !o && setEditingChallenge(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Challenge Settings</DialogTitle>
          </DialogHeader>
          {editingChallenge && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={FIELD_LABEL}>Account Size ($) *</Label>
                  <Input
                    type="number" step="any"
                    value={editingChallenge.challengeSize}
                    onChange={e => setEditingChallenge(s => s && ({ ...s, challengeSize: e.target.value }))}
                    placeholder="e.g. 50000"
                    className={cn(FIELD_INPUT, 'font-mono')}
                    autoFocus
                  />
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Profit Target (%)</Label>
                  <Input
                    type="number" step="0.1"
                    value={editingChallenge.profitTargetPct}
                    onChange={e => setEditingChallenge(s => s && ({ ...s, profitTargetPct: e.target.value }))}
                    placeholder="e.g. 10"
                    className={cn(FIELD_INPUT, 'font-mono')}
                  />
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Max Daily DD (%)</Label>
                  <Input
                    type="number" step="0.1"
                    value={editingChallenge.maxDailyDdPct}
                    onChange={e => setEditingChallenge(s => s && ({ ...s, maxDailyDdPct: e.target.value }))}
                    placeholder="e.g. 5"
                    className={cn(FIELD_INPUT, 'font-mono')}
                  />
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Max Total DD (%)</Label>
                  <Input
                    type="number" step="0.1"
                    value={editingChallenge.maxTotalDdPct}
                    onChange={e => setEditingChallenge(s => s && ({ ...s, maxTotalDdPct: e.target.value }))}
                    placeholder="e.g. 10"
                    className={cn(FIELD_INPUT, 'font-mono')}
                  />
                </div>
              </div>
              <div>
                <Label className={FIELD_LABEL}>Challenge Start Date</Label>
                <Input
                  type="date"
                  value={editingChallenge.challengeStartDate}
                  onChange={e => setEditingChallenge(s => s && ({ ...s, challengeStartDate: e.target.value }))}
                  className={cn(FIELD_INPUT, 'font-mono')}
                />
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border">
                <input
                  type="checkbox"
                  id="edit-trailing-dd"
                  checked={editingChallenge.trailingDrawdown}
                  onChange={e => setEditingChallenge(s => s && ({ ...s, trailingDrawdown: e.target.checked }))}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <label htmlFor="edit-trailing-dd" className="text-xs text-foreground/80 cursor-pointer">
                  Trailing drawdown (from equity high watermark) — FTMO, Apex, etc.
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveChallengeSettings}
                  style={{ flex: 1, height: 36, borderRadius: 10, background: 'var(--ef-ink)', color: 'var(--ef-bg)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', cursor: 'pointer' }}
                >
                  <Check className="h-3.5 w-3.5" weight="bold" /> Save Settings
                </button>
                <button
                  onClick={() => setEditingChallenge(null)}
                  style={{ height: 36, padding: '0 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--ef-line)', color: 'var(--ef-ink-2)', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={o => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This permanently deletes the account and{' '}
                  <span className="font-semibold text-foreground">
                    {pendingDeleteTradeCount} trade{pendingDeleteTradeCount === 1 ? '' : 's'}
                  </span>{' '}
                  attached to it, including screenshots and checklist data.
                </p>
                <p>
                  The trades will disappear from Dashboard, Trades DB, Analytic, Leak Detection,
                  Optimizer, and Atlas. This cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-[var(--ef-neg)] text-white hover:bg-[var(--ef-neg)]/90"
            >
              Delete account & {pendingDeleteTradeCount} trade{pendingDeleteTradeCount === 1 ? '' : 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Accounts;
