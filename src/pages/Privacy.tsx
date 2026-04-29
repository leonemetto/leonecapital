import { useNavigate } from 'react-router-dom';

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

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ color: G }}><EdgeFlowMark size={20}/></div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>EdgeFlow</span>
          </div>
          <button onClick={() => navigate('/')} style={{ padding: '9px 22px', borderRadius: 99, fontSize: 14, fontWeight: 600, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer' }}>
            ← Back to home
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '140px 40px 120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: G }}/>
          <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>Legal</span>
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 16 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 64 }}>Last updated: January 2025</p>

        {[
          {
            title: '1. Information We Collect',
            body: `We collect information you provide directly to us when you create an account, log trades, or contact us. This includes your email address, trading data you enter (instruments, P&L, notes, strategies), and profile information such as your nickname and trading style preferences.\n\nWe also collect usage data automatically, including your IP address, browser type, pages visited, and the time and date of your visit.`,
          },
          {
            title: '2. How We Use Your Information',
            body: `We use your information to provide, maintain, and improve EdgeFlow. Specifically, we use it to:\n\n• Provide your trading journal and analytics services\n• Power the Atlas with your trade data context\n• Send re-engagement and weekly digest emails (opt-out available)\n• Detect and prevent fraud or abuse\n• Comply with legal obligations`,
          },
          {
            title: '3. Data Security',
            body: `Your trade data is stored in Supabase with row-level security. Every database query is scoped to your user ID — no other user can access your trades, accounts, or profile. API calls to our AI edge functions require JWT authentication and are rate-limited per user.\n\nWe never share, sell, or rent your personal data or trading data to third parties.`,
          },
          {
            title: '4. AI and Data Processing',
            body: `When you use Atlas, your most recent trades and trader profile are sent to Claude (Anthropic) to generate responses. This data is transmitted securely over HTTPS. We do not use your trading data to train AI models.\n\nBehavioural insights extracted from AI conversations are stored in your trader profile and used only to improve future Atlas responses for your account.`,
          },
          {
            title: '5. Data Retention',
            body: `We retain your account and trade data for as long as your account is active. If you delete your account, your data is permanently deleted within 30 days. You can delete your demo data at any time from the Settings page.`,
          },
          {
            title: '6. Your Rights',
            body: `You have the right to access, correct, or delete your personal data at any time. You can export your trade data as CSV from the Trades DB page. To request full data deletion, email us at support@leone.capital.`,
          },
          {
            title: '7. Cookies',
            body: `We use essential cookies to maintain your login session. We do not use tracking cookies or advertising cookies. You can disable cookies in your browser settings, though this will prevent you from staying logged in.`,
          },
          {
            title: '8. Changes to This Policy',
            body: `We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on the app. Continued use of EdgeFlow after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: '9. Contact',
            body: `If you have questions about this Privacy Policy or how we handle your data, contact us at:\n\nsupport@leone.capital`,
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>{title}</h2>
            {body.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 14, whiteSpace: 'pre-line' }}>{para}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '40px 40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12, color: G }}>
          <EdgeFlowMark size={16}/>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>EdgeFlow</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>© 2025 EdgeFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
