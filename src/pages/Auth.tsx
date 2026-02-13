import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Activity, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

  // MFA challenge state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Check if user has MFA factors that need verification
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter((f: any) => f.status === 'verified') || [];

      if (verifiedFactors.length > 0) {
        // User has MFA enabled — need to verify TOTP before proceeding
        setMfaFactorId(verifiedFactors[0].id);
        setMfaRequired(true);
        setLoading(false);
        return;
      }
      // No MFA — login is complete, auth state change will handle navigation
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Check your email for a 6-digit verification code!');
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

  // Email OTP verification screen after signup
  if (awaitingOtp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 justify-center mb-8">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">EDGEJOURNAL</h1>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="text-center">
              <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-bold">Verify Your Email</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Verification Code</Label>
              <Input
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="mt-1 bg-secondary border-border h-9 font-mono tracking-widest text-center text-lg"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && otpCode.length === 6) handleOtpVerify(); }}
              />
            </div>

            <Button className="w-full gap-2" onClick={handleOtpVerify} disabled={otpVerifying || otpCode.length !== 6}>
              <ShieldCheck className="h-4 w-4" />
              {otpVerifying ? 'Verifying...' : 'Verify Email'}
            </Button>

            <button
              type="button"
              onClick={() => { setAwaitingOtp(false); setOtpCode(''); }}
              className="text-xs text-muted-foreground hover:underline w-full text-center"
            >
              Back to sign up
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // MFA verification screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 justify-center mb-8">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">EDGEJOURNAL</h1>
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-3 justify-center mb-8">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">EDGEJOURNAL</h1>
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
