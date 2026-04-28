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

export default function Terms() {
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
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 16 }}>Terms & Conditions</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 64 }}>Last updated: January 2025</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By creating an account and using EdgeFlow, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the service.\n\nThese terms apply to all users of EdgeFlow, whether on the Free or Pro plan.`,
          },
          {
            title: '2. Description of Service',
            body: `EdgeFlow is a trading journal and analytics platform that helps traders track, analyse, and improve their trading performance. Features include trade logging, AI-powered analysis, leak detection, and performance analytics.\n\nEdgeFlow is a journaling and analysis tool only. It does not provide financial advice, investment recommendations, or signals. Use of EdgeFlow does not guarantee trading profitability.`,
          },
          {
            title: '3. Not Financial Advice',
            body: `EdgeFlow provides data analysis and pattern detection based on your historical trade data. Nothing in EdgeFlow — including AI Advisor responses — constitutes financial advice, investment advice, or a recommendation to buy or sell any asset.\n\nYou are solely responsible for your trading decisions. Past performance identified by EdgeFlow does not guarantee future results. Trading carries significant risk.`,
          },
          {
            title: '4. Account Responsibilities',
            body: `You are responsible for maintaining the security of your account credentials. You must not share your account with others. You are responsible for all activity that occurs under your account.\n\nYou must provide accurate information when creating your account. You must be at least 18 years old to use EdgeFlow.`,
          },
          {
            title: '5. Acceptable Use',
            body: `You may not use EdgeFlow to:\n\n• Attempt to gain unauthorised access to any part of the service\n• Upload malicious code or attempt to compromise system integrity\n• Use the AI Advisor to generate content that violates laws or regulations\n• Resell or redistribute access to EdgeFlow without authorisation`,
          },
          {
            title: '6. Subscription and Billing',
            body: `Free plan users have access to limited features as described on the pricing page. Pro plan users are billed monthly or yearly as selected.\n\nSubscriptions renew automatically. You may cancel at any time. Monthly subscriptions cancel at the end of the current billing period. Yearly subscriptions are eligible for a prorated refund within the first 30 days.`,
          },
          {
            title: '7. Intellectual Property',
            body: `EdgeFlow and its original content, features, and functionality are owned by EdgeFlow and are protected by intellectual property laws. Your trade data remains yours.\n\nBy using EdgeFlow, you grant us a limited, non-exclusive licence to process your trade data for the purpose of providing the service.`,
          },
          {
            title: '8. Limitation of Liability',
            body: `To the maximum extent permitted by law, EdgeFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, arising from your use of the service.\n\nEdgeFlow's total liability to you for any claims arising from these terms shall not exceed the amount you paid to EdgeFlow in the 12 months preceding the claim.`,
          },
          {
            title: '9. Termination',
            body: `We may terminate or suspend your account at any time for violation of these terms, with or without notice. You may delete your account at any time from Settings. Upon termination, your data will be permanently deleted within 30 days.`,
          },
          {
            title: '10. Changes to Terms',
            body: `We reserve the right to modify these terms at any time. We will provide notice of material changes via email or in-app notification. Continued use of EdgeFlow after changes constitutes acceptance of the new terms.`,
          },
          {
            title: '11. Governing Law',
            body: `These terms are governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration or in a court of competent jurisdiction.`,
          },
          {
            title: '12. Contact',
            body: `For questions about these Terms, contact us at:\n\nsupport@leone.capital`,
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
