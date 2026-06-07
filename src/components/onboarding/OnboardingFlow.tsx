import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Check, Sparkle, NotePencil, UploadSimple,
} from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 1 | 2 | 'done';
type AccountType = 'live' | 'demo' | 'prop';

interface Props {
  onComplete: () => Promise<void>;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'KES'];

/* ── shared components ── */

function ProgressBar({ step }: { step: Step }) {
  if (step === 'done') return null;
  const pct = typeof step === 'number' ? (step / 2) * 100 : 100;
  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl overflow-hidden bg-white/5">
      <motion.div
        className="h-full"
        style={{ background: 'oklch(0.65 0.17 155)' }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

function StepLabel({ step }: { step: Step }) {
  if (step === 'done') return null;
  return (
    <div className="flex items-center justify-between mb-6">
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Step {step} of 2
      </span>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 mb-5 transition-colors"
      style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
    >
      <ArrowLeft size={13} /> Back
    </button>
  );
}

function Chip({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 500,
        border: active ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.12)',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.45)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; } }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  onClick, disabled, loading, children, fullWidth = true,
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode; fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '13px 24px',
        borderRadius: 24,
        fontSize: 14,
        fontWeight: 700,
        background: (disabled || loading) ? 'rgba(255,255,255,0.15)' : '#fff',
        color: (disabled || loading) ? 'rgba(255,255,255,0.4)' : '#000',
        border: 'none',
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        letterSpacing: '-0.01em',
      }}
    >
      {loading ? 'Saving…' : children}
    </button>
  );
}

/* ── card wrapper ── */

