import { useNavigate } from 'react-router-dom';

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
    title: '1. Acceptance of Terms',
    body: `By accessing or using EdgeFlow ("the Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms in full, you must not use the Service.\n\nThese Terms constitute a legally binding agreement between you ("User") and EdgeFlow ("we", "us", "our"). By creating an account, you confirm that you are at least 18 years of age and have the legal capacity to enter into this agreement.`,
  },
  {
    title: '2. Description of Service',
    body: `EdgeFlow is a trading journal and analytics platform that enables traders to log trades, analyse performance data, identify patterns, and interact with an AI-powered analyst ("Atlas").\n\nThe Service is a data journaling and analytics tool only. EdgeFlow does not operate as a broker, exchange, financial institution, or regulated investment service. We do not execute trades, hold funds, or manage assets on your behalf.`,
  },
  {
    title: '3. No Financial Advice — Important Disclaimer',
    body: `NOTHING WITHIN EDGEFLOW — INCLUDING ATLAS AI RESPONSES, ANALYTICS, LEAK DETECTION OUTPUT, PERFORMANCE REPORTS, OR ANY OTHER FEATURE — CONSTITUTES FINANCIAL ADVICE, INVESTMENT ADVICE, TRADING SIGNALS, OR A RECOMMENDATION TO BUY OR SELL ANY FINANCIAL INSTRUMENT.\n\nAll analysis provided by EdgeFlow is based solely on historical trade data you have entered. Historical performance does not guarantee future results. Trading financial instruments carries significant risk of loss, including the potential loss of all capital invested.\n\nYou are solely and entirely responsible for all trading decisions you make. EdgeFlow accepts no responsibility for any trading losses, financial losses, or other consequences arising from your use of the Service or any reliance placed on its outputs.`,
  },
  {
    title: '4. Account Responsibilities',
    body: `You are responsible for:\n\n• Maintaining the confidentiality of your login credentials\n• All activity that occurs under your account\n• Ensuring the accuracy of information you enter into the Service\n• Complying with these Terms at all times\n\nYou must not share your account with any other person. You must notify us immediately at support@leone.capital if you suspect unauthorised access to your account. We will not be liable for any loss or damage arising from your failure to protect your credentials.`,
  },
  {
    title: '5. Acceptable Use',
    body: `You agree not to:\n\n• Use the Service for any unlawful purpose or in violation of any applicable laws or regulations\n• Attempt to gain unauthorised access to any part of the Service, its servers, or any connected systems\n• Upload, transmit, or introduce any malicious code, viruses, or harmful components\n• Reverse engineer, decompile, or attempt to extract the source code of the Service\n• Resell, sublicence, or redistribute access to the Service without express written authorisation\n• Use the Service in a manner that could damage, disable, or impair the Service or interfere with other users\n• Circumvent any access controls, rate limits, or security features of the Service\n• Use automated scripts or bots to interact with the Service\n\nViolation of these provisions may result in immediate account termination and, where applicable, legal action.`,
  },
  {
    title: '6. Subscription, Billing, and Refunds',
    body: `Free Plan: Access to limited features as described on the pricing page at the time of sign-up. Feature limits may change with reasonable notice.\n\nPaid Plans (Pro and Elite): Subscriptions are billed in advance on a monthly or annual basis. Prices are displayed in USD. All payments are processed by our third-party payment provider.\n\nAutomatic Renewal: Subscriptions renew automatically at the end of each billing period. You may cancel at any time through your account settings or by contacting support@leone.capital.\n\nCancellation: Monthly subscriptions cancelled before the renewal date will not be charged for the next period. Access continues until the end of the current paid period. No partial refunds are issued for unused time on monthly plans.\n\nRefunds: Annual subscriptions are eligible for a full refund within 14 days of purchase if you have logged fewer than 10 trades. After 14 days, no refunds are issued on annual subscriptions. We reserve the right to issue discretionary refunds in exceptional circumstances.\n\nPrice Changes: We reserve the right to modify pricing. Existing subscribers will receive at least 30 days' notice before any price increase takes effect.`,
  },
  {
    title: '7. Intellectual Property',
    body: `EdgeFlow, its software, design, branding, features, and original content are owned by EdgeFlow and are protected under applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from any part of the Service without express written permission.\n\nYour Data: All trade data, notes, and content you enter into EdgeFlow remains your property. By using the Service, you grant EdgeFlow a limited, non-exclusive, royalty-free licence to store and process your data solely for the purpose of providing the Service to you. This licence terminates when your account is deleted.\n\nWe do not claim ownership over any data you submit.`,
  },
  {
    title: '8. Disclaimer of Warranties',
    body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.\n\nWE EXPRESSLY DISCLAIM ALL WARRANTIES INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.\n\nWe do not warrant that:\n\n• The Service will be uninterrupted, error-free, or secure at all times\n• Any errors in the Service will be corrected\n• The Service will meet your specific requirements\n• Results obtained from the Service will be accurate or reliable\n\nYou use the Service entirely at your own risk.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EDGEFLOW AND ITS DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR:\n\n• Any indirect, incidental, special, consequential, or punitive damages\n• Loss of profits, revenue, data, business, or goodwill\n• Trading losses or financial losses of any kind, howsoever arising\n• Damages arising from your reliance on any output or analysis from the Service\n• Any interruption, suspension, or termination of the Service\n\nIn all cases, EdgeFlow's total aggregate liability to you shall not exceed the total amount you paid to EdgeFlow in the 12 months immediately preceding the event giving rise to the claim, or USD $50, whichever is greater.\n\nSome jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such jurisdictions, our liability is limited to the maximum extent permitted by law.`,
  },
  {
    title: '10. Indemnification',
    body: `You agree to indemnify, defend, and hold harmless EdgeFlow and its directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with:\n\n• Your use of the Service\n• Your violation of these Terms\n• Your violation of any applicable law or regulation\n• Any trading decisions made based on outputs from the Service\n• Any content or data you submit to the Service`,
  },
  {
    title: '11. Service Modifications and Availability',
    body: `We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We will make reasonable efforts to provide advance notice of material changes to paid subscribers.\n\nWe do not guarantee continuous, uninterrupted availability of the Service. Scheduled maintenance, emergency fixes, or factors beyond our control may result in downtime. We shall not be liable for any loss resulting from unavailability of the Service.`,
  },
  {
    title: '12. Termination',
    body: `We may suspend or terminate your account immediately and without notice if:\n\n• You breach any provision of these Terms\n• We are required to do so by law\n• We reasonably believe your account is being used fraudulently or to harm other users\n\nYou may delete your account at any time from the Settings page. Upon termination by either party, your trade data will be permanently deleted within 30 days. Provisions that by their nature should survive termination (including Sections 3, 8, 9, and 10) shall survive.`,
  },
  {
    title: '13. Force Majeure',
    body: `EdgeFlow shall not be held liable for any failure or delay in performance of its obligations under these Terms where such failure or delay results from circumstances beyond our reasonable control, including but not limited to: acts of God, natural disasters, war, civil unrest, government action, power failures, internet service disruptions, or third-party service outages.`,
  },
  {
    title: '14. Governing Law and Dispute Resolution',
    body: `These Terms shall be governed by and construed in accordance with applicable law. In the event of any dispute arising from or in connection with these Terms or the Service, the parties agree to first attempt to resolve the dispute through good-faith negotiation.\n\nIf a dispute cannot be resolved through negotiation within 30 days, either party may pursue resolution through the appropriate courts or binding arbitration under applicable rules. You agree to submit to the personal jurisdiction of such proceedings.\n\nYou waive any right to bring claims as a plaintiff or class member in any purported class action, collective action, or representative proceeding.`,
  },
  {
    title: '15. Severability',
    body: `If any provision of these Terms is found to be unenforceable or invalid under applicable law, that provision shall be modified to the minimum extent necessary to make it enforceable, or severed from these Terms if modification is not possible. The remaining provisions shall continue in full force and effect.`,
  },
  {
    title: '16. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. We will provide notice of material changes by email to your registered address or via an in-app notification at least 14 days before the changes take effect.\n\nYour continued use of the Service after the effective date of any changes constitutes your acceptance of the updated Terms. If you do not agree to the revised Terms, you must stop using the Service.`,
  },
  {
    title: '17. Contact',
    body: `For questions, concerns, or legal notices regarding these Terms, contact us at:\n\nsupport@leone.capital\n\nWe aim to respond to all enquiries within 5 business days.`,
  },
];

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
