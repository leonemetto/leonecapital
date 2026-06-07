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
    title: '1. Pro Trial',
    body: `EdgeFlow offers a 14-day no-card Pro trial after onboarding so you can evaluate the platform before paying. During the trial, there is no charge and therefore no refund is applicable.\n\nWhen the trial ends, you can still sign in and view existing data. A paid Pro subscription is required to continue logging trades, importing trade history, using Atlas, and accessing advanced analysis.`,
  },
  {
    title: '2. Monthly Subscriptions — 7-Day No-Questions Refund',
    body: `Your first paid monthly Pro subscription is eligible for a full refund within 7 calendar days of the initial charge, no questions asked.\n\nThis applies once per user, lifetime. Subsequent monthly renewals are not eligible for the no-questions window.\n\nTo request a refund within the 7-day window, email support@edgeflow.capital from the address on your EdgeFlow account. Refunds are processed within 5 business days through the original payment method.`,
  },
  {
    title: '3. Monthly Subscriptions — Renewals',
    body: `You are responsible for cancelling your subscription before the renewal date. EdgeFlow is not responsible for charges resulting from a failure to cancel on time. Self-serve cancellation is available 24/7 from Settings → Subscription.\n\nMonthly subscriptions auto-renew at the end of each billing period. Renewal charges are not eligible for refund.\n\nCancellations take effect at the end of the current paid period — your access continues until that date, and you are not charged again.\n\nIf you forget to cancel and are charged for a renewal you did not intend, you may contact support@edgeflow.capital within 72 hours of the renewal charge. We will review the request on a case-by-case basis (see Section 5), but we are under no obligation to refund renewals.`,
  },
  {
    title: '4. Annual Subscriptions',
    body: `Annual subscriptions are eligible for a full refund within 14 calendar days of purchase, provided you have logged fewer than 10 trades during that period.\n\nAfter 14 days, or once 10 trades have been logged, annual subscriptions are not eligible for refund. We strongly recommend trying the monthly plan first before committing to annual.`,
  },
  {
    title: '5. Discretionary Refunds',
    body: `Outside the windows above, refunds are at our sole discretion. We typically honour refund requests in the following situations:\n\n• Extended technical outage of EdgeFlow lasting more than 24 hours that prevented you from using the Service\n• Accidental double-charge for the same billing period\n• Currency conversion errors caused by our payment provider\n• Documented evidence that a feature you were charged for was unavailable for the majority of your billing period\n\nWe do not typically issue refunds for:\n\n• Change of mind after the no-questions window has closed\n• Dissatisfaction with analytics output or Atlas AI responses\n• Trading losses or any financial outcome related to your trading activity\n• Inability to use the Service due to lack of trading data on your end\n• Failure to cancel before a renewal date when self-serve cancel was available`,
  },
  {
    title: '6. How to Request a Refund',
    body: `Email support@edgeflow.capital from the email address registered to your EdgeFlow account. Include:\n\n• The amount and date of the charge you are disputing\n• Your reason for the request\n• Any supporting evidence (screenshots, error logs)\n\nWe aim to acknowledge all refund requests within 2 business days and resolve them within 5 business days.\n\nIf approved, refunds are returned to the original payment method. Card refunds typically take 3–10 business days to appear on your statement, depending on your bank. M-Pesa refunds typically appear within 24 hours.`,
  },
  {
    title: '7. Chargebacks — Please Contact Us First',
    body: `If you are unhappy with a charge, please email support@edgeflow.capital before initiating a chargeback through your bank or card issuer.\n\nWe will respond within 2 business days and resolve eligible requests faster than your bank's chargeback process. Chargebacks initiated without prior contact may result in suspension of your EdgeFlow account, in addition to any chargeback fees the payment processor charges back to us.\n\nIf you have a legitimate billing concern, talking to us is faster and gets your money back sooner than your bank.`,
  },
  {
    title: '8. Cancellation vs. Refund',
    body: `Cancellation stops future renewals — it does not refund the current period.\n\nIf you cancel a monthly subscription on day 15 of the month, you keep access until day 30 and are not billed again on day 31. You are not refunded for days 15–30 unless the refund qualifies under Sections 2, 4, or 5 above.\n\nYou can cancel any subscription at any time from Settings → Subscription. Cancellation is immediate and self-serve; no email is required.`,
  },
  {
    title: '9. Account Deletion and Data',
    body: `Cancelling your subscription removes paid Pro access after the current billing period but does not delete your trade data.\n\nIf you want all your data permanently deleted, request account deletion from Settings → Profile, or email support@edgeflow.capital. Deletion is irreversible and your data cannot be recovered afterwards. See our Privacy Policy for full details on data retention.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Refund Policy from time to time. The version in effect at the time of your purchase governs that purchase.\n\nMaterial changes will be announced by email to active subscribers at least 14 days before they take effect.\n\nLast updated: 28 May 2026.`,
  },
  {
    title: '11. Contact',
    body: `All refund requests, billing disputes, and questions about this policy:\n\nsupport@edgeflow.capital\n\nResponse time: within 2 business days for refund requests, 5 business days for general enquiries.`,
  },
];

export default function Refunds() {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh' }}>
      <Helmet>
        <title>Refund Policy — EdgeFlow</title>
        <meta name="description" content="EdgeFlow refund policy. 7-day no-questions refund on first monthly subscription, 14-day refund window on annual plans." />
        <link rel="canonical" href="https://www.edgeflow.capital/refunds" />
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
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 16 }}>Refund Policy</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 64 }}>Last updated: 28 May 2026</p>

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
