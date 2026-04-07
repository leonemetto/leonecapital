import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Activity, ArrowLeft, Check, X, Plus, Database, BarChart2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logoImg from '@/assets/logo.svg';

/* ─────────────────────────────────────────────────────── types */
type Step = 1 | 2 | 3 | 4 | 'done';
type AccountType = 'live' | 'demo' | 'prop';
type Direction   = 'long' | 'short';
type Outcome     = 'win' | 'loss' | 'breakeven';
type TSession    = 'London' | 'New York' | 'Asian' | 'London/NY Overlap';

interface Props {
  nickname: string;
  onComplete: () => Promise<void>;
}

/* ─────────────────────────────────────────────────────── constants */
const DEFAULT_CHECKLIST = ['HTF FVG', 'POI', 'CISD/IFVG'];
const SESSIONS: TSession[] = ['London', 'New York', 'Asian', 'London/NY Overlap'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES'];
const TOTAL_STEPS = 4;

/* ─────────────────────────────────────────────────────── sub-components */

function ProgressDots({ step }: { step: Step }) {
  if (step === 'done') return null;
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        const isActive    = n === step;
        const isCompleted = typeof step === 'number' && n < step;
        return (
          <div
            key={n}
            className={cn(
              'rounded-full transition-all duration-300',
              isCompleted ? 'w-2.5 h-2.5 bg-[#4ade80]' :
              isActive    ? 'w-2.5 h-2.5 bg-white' :
                            'w-2 h-2 bg-[rgba(255,255,255,0.2)]',
            )}
          />
        );
      })}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.6)] transition-colors mb-6"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  );
}

function PillButton<T extends string>({
  value, active, onClick, children,
}: {
  value: T; active: boolean; onClick: (v: T) => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'px-4 py-2 rounded-full text-[13px] font-medium transition-all border',
        active
          ? 'bg-[#4ade80] text-black border-transparent'
          : 'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.45)] border-[rgba(255,255,255,0.1)] hover:text-[rgba(255,255,255,0.7)]',
      )}
    >
      {children}
    </button>
  );
}

