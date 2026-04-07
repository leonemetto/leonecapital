import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DottedSurface } from '@/components/ui/dotted-surface';

/**
 * Handles Supabase auth redirect callbacks for:
 *  - Email confirmation  (?token_hash=xxx&type=email or ?code=xxx)
 *  - Magic link          (?token_hash=xxx&type=magiclink)
 *  - Invite              (?token_hash=xxx&type=invite)
 *
 * Password-reset links go to /reset-password, not here.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = async () => {
      const params = new URLSearchParams(window.location.search);
      const code       = params.get('code');
      const token_hash = params.get('token_hash');
      const type       = params.get('type');
      const errorCode  = params.get('error');
      const errorDesc  = params.get('error_description');

      // Supabase returned an error in the URL
      if (errorCode) {
        setError(errorDesc ?? errorCode);
        return;
      }

      try {
        if (code) {
          // PKCE flow — exchange the one-time code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && type) {
          // OTP / token-hash flow — verify the token
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
        } else {
          // Nothing in URL — check if supabase already exchanged a hash fragment
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setError('No authentication token found. The link may have expired.');
            return;
          }
        }

        // Password reset tokens go to the reset form, everything else to the dashboard
        if (type === 'recovery') {
          navigate('/reset-password', { replace: true });
          return;
        }

        const next = params.get('next') ?? '/dashboard';
        navigate(next, { replace: true });
      } catch (err: any) {
        setError(err.message ?? 'Authentication failed. Please try again.');
      }
    };

    handle();
  }, [navigate]);

  if (error) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
        <DottedSurface />
        <div className="w-full max-w-sm relative z-10 text-center space-y-4">
          <div className="flex items-center gap-3 justify-center mb-8">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">EDGEFLOW</h1>
          </div>
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-destructive">Link Invalid or Expired</h2>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button className="w-full" onClick={() => navigate('/auth', { replace: true })}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4">
      <DottedSurface />
      <div className="relative z-10 text-center space-y-3">
        <div className="flex items-center gap-3 justify-center">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight">EDGEFLOW</h1>
        </div>
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      </div>
    </div>
  );
}