function card(step: Step, content: React.ReactNode) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: '#080807' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={String(step)}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 560 }}
        >
          <div
            style={{
              position: 'relative',
              background: '#141413',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '40px 40px 36px',
              overflow: 'hidden',
            }}
          >
            <ProgressBar step={step} />
            {content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ main component */

export function OnboardingFlow({ onComplete }: Props) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  /* account defaults are pre-filled to reduce friction */
  const [accountName, setAccountName] = useState('Main Account');
  const [accountType, setAccountType] = useState<AccountType>('live');
  const [startingBalance, setStartingBalance] = useState('10000');
  const [currency, setCurrency] = useState('USD');
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  /* mount + user cache: avoids redundant auth.getUser per step and prevents
     setState-after-unmount AbortErrors when ProfileGate flips mid-flow */
  const mountedRef = useRef(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mountedRef.current) userIdRef.current = data.user?.id ?? null;
    });
    return () => { mountedRef.current = false; };
  }, []);

  const getUserId = async (): Promise<string> => {
    if (userIdRef.current) return userIdRef.current;
    const { data } = await supabase.auth.getUser();
    const id = data.user?.id;
    if (!id) throw new Error('Not authenticated');
    userIdRef.current = id;
    return id;
  };

  /* record current step in profiles.guide_progress so drop-off point is visible.
     fire-and-forget: never blocks UX, never throws. */
  const trackStep = (stepName: string) => {
    void (async () => {
      try {
        const userId = await getUserId();
        await supabase
          .from('profiles')
          .update({
            guide_progress: { onboarding_step: stepName, updated_at: new Date().toISOString() },
          } as any)
          .eq('user_id', userId);
      } catch {
        /* tracking failure is non-fatal */
      }
    })();
  };

  useEffect(() => {
    if (typeof step === 'number') trackStep(`step_${step}_viewed`);
  }, [step]);

  const safeSetSaving = (v: boolean) => { if (mountedRef.current) setSaving(v); };
  const safeSetStep = (s: Step) => { if (mountedRef.current) setStep(s); };

  /* ── step handlers ── */

  const handleCreateAccount = async () => {
    const name = accountName.trim() || 'Main Account';
    const bal = parseFloat(startingBalance);
    if (!startingBalance || isNaN(bal) || bal <= 0) {
      toast.error('Enter a valid starting balance');
      return;
    }

    safeSetSaving(true);
    try {
      const userId = await getUserId();
      const { data, error } = await supabase.from('accounts').insert({
        user_id: userId,
        name,
        type: accountType,
        starting_balance: bal,
        current_balance: bal,
        currency,
      }).select().single();
      if (error) throw error;
      if (!mountedRef.current) return;
      setCreatedAccountId(data.id);
      trackStep('account_created');
      safeSetStep(2);
    } catch (err: any) {
      if (mountedRef.current) toast.error(err.message || 'Failed to create account');
    } finally {
      safeSetSaving(false);
    }
  };

  /* loads demo data in the background — does NOT block onboarding completion,
     so a slow/failed demo insert can't break the funnel. */
  const loadDemoInBackground = async (userId: string, existingAccountId: string | null) => {
    try {
      const { generateDemoTrades } = await import('@/lib/demoData');

      let accountId = existingAccountId;
      if (!accountId) {
        const { data: acc } = await supabase.from('accounts').insert({
          user_id: userId,
          name: 'Demo Account',
          type: 'demo',
          starting_balance: 10000,
          current_balance: 10000,
          currency: 'USD',
        }).select().single();
        accountId = acc?.id ?? null;
      }
      if (!accountId) return;

      const demoTrades = generateDemoTrades();
      const totalPnl = demoTrades.reduce((s, t) => s + t.pnl, 0);
      const rows = demoTrades.map(t => ({
        user_id: userId,
        account_id: accountId,
        date: t.date, instrument: t.instrument, direction: t.direction,
        outcome: t.outcome, pnl: t.pnl, strategy: t.strategy, session: t.session,
        htf_bias: t.htf_bias, notes: t.notes, r_multiple: t.r_multiple,
        risk_percent: t.risk_percent, confidence_level: t.confidence_level,
        emotional_state: t.emotional_state, followed_plan: t.followed_plan,
        time_in_trade: t.time_in_trade, is_demo: true,
      }));
      await supabase.from('trades').insert(rows);
      await supabase.from('accounts')
        .update({ current_balance: 10000 + totalPnl })
        .eq('id', accountId);
    } catch (err) {
      console.warn('Demo data load failed (non-fatal):', err);
    }
  };

  const handleFinish = async (target: '/add-trade' | '/import-trades' | '/dashboard', loadDemo = false) => {
    safeSetSaving(true);
    try {
      const userId = await getUserId();
      trackStep(loadDemo ? 'finished_with_demo' : `finished_to_${target.replace('/', '')}`);

      /* mark onboarding complete FIRST so a slow demo insert can't fail the flow */
      await onComplete();

      /* fire-and-forget demo load — user lands on dashboard while it streams in */
      if (loadDemo) void loadDemoInBackground(userId, createdAccountId);

      /* navigate immediately — no setTimeout, no unmount race */
      navigate(target, { replace: true });
    } catch (err: any) {
      if (mountedRef.current) toast.error(err.message || 'Something went wrong');
      safeSetSaving(false);
    }
  };

  /* unified skip-to-dashboard: marks complete, navigates, no race */
  const handleSkipToDashboard = async () => {
    safeSetSaving(true);
    try {
      trackStep(`skipped_at_step_${step}`);
      await onComplete();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (mountedRef.current) {
        toast.error(err.message || 'Something went wrong');
        safeSetSaving(false);
      }
    }
  };

  /* ══════════════════════════════════════════════════ STEP 1 — Account */
  if (step === 1) return card(step,
    <div>
      <StepLabel step={step} />
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 6px' }}>Create your trading account</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
          This is where your trades get tracked. Use your live account, demo account, or prop challenge size. You can edit this later.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Account Name</Label>
          <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="My Futures Account" className="mt-1.5 h-10" />
        </div>

        <div>
          <Label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Account Type</Label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {(['live', 'demo', 'prop'] as AccountType[]).map(t => (
              <Chip key={t} active={accountType === t} onClick={() => setAccountType(t)}>
                {t === 'prop' ? 'Prop Firm' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Chip>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Starting Balance</Label>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '5px 0 0' }}>An estimate is fine.</p>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>$</span>
              <Input type="number" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} placeholder="10,000" className="h-10 pl-7" />
            </div>
          </div>
          <div>
            <Label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Currency</Label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {CURRENCIES.map(c => (
                <Chip key={c} active={currency === c} onClick={() => setCurrency(c)}>{c}</Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 18, padding: '13px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          onClick={() => setAcknowledged(!acknowledged)}
          style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
            border: acknowledged ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.2)',
            background: acknowledged ? 'rgba(255,255,255,0.9)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {acknowledged && <Check size={10} color="#000" weight="bold" />}
        </div>
        <span onClick={() => setAcknowledged(!acknowledged)} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, userSelect: 'none' }}>
          EdgeFlow is a journaling and analytics tool, not financial advice. I'm responsible for my own trading decisions.
        </span>
      </label>

      <div style={{ marginTop: 28 }}>
        <PrimaryButton onClick={handleCreateAccount} loading={saving} disabled={!accountName.trim() || !startingBalance || !acknowledged}>
          Continue to trade data →
        </PrimaryButton>
        <button
          type="button"
          onClick={handleSkipToDashboard}
          disabled={saving}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
        >
          Skip setup, go to dashboard →
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════ STEP 2 — Add data */
  if (step === 2) return card(step,
    <div>
      <StepLabel step={step} />
      <BackButton onClick={() => setStep(1)} />

      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 8px' }}>Add trade data</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
          EdgeFlow becomes useful when it has trades to read. Start with one recent trade, import history, or explore with demo data.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => !saving && handleFinish('/add-trade')}
          disabled={saving}
          style={{
            padding: '18px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.22)',
            background: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <NotePencil size={20} color="#000" weight="bold" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#000', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Log my first trade</p>
            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.58)', margin: 0, lineHeight: 1.45 }}>
              Start with one recent trade. Takes under 60 seconds.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => !saving && handleFinish('/import-trades')}
          disabled={saving}
          style={{
            padding: '18px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            cursor: saving ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UploadSimple size={20} color="rgba(255,255,255,0.7)" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Import trade history</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.45 }}>
              Upload a broker CSV and skip manual entry.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => !saving && handleFinish('/dashboard', true)}
          disabled={saving}
          style={{
            padding: '18px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            cursor: saving ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkle size={20} color="rgba(255,255,255,0.7)" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Explore demo data</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.45 }}>
              Load sample trades first. You can delete them anytime.
            </p>
          </div>
        </button>
      </div>

      {saving && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          Setting up your account…
        </p>
      )}

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button
          type="button"
          onClick={handleSkipToDashboard}
          disabled={saving}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
        >
          Skip setup, go to dashboard →
        </button>
      </div>
    </div>
  );

  return null;
}