function GreenButton({
  onClick, disabled, loading, children,
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full py-3.5 rounded-[24px] text-[14px] font-bold transition-all',
        'bg-[#4ade80] text-black hover:bg-[#22c55e]',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
      )}
    >
      {loading ? 'Saving…' : children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────── main component */

export function OnboardingFlow({ nickname, onComplete }: Props) {
  const navigate = useNavigate();

  /* ── step state */
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  /* ── step 2: account */
  const [accountName, setAccountName]       = useState('');
  const [accountType, setAccountType]       = useState<AccountType>('live');
  const [startingBalance, setStartingBalance] = useState('');
  const [currency, setCurrency]             = useState('USD');
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  /* ── step 3: checklist */
  const [items, setItems]     = useState<string[]>([...DEFAULT_CHECKLIST]);
  const [newItem, setNewItem] = useState('');

  /* ── step 4: trade */
  const [instrument, setInstrument]   = useState('');
  const [direction, setDirection]     = useState<Direction>('long');
  const [outcome, setOutcome]         = useState<Outcome>('win');
  const [pnl, setPnl]                 = useState('');
  const [tradeSession, setTradeSession] = useState<TSession>('New York');

  /* ─────────────────── step handlers */

  const handleStep2 = async () => {
    if (!accountName.trim()) { toast.error('Please enter an account name'); return; }
    const bal = parseFloat(startingBalance);
    if (!startingBalance || isNaN(bal) || bal <= 0) { toast.error('Please enter a valid starting balance'); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: accountName.trim(),
          type: accountType,
          starting_balance: bal,
          current_balance: bal,
          currency,
        })
        .select()
        .single();

      if (error) throw error;
      setCreatedAccountId(data.id);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleStep3 = async () => {
    if (items.length === 0) { toast.error('Add at least one checklist item'); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rows = items.map((label, i) => ({
        user_id: user.id,
        label,
        category: 'General',
        is_active: true,
        sort_order: i,
      }));

      const { error } = await supabase.from('criteria_settings' as any).insert(rows);
      if (error) throw error;
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleStep4 = async (skip = false) => {
    if (!skip) {
      if (!instrument.trim()) { toast.error('Please enter an instrument'); return; }
      const pnlVal = parseFloat(pnl);
      if (!pnl || isNaN(pnlVal)) { toast.error('Please enter a P&L amount'); return; }
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!skip) {
        const pnlVal = parseFloat(pnl);
        const { error: tradeError } = await supabase.from('trades').insert({
          user_id: user.id,
          account_id: createdAccountId || null,
          date: new Date().toISOString().split('T')[0],
          instrument: instrument.trim(),
          direction,
          outcome,
          pnl: pnlVal,
          session: tradeSession,
        });
        if (tradeError) throw tradeError;

        // Update account current_balance to reflect the logged trade
        if (createdAccountId) {
          const { data: acc } = await supabase
            .from('accounts')
            .select('current_balance')
            .eq('id', createdAccountId)
            .single();
          if (acc) {
            await supabase
              .from('accounts')
              .update({ current_balance: Number(acc.current_balance) + pnlVal })
              .eq('id', createdAccountId);
          }
        }
      }

      await onComplete();
      setStep('done');

      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────── card wrapper */
  const card = (content: React.ReactNode) => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.95)' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={String(step)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28 }}
          className="w-full"
          style={{ maxWidth: 520 }}
        >
          <div
            className="w-full"
            style={{
              background: '#0f0f0f',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 40,
            }}
          >
            <ProgressDots step={step} />
            {content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /* ─────────────────── STEP 1 */
  if (step === 1) return card(
    <div className="space-y-6">
      <div className="text-center">
        <img src={logoImg} alt="EdgeFlow" className="h-12 w-12 rounded-2xl mx-auto mb-5" />
        <h1 className="text-[22px] font-black tracking-tight mb-2">
          Welcome to EdgeFlow, {nickname}
        </h1>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)] leading-relaxed">
          Before you start, understand what this tool is built to do.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <Database className="h-5 w-5 text-[#4ade80] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-white mb-0.5">The Truth Machine</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.4)] leading-relaxed">
              Every trade you log becomes data. Every pattern in that data becomes a signal.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <BarChart2 className="h-5 w-5 text-[#4ade80] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-white mb-0.5">No Opinions, Only Data</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.4)] leading-relaxed">
              EdgeFlow doesn't care how you felt about a trade. It cares whether it made money over time.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <Brain className="h-5 w-5 text-[#4ade80] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-white mb-0.5">Your Edge is Quantifiable</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.4)] leading-relaxed">
              A real edge is a measurable statistical advantage. EdgeFlow helps you prove or disprove every strategy you trade.
            </p>
          </div>
        </div>
      </div>

      <GreenButton onClick={() => setStep(2)}>
        I understand, let's build my edge →
      </GreenButton>
    </div>
  );

  /* ─────────────────── STEP 2 */
  if (step === 2) return card(
    <div className="space-y-5">
      <BackButton onClick={() => setStep(1)} />

      <div>
        <h2 className="text-[20px] font-black tracking-tight mb-1">Set up your trading account</h2>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)]">
          This is where your trades will be logged and tracked.
        </p>
      </div>

      <div className="space-y-4">
        {/* Account Name */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">
            Account Name
          </Label>
          <Input
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            placeholder="My Futures Account"
            className="mt-1.5 bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] h-10"
          />
        </div>

        {/* Account Type */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">
            Account Type
          </Label>
          <div className="flex gap-2 mt-1.5">
            {(['live', 'demo', 'prop'] as AccountType[]).map(t => (
              <PillButton key={t} value={t} active={accountType === t} onClick={setAccountType}>
                {t === 'prop' ? 'Prop Firm' : t.charAt(0).toUpperCase() + t.slice(1)}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Starting Balance */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">
            Starting Balance
          </Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.35)] text-sm">$</span>
            <Input
              type="number"
              value={startingBalance}
              onChange={e => setStartingBalance(e.target.value)}
              placeholder="10,000"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] h-10 pl-7"
            />
          </div>
        </div>

        {/* Currency */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">
            Currency
          </Label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {CURRENCIES.map(c => (
              <PillButton key={c} value={c} active={currency === c} onClick={setCurrency}>
                {c}
              </PillButton>
            ))}
          </div>
        </div>
      </div>

      <GreenButton onClick={handleStep2} loading={saving}>
        Create Account →
      </GreenButton>

      <p className="text-center text-[11px] text-[rgba(255,255,255,0.25)]">
        You can add more accounts later
      </p>
    </div>
  );

  /* ─────────────────── STEP 3 */
  if (step === 3) return card(
    <div className="space-y-5">
      <BackButton onClick={() => setStep(2)} />

      <div>
        <h2 className="text-[20px] font-black tracking-tight mb-1">What does a valid trade look like?</h2>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)] leading-relaxed">
          Add the criteria every trade must meet before you enter. This becomes your pre-trade checklist.
        </p>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]"
          >
            <Check className="h-3.5 w-3.5 text-[#4ade80] shrink-0" />
            <span className="flex-1 text-[13px] text-[rgba(255,255,255,0.8)]">{item}</span>
            <button
              type="button"
              onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
              className="text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.6)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      {items.length < 8 && (
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="Add a criteria…"
            className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] h-9 text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && newItem.trim()) {
                setItems(prev => [...prev, newItem.trim()]);
                setNewItem('');
              }
            }}
          />
          <button
            type="button"
            disabled={!newItem.trim()}
            onClick={() => {
              if (newItem.trim()) {
                setItems(prev => [...prev, newItem.trim()]);
                setNewItem('');
              }
            }}
            className={cn(
              'px-3 rounded-lg border text-sm transition-colors',
              newItem.trim()
                ? 'bg-[#4ade80] text-black border-transparent'
                : 'bg-transparent text-[rgba(255,255,255,0.25)] border-[rgba(255,255,255,0.1)] cursor-not-allowed',
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      {items.length >= 8 && (
        <p className="text-[11px] text-[rgba(255,255,255,0.25)]">Maximum 8 items reached</p>
      )}

      <GreenButton onClick={handleStep3} loading={saving} disabled={items.length === 0}>
        Set My Checklist →
      </GreenButton>

      <p className="text-center text-[11px] text-[rgba(255,255,255,0.25)]">
        Don't overthink this — you can customize it anytime in settings
      </p>
    </div>
  );

  /* ─────────────────── STEP 4 */
  if (step === 4) return card(
    <div className="space-y-5">
      <BackButton onClick={() => setStep(3)} />

      <div>
        <h2 className="text-[20px] font-black tracking-tight mb-1">Log your first trade</h2>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)]">
          It takes 30 seconds. The more you log, the smarter EdgeFlow gets.
        </p>
      </div>

      <div className="space-y-4">
        {/* Instrument */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Instrument</Label>
          <Input
            value={instrument}
            onChange={e => setInstrument(e.target.value)}
            placeholder="NQ, ES, EURUSD…"
            className="mt-1.5 bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] h-10"
          />
        </div>

        {/* Direction */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Direction</Label>
          <div className="flex gap-2 mt-1.5">
            <PillButton value="long"  active={direction === 'long'}  onClick={setDirection}>Long</PillButton>
            <PillButton value="short" active={direction === 'short'} onClick={setDirection}>Short</PillButton>
          </div>
        </div>

        {/* Result */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Result</Label>
          <div className="flex gap-2 mt-1.5">
            <PillButton value="win"        active={outcome === 'win'}        onClick={setOutcome}>Win</PillButton>
            <PillButton value="loss"       active={outcome === 'loss'}       onClick={setOutcome}>Loss</PillButton>
            <PillButton value="breakeven"  active={outcome === 'breakeven'}  onClick={setOutcome}>BE</PillButton>
          </div>
        </div>

        {/* P&L */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">P&amp;L Amount</Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.35)] text-sm">$</span>
            <Input
              type="number"
              value={pnl}
              onChange={e => setPnl(e.target.value)}
              placeholder="0.00"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] h-10 pl-7"
            />
          </div>
        </div>

        {/* Session */}
        <div>
          <Label className="text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Session</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {SESSIONS.map(s => (
              <PillButton key={s} value={s} active={tradeSession === s} onClick={setTradeSession}>
                {s}
              </PillButton>
            ))}
          </div>
        </div>
      </div>

      <GreenButton onClick={() => handleStep4(false)} loading={saving}>
        Log Trade &amp; Enter EdgeFlow →
      </GreenButton>

      <button
        type="button"
        onClick={() => handleStep4(true)}
        disabled={saving}
        className="w-full text-center text-[12px] text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] underline underline-offset-2 transition-colors"
      >
        Skip for now, I'll log later
      </button>
    </div>
  );

  /* ─────────────────── COMPLETION */
  if (step === 'done') return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto w-16 h-16 rounded-full bg-[#4ade80] flex items-center justify-center"
        >
          <Check className="h-8 w-8 text-black stroke-[3]" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[18px] font-bold text-white"
        >
          Your EdgeFlow is ready.
        </motion.p>
      </motion.div>
    </div>
  );

  return null;
}
