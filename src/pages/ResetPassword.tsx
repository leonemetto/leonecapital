import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Activity, KeyRound, ShieldCheck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DottedSurface } from '@/components/ui/dotted-surface';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash, which auto-signs the user in.
    // We listen for the SIGNED_IN event with type=recovery.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
      }
      setChecking(false);
    });

    // Also check if there's already a session (user navigated back)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success('Password updated! You can now sign in.');
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <DottedSurface />
        <p className="text-muted-foreground text-sm relative z-10">Verifying link…</p>
      </div>
    );
  }

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
          {done ? (
            <div className="text-center space-y-3 py-2">
              <CheckCircle className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-lg font-bold">Password Updated</h2>
              <p className="text-xs text-muted-foreground">Your password has been reset. You can now sign in with your new password.</p>
              <Button className="w-full mt-2" onClick={() => window.location.href = '/'}>
                Go to Sign In
              </Button>
            </div>
          ) : !validSession ? (
            <div className="text-center space-y-3 py-2">
              <ShieldCheck className="h-8 w-8 text-destructive mx-auto" />
              <h2 className="text-lg font-bold">Invalid or Expired Link</h2>
              <p className="text-xs text-muted-foreground">This password reset link is no longer valid. Please request a new one.</p>
              <Button variant="outline" className="w-full mt-2" onClick={() => window.location.href = '/'}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <KeyRound className="h-8 w-8 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold">Set New Password</h2>
                <p className="text-xs text-muted-foreground mt-1">Choose a strong password for your account</p>
              </div>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">New Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoFocus
                    className="mt-1 bg-secondary border-border h-9"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="mt-1 bg-secondary border-border h-9"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <KeyRound className="h-4 w-4" />
                  {loading ? 'Updating…' : 'Update Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
