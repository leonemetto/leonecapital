import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Activity, LogIn, UserPlus, ShieldCheck, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { DottedSurface } from '@/components/ui/dotted-surface';

function authErrorMessage(error: { message: string; code?: string }): string {
  const msg = error.message?.toLowerCase() ?? '';
  if (msg.includes('invalid login credentials') || error.code === 'invalid_credentials') {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('email not confirmed') || error.code === 'email_not_confirmed') {
    return 'Please confirm your email before signing in. Check your inbox for the confirmation link.';
  }
  if (msg.includes('user not found') || msg.includes('no user found')) {
    return 'No account found with this email address.';
  }
  if (msg.includes('too many requests') || error.code === 'over_request_rate_limit') {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return error.message;
}

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // MFA challenge state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

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
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Verification code resent!');
      startCooldown();
    }
    setResending(false);
  };



  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
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

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(authErrorMessage(error));
        setLoading(false);
        return;
      }

      // Check if user has MFA factors that need verification
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter((f: any) => f.status === 'verified') || [];

      if (verifiedFactors.length > 0) {
        setMfaFactorId(verifiedFactors[0].id);
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      // No MFA — navigate to dashboard
      navigate('/dashboard', { replace: true });
      return;
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(authErrorMessage(error));
      } else {
        setAwaitingOtp(true);
      }
    }
    setLoading(false);
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId || totpCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: totpCode,
      });
      if (verifyError) throw verifyError;

      // Verification successful — session is now AAL2, auth state change handles navigation
      toast.success('2FA verified!');
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otpCode.length !== 6) return;
    setOtpVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (error) throw error;
      toast.success('Email verified! You are signed in.');
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://leone.capital/auth/callback',
    });
    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
    }
    setResetLoading(false);
  };

  // Forgot password screen
  if (forgotPassword) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <DottedSurface />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="flex items-center gap-3 justify-center mb-8">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">EDGEFLOW</h1>
          </div>
          <div className="glass-card p-6 space-y-5">
            {resetSent ? (
              <div className="text-center space-y-3 py-2">
                <Mail className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-lg font-bold">Check Your Email</h2>
                <p className="text-xs text-muted-foreground">
                  We sent a password reset link to <span className="font-medium text-foreground">{resetEmail}</span>. Click the link in the email to set a new password.
                </p>
                <button
                  type="button"
                  onClick={() => { setForgotPassword(false); setResetSent(false); setResetEmail(''); }}
                  className="text-xs text-primary font-semibold hover:underline w-full text-center pt-1"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h2 className="text-lg font-bold">Forgot Password</h2>
                  <p className="text-xs text-muted-foreground mt-1">Enter your email and we'll send you a reset link</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</Label>
                    <Input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="mt-1 bg-secondary border-border h-9"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={resetLoading}>
                    <Mail className="h-4 w-4" />
                    {resetLoading ? 'Sending…' : 'Send Reset Link'}
                  </Button>
                </form>
                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Email confirmation screen after signup
  if (awaitingOtp) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <DottedSurface />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="flex items-center gap-3 justify-center mb-8">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">EDGEFLOW</h1>
          </div>

          <div className="glass-card p-6 space-y-5 text-center">
            <Mail className="h-10 w-10 text-primary mx-auto" />
            <div>
              <h2 className="text-lg font-bold">Check Your Email</h2>
              <p className="text-xs text-muted-foreground mt-2">
                We sent a confirmation link to{' '}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link in the email to activate your account — you'll be signed in automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setAwaitingOtp(false); setOtpCode(''); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign up
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // MFA verification screen
  if (mfaRequired) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <DottedSurface />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 justify-center mb-8">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">EDGEFLOW</h1>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="text-center">
              <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-bold">Two-Factor Authentication</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Verification Code</Label>
              <Input
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="mt-1 bg-secondary border-border h-9 font-mono tracking-widest text-center text-lg"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && totpCode.length === 6) handleMfaVerify(); }}
              />
            </div>

            <Button className="w-full gap-2" onClick={handleMfaVerify} disabled={verifying || totpCode.length !== 6}>
              <ShieldCheck className="h-4 w-4" />
              {verifying ? 'Verifying...' : 'Verify'}
            </Button>

            <button
              type="button"
              onClick={() => { setMfaRequired(false); setTotpCode(''); setMfaFactorId(null); supabase.auth.signOut(); }}
              className="text-xs text-muted-foreground hover:underline w-full text-center"
            >
              Cancel and sign out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <DottedSurface />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-3 justify-center mb-8">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">EDGEFLOW</h1>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isLogin ? 'Sign in to access your data' : 'Sign up to start tracking trades'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 bg-secondary border-border h-9"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1 bg-secondary border-border h-9"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
            {isLogin && (
              <button
                type="button"
                onClick={() => { setForgotPassword(true); setResetEmail(email); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-right"
              >
                Forgot password?
              </button>
            )}
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={googleLoading}>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
