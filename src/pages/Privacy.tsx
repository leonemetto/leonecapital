import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const G = 'rgb(140,255,46)';

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

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `EdgeFlow ("we", "us", "our") operates the trading journal and analytics platform available at leone.capital. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our Service.\n\nBy creating an account or using EdgeFlow, you acknowledge that you have read and understood this Privacy Policy.`,
  },
  {
    title: '2. Information We Collect',
    body: `Account Information: When you register, we collect your email address, and optionally a display name (nickname) and profile picture.\n\nTrade Data: All trade records you enter manually or import via CSV — including instruments, direction, P&L, strategy, session, emotional state, notes, and screenshots.\n\nTrader Profile: Trading style, preferred instruments, sessions, rules, goals, and behavioural patterns you provide or that are inferred by the AI.\n\nUsage Data: We automatically collect your IP address, browser type, device type, pages visited, and session duration for security and service improvement purposes.\n\nCommunication Data: If you contact us by email, we retain that correspondence.`,
  },
  {
    title: '3. How We Use Your Information',
    body: `We use your data for the following purposes:\n\n• To provide and operate the EdgeFlow platform and all its features\n• To power Atlas — your trade data is sent to our AI service to generate personalised analysis\n• To send transactional emails (account confirmation, password reset)\n• To send performance digest emails and re-engagement emails (you may opt out at any time)\n• To monitor for security incidents, fraud, and abuse\n• To comply with applicable legal obligations\n• To improve the Service based on aggregated, anonymised usage patterns\n\nWe do not use your personal trading data for advertising, profiling for third-party purposes, or AI model training.`,
  },
  {
    title: '4. Legal Basis for Processing (GDPR)',
    body: `If you are located in the European Economic Area (EEA) or United Kingdom, we process your personal data under the following legal bases:\n\n• Contract performance: Processing necessary to provide the Service you have signed up for\n• Legitimate interests: Security monitoring, fraud prevention, and service improvement\n• Consent: Marketing emails (you may withdraw consent at any time)\n• Legal obligation: Where processing is required to comply with applicable law\n\nYou have the right to object to processing based on legitimate interests by contacting us at support@leone.capital.`,
  },
  {
    title: '5. Sub-Processors and Third-Party Services',
    body: `To deliver the Service, we share data with the following trusted sub-processors. Each is contractually bound to process data only as instructed and to maintain appropriate security standards:\n\n• Supabase (supabase.com) — Database, authentication, and file storage. Your trade data is stored on Supabase infrastructure with row-level security. Data is hosted on AWS infrastructure.\n\n• Anthropic (anthropic.com) — Powers the Atlas AI analyst. Your most recent trade data and trader profile are sent to Anthropic's Claude API when you use Atlas. Anthropic does not use your data to train its models under standard API terms.\n\n• Resend (resend.com) — Email delivery for account notifications, re-engagement emails, and weekly digest emails. Your email address is shared with Resend for this purpose.\n\n• Sentry (sentry.io) — Error monitoring in production. Sentry may receive anonymised error reports including browser and device information. We strip personally identifiable information before errors are reported.\n\n• Vercel (vercel.com) — Hosting and content delivery for the frontend application. Vercel processes request logs including IP addresses.\n\nWe do not sell your data to any third party. We do not share your trade data with advertisers or data brokers.`,
  },
  {
    title: '6. Data Security',
    body: `We implement the following security measures to protect your data:\n\n• Row-level security (RLS) on all database tables — every query is scoped to your user ID, preventing any cross-account data access\n• JWT authentication required for all API and edge function requests\n• Per-user rate limiting on all AI endpoints\n• HTTPS encryption for all data in transit\n• Data encrypted at rest on Supabase (SOC 2 compliant infrastructure)\n• No raw stack traces or internal error details are exposed to clients\n\nDespite these measures, no system is completely secure. In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify you without undue delay and in accordance with applicable law.`,
  },
  {
    title: '7. AI and Atlas — How Your Data Is Used',
    body: `When you send a message to Atlas, the following data is transmitted to Anthropic's Claude API:\n\n• Your most recent 50 trade records (all fields)\n• Aggregated performance statistics (win rate, P&L, profit factor, session breakdowns)\n• Your trader profile (style, instruments, rules, and behavioural memory)\n• Your pre-trade criteria definitions\n\nThis data is sent over HTTPS and is used solely to generate your response. Anthropic does not use API inputs to train Claude models under their standard API usage policy.\n\nBehavioural insights extracted from Atlas conversations are stored in your trader profile within our database and used to provide continuity across future Atlas sessions. You can view these insights in your Settings page.`,
  },
  {
    title: '8. Data Retention',
    body: `We retain your account data and trade records for as long as your account remains active.\n\nIf you delete your account, all personal data and trade records associated with your account will be permanently and irreversibly deleted within 30 days of the deletion request.\n\nYou may delete demo data at any time from the Settings page. Anonymised, aggregated statistical data that cannot be linked back to you may be retained indefinitely for service improvement purposes.`,
  },
  {
    title: '9. Your Rights',
    body: `Depending on your location, you may have the following rights regarding your personal data:\n\n• Access: Request a copy of the personal data we hold about you\n• Correction: Request correction of inaccurate or incomplete data\n• Deletion: Request permanent deletion of your data ("right to be forgotten")\n• Portability: Export your trade data as CSV at any time from the Trades DB page\n• Restriction: Request that we restrict processing of your data in certain circumstances\n• Objection: Object to processing based on legitimate interests\n• Withdrawal of consent: Unsubscribe from marketing emails at any time via the link in any email\n\nTo exercise any of these rights, contact us at support@leone.capital. We will respond within 30 days. We may need to verify your identity before processing certain requests.`,
  },
  {
    title: '10. Children\'s Privacy',
    body: `EdgeFlow is not directed at or intended for use by individuals under the age of 18. We do not knowingly collect personal data from anyone under 18. If you believe we have inadvertently collected data from a minor, please contact us at support@leone.capital and we will delete it promptly.`,
  },
  {
    title: '11. Cookies',
    body: `We use only essential session cookies required to maintain your authenticated login state. These cookies are strictly necessary for the Service to function.\n\nWe do not use:\n• Advertising or tracking cookies\n• Third-party analytics cookies\n• Social media tracking pixels\n\nYou may disable cookies in your browser, but this will prevent you from remaining logged in to EdgeFlow.`,
  },
  {
    title: '12. International Data Transfers',
    body: `EdgeFlow is operated globally. Your data may be processed in countries outside your country of residence, including the United States, where our sub-processors (Supabase, Anthropic, Resend, Vercel) operate their infrastructure.\n\nWhere data is transferred outside the EEA or UK, we ensure appropriate safeguards are in place, including reliance on Standard Contractual Clauses or the adequacy decisions of the relevant supervisory authority.`,
  },
  {
    title: '13. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will notify you of material changes by email to your registered address or via an in-app notice at least 14 days before the changes take effect.\n\nThe "Last updated" date at the top of this page always reflects the most recent revision. We encourage you to review this policy periodically.`,
  },
  {
    title: '14. Contact and Complaints',
    body: `If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us at:\n\nsupport@leone.capital\n\nWe aim to respond to all privacy enquiries within 5 business days.\n\nIf you are located in the EEA or UK and are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.`,
  },
];

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh' }}>
      <Helmet>
        <title>Privacy Policy — EdgeFlow</title>
        <meta name="description" content="EdgeFlow privacy policy. How we collect, use, and protect your trading data." />
        <link rel="canonical" href="https://www.edgeflow.capital/privacy" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
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
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 64 }}>Last updated: April 2026</p>

        {SECTIONS.map(({ title, body }) => (
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
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>© 2026 EdgeFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
