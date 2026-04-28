import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";

const G = '#adff2f';

function EdgeFlowMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <line x1="3" y1="3" x2="3" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="3" y1="3" x2="16" y2="3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="3" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="12" y1="10" x2="16" y2="6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <line x1="3" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
    </svg>
  );
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: 68, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: G }} onClick={() => navigate('/')}>
            <EdgeFlowMark size={20}/>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>EdgeFlow</span>
          </div>
        </div>
      </nav>

      {/* Center content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
        <div>
          <div style={{ fontSize: 'clamp(96px, 16vw, 180px)', fontWeight: 800, letterSpacing: '-6px', lineHeight: 1, color: 'rgba(255,255,255,0.06)', marginBottom: -20 }}>
            404
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
            Page not found
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 40px' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={{
              padding: '13px 30px', borderRadius: 99, fontSize: 15, fontWeight: 700,
              background: G, color: '#000', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none',
            }}>
              Back to home <ArrowUpRight size={15} weight="bold"/>
            </button>
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '13px 30px', borderRadius: 99, fontSize: 15, fontWeight: 600,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', cursor: 'pointer',
            }}>
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
