import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSharedTrades } from '@/contexts/TradesContext';
import { AccountFormData, ACCOUNT_TYPES, CURRENCIES } from '@/types/account';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PlusCircle, Wallet, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type BalanceEditState = { id: string; balance: string } | null;
type NameEditState = { id: string; name: string } | null;

const CARD = 'rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)]';
const FIELD_LABEL = 'text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(255,255,255,0.3)]';
const FIELD_INPUT = 'mt-1 bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] h-9 placeholder:text-[rgba(255,255,255,0.2)]';

const BADGE_STYLES: Record<string, string> = {
  live: 'bg-white text-black',
  demo: 'bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)]',
  prop: 'bg-amber-400/20 text-amber-300',
};

const Accounts = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useSharedAccounts();
  const { trades } = useSharedTrades();
  const [open, setOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<BalanceEditState>(null);
  const [editingName, setEditingName] = useState<NameEditState>(null);
  const [form, setForm] = useState<AccountFormData>({
    name: '', type: 'live', startingBalance: 0, currentBalance: 0, currency: 'USD',
  });

  const update = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Account name is required'); return; }
    try {
      await addAccount(form);
      toast.success('Account created!');
      setForm({ name: '', type: 'live', startingBalance: 0, currentBalance: 0, currency: 'USD' });
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-[-0.5px]">Trading Accounts</h1>
          <p className="text-xs text-[rgba(255,255,255,0.3)]">Manage your accounts and track balances</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 rounded-[24px]">
              <PlusCircle className="h-3.5 w-3.5" /> New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[#0e0e0e] border-[rgba(255,255,255,0.1)]">
            <DialogHeader>
              <DialogTitle className="text-white">Create Trading Account</DialogTitle>
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
              <Button type="submit" size="sm" className="w-full gap-1.5 bg-white text-black hover:bg-white/90 rounded-[24px] font-semibold">
                <Wallet className="h-3.5 w-3.5" /> Create Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.05)] mb-5">
            <Wallet className="h-8 w-8 text-[rgba(255,255,255,0.4)]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No accounts yet</h2>
          <p className="text-sm text-[rgba(255,255,255,0.4)] mb-5">Create a trading account to start tracking balances</p>
          <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 rounded-[24px]" onClick={() => setOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" /> Create First Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((account, i) => {
            const currentBalance = getAccountBalance(account.id, account.currentBalance);
            const pnl = currentBalance - account.startingBalance;
            const pnlPercent = account.startingBalance > 0 ? (pnl / account.startingBalance) * 100 : 0;
            const tradeCount = getAccountTradeCount(account.id);

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className={cn(CARD, 'p-5')}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wallet className="h-4 w-4 shrink-0 text-[rgba(255,255,255,0.35)]" />
                    {editingName?.id === account.id ? (
                      <span className="flex items-center gap-1 min-w-0">
                        <Input
                          value={editingName.name}
                          onChange={e => setEditingName({ ...editingName, name: e.target.value })}
                          className="h-6 w-36 text-[12px] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.15)] px-1.5"
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
                          className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] hover:text-white"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setEditingName(null)} className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)]">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <button
                        className="flex items-center gap-1 group min-w-0"
                        onClick={() => setEditingName({ id: account.id, name: account.name })}
                        title="Click to rename"
                      >
                        <span className="text-sm font-semibold text-white truncate">{account.name}</span>
                        <Pencil className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity text-[rgba(255,255,255,0.6)]" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', BADGE_STYLES[account.type] || 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)]')}>
                      {account.type}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Delete this account? This cannot be undone.')) {
                          deleteAccount(account.id);
                          toast.success('Account deleted');
                        }
                      }}
                      className="p-1 rounded text-[rgba(255,255,255,0.25)] hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.08)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div className="space-y-2">
                  <div>
                    <span className={FIELD_LABEL}>Current Balance</span>
                    <p className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
                      {currencySymbol(account.currency)}{currentBalance.toFixed(2)}
                    </p>
                  </div>

                  {/* P&L row */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className={cn('font-mono font-bold', pnl >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]')}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                    </span>
                    <span className="text-[rgba(255,255,255,0.35)]">{tradeCount} trades</span>
                  </div>

                  {/* Starting balance edit */}
                  <div className="flex items-center gap-1.5 text-[10px] text-[rgba(255,255,255,0.35)]">
                    <span>Starting: {account.currency}</span>
                    {editingBalance?.id === account.id ? (
                      <span className="flex items-center gap-1">
                        <Input
                          type="number" step="any"
                          value={editingBalance.balance}
                          onChange={e => setEditingBalance({ ...editingBalance, balance: e.target.value })}
                          className="h-6 w-24 text-[10px] font-mono bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.15)] px-1.5"
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
                          className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] hover:text-white"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setEditingBalance(null)} className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)]">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        {account.startingBalance.toLocaleString()}
                        <button
                          onClick={() => setEditingBalance({ id: account.id, balance: String(account.startingBalance) })}
                          className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)] transition-colors"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Accounts;
