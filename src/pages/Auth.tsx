import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, EnvelopeSimple, ShieldCheck, Eye, EyeSlash,
} from '@phosphor-icons/react';
import logoImg from '@/assets/logo.svg';


const G = 'oklch(0.78 0.22 145)';

const AUTH_STARS = Array.from({ length: 120 }, (_, i) => {
  const isBright = Math.random() > 0.72;
  return {
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: isBright ? Math.random() * 0.6 + 0.55 : Math.random() * 0.4 + 0.2,
    op: isBright ? Math.random() * 0.38 + 0.18 : Math.random() * 0.18 + 0.04,
    delay: Math.random() * 7,
    dur: 2.5 + Math.random() * 4,
    blue: Math.random() > 0.8,
  };
});

const EMAIL_TYPO_MAP: Record<string, string> = {
  'gnail.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gmali.com': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmsil.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.om': 'gmail.com', 'gmail.cmo': 'gmail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yhaoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com', 'yahoo.cm': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'hotnail.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmali.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.cm': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outloo.com': 'outlook.com', 'outlok.com': 'outlook.com', 'outloook.com': 'outlook.com',
  'outlook.co': 'outlook.com', 'outlook.cm': 'outlook.com',
  'iclod.com': 'icloud.com', 'iclould.com': 'icloud.com', 'icloid.com': 'icloud.com',
  'icloud.co': 'icloud.com', 'icloud.cm': 'icloud.com',
  'proton.co': 'proton.me', 'protonmail.co': 'protonmail.com',
};

function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).toLowerCase();
  const fix = EMAIL_TYPO_MAP[domain];
  return fix ? email.slice(0, at + 1) + fix : null;
}

function authErrorMessage(error: { message: string; code?: string }): string {
  const msg = error.message?.toLowerCase() ?? '';
  if (msg.includes('invalid login credentials') || error.code === 'invalid_credentials')
    return 'Incorrect email or password.';
  if (msg.includes('email not confirmed') || error.code === 'email_not_confirmed')
    return 'Please verify your email before signing in. Check your inbox for the 6-digit code.';
  if (msg.includes('user not found') || msg.includes('no user found'))
    return 'No account found with this email address.';
  if (msg.includes('too many requests') || error.code === 'over_request_rate_limit')
    return 'Too many attempts. Please wait and try again.';
  return error.message;
}

