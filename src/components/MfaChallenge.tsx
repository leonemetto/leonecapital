import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MfaChallengeProps {
  factorId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function MfaChallenge({ factorId, onVerified, onCancel }: MfaChallengeProps) {
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (totpCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: totpCode,
      });
      if (verifyError) throw verifyError;

      toast.success('2FA verified!');
      onVerified();
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
              onKeyDown={e => { if (e.key === 'Enter' && totpCode.length === 6) handleVerify(); }}
            />
          </div>

          <Button className="w-full gap-2" onClick={handleVerify} disabled={verifying || totpCode.length !== 6}>
            <ShieldCheck className="h-4 w-4" />
            {verifying ? 'Verifying...' : 'Verify'}
          </Button>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:underline w-full text-center"
          >
            Cancel and sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
