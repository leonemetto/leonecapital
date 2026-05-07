import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/logo.svg';

const CB_STARS = Array.from({ length: 120 }, (_, i) => {
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

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#000', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflow: 'hidden',
    }}>
      <style>{`@keyframes cbStarFlicker{0%{opacity:var(--star-op,0.2)}8%{opacity:calc(var(--star-op,0.2)*0.45)}12%{opacity:var(--star-op,0.2)}50%{opacity:var(--star-op,0.2)}57%{opacity:calc(var(--star-op,0.2)*0.55)}62%{opacity:var(--star-op,0.2)}100%{opacity:var(--star-op,0.2)}}`}</style>
      {/* Stars */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {CB_STARS.map((s, i) => (
          <span key={i} style={{
            position: 'absolute', borderRadius: '50%',
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.r * 2}px`, height: `${s.r * 2}px`,
            background: s.blue ? 'rgba(200,220,255,0.95)' : '#fff',
            boxShadow: '0 0 2px 1px rgba(255,255,255,0.14)',
            ['--star-op' as string]: s.op,
            animationName: 'cbStarFlicker',
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          } as React.CSSProperties} />
        ))}
      </div>
      {/* Bottom wordmark */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        overflow: 'hidden', zIndex: 0, pointerEvents: 'none', isolation: 'isolate',
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%,-50%)',
          width: '80%', height: '80%',
          background: 'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(30,211,134,0.30) 0%, rgba(30,211,134,0.14) 30%, transparent 65%)',
          filter: 'blur(50px)', zIndex: 0,
        }} />
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
      {/* Content */}
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Handles Supabase auth redirect callbacks for:
 *  - Google OAuth / other providers (PKCE ?code=xxx)
 *  - Email confirmation  (?token_hash=xxx&type=email)
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

      if (errorCode) {
        setError(errorDesc ?? errorCode);
        return;
      }

      try {
        if (code) {
          // PKCE flow — used by Google OAuth and modern email links
          // Do NOT sign out before this: signOut clears the PKCE code_verifier
          // from localStorage, which causes exchangeCodeForSession to fail.
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
        } else {
          // Implicit flow: Supabase auto-exchanges hash fragments on page load.
          // Give the client a moment to finish, then check.
          await new Promise(r => setTimeout(r, 300));
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setError('No authentication token found. The link may have expired.');
            return;
          }
        }

        if (type === 'recovery') {
          navigate('/reset-password', { replace: true });
          return;
        }

        const rawNext = params.get('next') ?? '/dashboard';
        const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';
        navigate(next, { replace: true });
      } catch (err: any) {
        setError(err.message ?? 'Authentication failed. Please try again.');
      }
    };

    handle();
  }, [navigate]);

  if (error) {
    return (
      <AuthLayout>
        <div style={{
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 24px 48px rgba(0,0,0,0.8)',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img src={logoImg} alt="EdgeFlow" style={{ width: 44, height: 44, borderRadius: 12 }} />
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>EdgeFlow</span>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Link Invalid or Expired
            </p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>{error}</p>
          </div>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            style={{
              width: '100%', padding: '12px 20px', borderRadius: 24,
              fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
              background: '#fff', color: '#000', border: 'none', cursor: 'pointer',
            }}
          >
            Back to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <img src={logoImg} alt="EdgeFlow" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>EdgeFlow</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Signing you in…</p>
      </div>
    </AuthLayout>
  );
}