/* ── shared primitives ── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0d0d0d',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '36px 32px',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 24px 48px rgba(0,0,0,0.8)',
    }}>
      {children}
    </div>
  );
}

function PrimaryBtn({
  onClick, type = 'button', disabled, loading, children,
}: {
  onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '12px 20px', borderRadius: 24,
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
        background: (disabled || loading) ? 'rgba(255,255,255,0.12)' : '#fff',
        color: (disabled || loading) ? 'rgba(255,255,255,0.35)' : '#000',
        border: 'none', cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, color: 'rgba(255,255,255,0.35)', padding: 0,
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, margin: '0 0 6px' }}>
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

function GoogleBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', padding: '11px 20px', borderRadius: 24,
        fontSize: 13, fontWeight: 600,
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.12)',
        color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? 'Connecting…' : 'Continue with Google'}
    </button>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
      <img src={logoImg} alt="EdgeFlow" style={{ width: 44, height: 44, borderRadius: 12 }} />
      <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>EdgeFlow</span>
    </div>
  );
}

function PasswordInput({
  value, onChange, placeholder = '••••••••', minLength,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={minLength}
        className="h-10 pr-10"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}
      >
        {show ? <EyeSlash size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ main component */

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [signupOtp, setSignupOtp] = useState('');
  const [verifyingSignup, setVerifyingSignup] = useState(false);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) toast.error(error.message);
    else { toast.success('New code sent. Check your email.'); startCooldown(); }
    setResending(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) toast.error(error.message);
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!isLogin && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(authErrorMessage(error)); setLoading(false); return; }
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter((f: any) => f.status === 'verified') || [];
      if (verifiedFactors.length > 0) {
        setMfaFactorId(verifiedFactors[0].id);
        setMfaRequired(true);
        setLoading(false);
        return;
      }
      navigate('/dashboard', { replace: true });
      return;
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast.error(authErrorMessage(error));
      else { setSignupOtp(''); setAwaitingOtp(true); }
    }
    setLoading(false);
  };

  const handleVerifySignupOtp = async () => {
    if (signupOtp.length < 6) return;
    setVerifyingSignup(true);
    const { error } = await supabase.auth.verifyOtp({
      email, token: signupOtp, type: 'signup',
    });
    if (error) {
      toast.error(error.message?.toLowerCase().includes('expired')
        ? 'Code expired. Tap "Resend code" to get a new one.'
        : 'Incorrect code. Check your email and try again.');
      setVerifyingSignup(false);
      return;
    }
    toast.success('Email verified!');
    navigate('/dashboard', { replace: true });
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId || totpCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId, challengeId: challenge.id, code: totpCode,
      });
      if (verifyError) throw verifyError;
      toast.success('2FA verified!');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://www.edgeflow.capital/auth/callback',
    });
    if (error) toast.error(error.message);
    else setResetSent(true);
    setResetLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
  };

  const wrap = (content: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden', ['--ring' as string]: '142 50% 36%' }}>
      <style>{`@keyframes authStarFlicker{0%{opacity:var(--star-op,0.2)}8%{opacity:calc(var(--star-op,0.2)*0.45)}12%{opacity:var(--star-op,0.2)}50%{opacity:var(--star-op,0.2)}57%{opacity:calc(var(--star-op,0.2)*0.55)}62%{opacity:var(--star-op,0.2)}100%{opacity:var(--star-op,0.2)}}`}</style>
      {/* Stars */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {AUTH_STARS.map((s, i) => (
          <span key={i} style={{
            position: 'absolute',
            borderRadius: '50%',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r * 2}px`,
            height: `${s.r * 2}px`,
            background: s.blue ? 'rgba(200,220,255,0.95)' : '#fff',
            boxShadow: '0 0 2px 1px rgba(255,255,255,0.14)',
            ['--star-op' as string]: s.op,
            animationName: 'authStarFlicker',
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          } as React.CSSProperties} />
        ))}
      </div>
      {/* Bottom wordmark — matches landing page brand-wash exactly */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        overflow: 'hidden', zIndex: 0, pointerEvents: 'none',
        isolation: 'isolate',
      }}>
        {/* Outer glow */}
        <div style={{
          position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%,-50%)',
          width: '80%', height: '80%',
          background: 'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(30,211,134,0.30) 0%, rgba(30,211,134,0.14) 30%, transparent 65%)',
          filter: 'blur(50px)', zIndex: 0,
        }} />
        {/* Inner bright glow */}
        <div style={{
          position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%,-50%)',
          width: '60%', height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(58,255,157,0.12) 0%, transparent 65%)',
          filter: 'blur(50px)', mixBlendMode: 'screen', zIndex: 3,
        }} />
        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          fontFamily: '"Inter Tight", system-ui, sans-serif',
          fontWeight: 700, fontSize: '24.5vw', lineHeight: 0.88,
          letterSpacing: '-0.055em', margin: 0, padding: 0, whiteSpace: 'nowrap',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.88) 20%, rgba(180,180,180,0.60) 50%, rgba(110,110,110,0.38) 75%, rgba(60,60,60,0.22) 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          userSelect: 'none',
        }}>EdgeFlow</div>
      </div>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        {content}
      </motion.div>
    </div>
  );

  /* ── Forgot password ── */
  if (forgotPassword) return wrap(
    <>
      <Card>
        {resetSent ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <EnvelopeSimple size={20} color="rgba(255,255,255,0.6)" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Check your email</p>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
                Reset link sent to <span style={{ color: 'rgba(255,255,255,0.75)' }}>{resetEmail}</span>
              </p>
            </div>
            <div style={{ marginTop: 8 }}>
              <GhostBtn onClick={() => { setForgotPassword(false); setResetSent(false); setResetEmail(''); }}>
                ← Back to sign in
              </GhostBtn>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Reset password</p>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>We'll send a reset link to your email.</p>
            </div>
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" required autoFocus className="h-10" style={inputStyle} />
              </div>
              <PrimaryBtn type="submit" loading={resetLoading}>{resetLoading ? 'Sending…' : 'Send reset link'}</PrimaryBtn>
            </form>
            <div style={{ textAlign: 'center' }}>
              <GhostBtn onClick={() => setForgotPassword(false)}>← Back to sign in</GhostBtn>
            </div>
          </div>
        )}
      </Card>
    </>
  );

  /* ── Email OTP verification ── */
  if (awaitingOtp) return wrap(
    <>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <EnvelopeSimple size={20} color="rgba(255,255,255,0.6)" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Enter verification code</p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>
              We sent a code to{' '}
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>{email}</span>.
            </p>
            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, margin: '10px 0 0' }}>
              Don't see it? Check your spam or promotions folder.
            </p>
          </div>
          <div>
            <FieldLabel>Verification code</FieldLabel>
            <Input
              value={signupOtp}
              onChange={e => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Paste code"
              maxLength={10}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              className="h-12 text-center text-xl tracking-[0.3em] font-mono"
              style={inputStyle}
              onKeyDown={e => { if (e.key === 'Enter' && signupOtp.length >= 6) handleVerifySignupOtp(); }}
            />
          </div>
          <PrimaryBtn onClick={handleVerifySignupOtp} disabled={signupOtp.length < 6} loading={verifyingSignup}>
            {verifyingSignup ? 'Verifying…' : 'Verify and continue'}
          </PrimaryBtn>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              style={{
                fontSize: 12, fontWeight: 600, color: resendCooldown > 0 ? 'rgba(255,255,255,0.2)' : G,
                background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', padding: 0,
              }}
            >
              {resending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
            <GhostBtn onClick={() => { setAwaitingOtp(false); setSignupOtp(''); }}>Wrong email? Change it</GhostBtn>
          </div>
        </div>
      </Card>
    </>
  );

  /* ── MFA ── */
  if (mfaRequired) return wrap(
    <>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <ShieldCheck size={20} color="rgba(255,255,255,0.6)" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Two-factor authentication</p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Enter the 6-digit code from your authenticator app.</p>
          </div>
          <div>
            <FieldLabel>Verification code</FieldLabel>
            <Input
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000 000"
              maxLength={6}
              autoFocus
              className="h-12 text-center text-xl tracking-[0.3em] font-mono"
              style={inputStyle}
              onKeyDown={e => { if (e.key === 'Enter' && totpCode.length === 6) handleMfaVerify(); }}
            />
          </div>
          <PrimaryBtn onClick={handleMfaVerify} disabled={totpCode.length !== 6} loading={verifying}>
            {verifying ? 'Verifying…' : 'Verify'}
          </PrimaryBtn>
          <div style={{ textAlign: 'center' }}>
            <GhostBtn onClick={() => { setMfaRequired(false); setTotpCode(''); setMfaFactorId(null); supabase.auth.signOut(); }}>
              Cancel and sign out
            </GhostBtn>
          </div>
        </div>
      </Card>
    </>
  );

  /* ── Main sign in / sign up ── */
  return wrap(
    <>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, gap: 4 }}>
            {(['Sign in', 'Sign up'] as const).map((label, i) => {
              const active = isLogin ? i === 0 : i === 1;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsLogin(i === 0)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.35)',
                    border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'signup'}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoFocus className="h-10" style={inputStyle}
                />
                {!isLogin && (() => {
                  const s = suggestEmail(email);
                  return s ? (
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>
                      Did you mean{' '}
                      <button
                        type="button"
                        onClick={() => setEmail(s)}
                        style={{ color: G, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11, textDecoration: 'underline' }}
                      >
                        {s}
                      </button>?
                    </p>
                  ) : null;
                })()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <FieldLabel>Password</FieldLabel>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(true); setResetEmail(email); }}
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <PasswordInput value={password} onChange={setPassword} minLength={isLogin ? undefined : 8} />
                {!isLogin && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '6px 0 0' }}>Minimum 8 characters</p>
                )}
              </div>
              <PrimaryBtn type="submit" loading={loading}>
                {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
              </PrimaryBtn>
            </motion.form>
          </AnimatePresence>

          <Divider />
          <GoogleBtn onClick={handleGoogleSignIn} loading={googleLoading} />

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
            {isLogin ? "No account? " : "Already have one? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ color: G, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
            >
              {isLogin ? 'Start Pro trial' : 'Sign in'}
            </button>
          </p>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)', margin: 0, lineHeight: 1.6 }}>
            By continuing you agree to our{' '}
            <a href="/terms" style={{ color: 'rgba(255,255,255,0.28)', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.28)', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>
      </Card>
    </>
  );
}
