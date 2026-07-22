import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CARD_REQUIRED, TRIAL_DAYS } from '@/config/billing';

const G = 'rgb(140,255,46)';

// Trial clause is kept in sync with the live trial model (CARD_REQUIRED). When
// the card-on-file model is enabled, the trial requires a card up front and
// auto-converts — this must be disclosed here for it to be enforceable.
const TRIAL_CLAUSE = CARD_REQUIRED
  ? `Pro Trial: New users start a ${TRIAL_DAYS}-day Pro trial by entering valid payment card details at checkout. No charge is made during the trial period. Unless you cancel before the trial ends, your card will be charged the applicable Pro subscription fee (currently $19/month, or the selected annual rate) automatically at the end of the ${TRIAL_DAYS}-day trial, and your subscription will then continue under the Automatic Renewal terms below. You may cancel at any time during the trial through Settings → Subscription, or by contacting support@edgeflow.capital, to avoid being charged. If your trial or subscription ends without an active paid plan, you may continue to sign in and view existing data, but logging new trades, importing trades, using Atlas, and accessing advanced analysis require an active Pro subscription.`
  : `Pro Trial: New users receive a ${TRIAL_DAYS}-day no-card Pro trial after completing onboarding. During the trial, Pro features are available without charge. When the trial ends, you may continue to sign in and view existing data, but logging new trades, importing trades, using Atlas, and accessing advanced analysis require a paid Pro subscription.`;

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
    body: `NOTHING WITHIN EDGEFLOW — INCLUDING ATLAS AI RESPONSES, ANALYTICS, LEAK DETECTION OUTPUT, PERFORMANCE REPORTS, OR ANY OTHER FEATURE — CONSTITUTES FINANCIAL ADVICE, INVESTMENT ADVICE, TRADING SIGNALS, OR A RECOMMENDATION TO BUY OR SELL ANY FINANCIAL INSTRUMENT.\n\nEdgeFlow does not advocate, recommend, or endorse the purchase or sale of any specific financial instrument. Atlas AI responses, analytics, and reports are generated from your historical trade data and do not constitute recommendations to act.\n\nEdgeFlow's founders, employees, and contractors may trade financial instruments personally. We may or may not hold positions in any instrument mentioned in the Service. Personal trading by our team is unrelated to and does not influence the operation of the Service.\n\nAll analysis provided by EdgeFlow is based solely on historical trade data you have entered. Historical performance does not guarantee future results. Trading financial instruments carries significant risk of loss, including the potential loss of all capital invested.\n\nYou are solely and entirely responsible for all trading decisions you make. EdgeFlow accepts no responsibility for any trading losses, financial losses, or other consequences arising from your use of the Service or any reliance placed on its outputs.`,
  },
  {
    title: '4. Account Responsibilities',
    body: `You are responsible for:\n\n• Maintaining the confidentiality of your login credentials\n• All activity that occurs under your account\n• Ensuring the accuracy of information you enter into the Service\n• Complying with these Terms at all times\n\nYou must not share your account with any other person. You must notify us immediately at support@edgeflow.capital if you suspect unauthorised access to your account. We will not be liable for any loss or damage arising from your failure to protect your credentials.`,
  },
  {
    title: '5. Acceptable Use',
    body: `You agree not to:\n\n• Use the Service for any unlawful purpose or in violation of any applicable laws or regulations\n• Attempt to gain unauthorised access to any part of the Service, its servers, or any connected systems\n• Upload, transmit, or introduce any malicious code, viruses, or harmful components\n• Reverse engineer, decompile, or attempt to extract the source code of the Service\n• Resell, sublicence, or redistribute access to the Service without express written authorisation\n• Use EdgeFlow data, exports, or AI outputs to train, fine-tune, evaluate, or benchmark any machine learning model, including any competing AI system\n• Aggregate, resell, or redistribute trade data, analytics output, or Atlas responses obtained through the Service\n• Scrape, harvest, or programmatically extract data from the Service except through officially documented APIs\n• Use the Service in a manner that could damage, disable, or impair the Service or interfere with other users\n• Circumvent any access controls, rate limits, or security features of the Service\n• Use automated scripts or bots to interact with the Service\n\nViolation of these provisions may result in immediate account termination and, where applicable, legal action.`,
  },
  {
    title: '6. Subscription, Billing, and Refunds',
    body: `${TRIAL_CLAUSE}\n\nPaid Plan: Pro subscriptions are billed in advance on a monthly or annual basis. Prices are displayed and charged in USD. Your card issuer or payment provider may apply foreign exchange conversion, bank fees, or local taxes depending on your country and payment method. All payments are processed by our third-party payment providers, including Lemon Squeezy.\n\nAutomatic Renewal: Subscriptions renew automatically at the end of each billing period. You are responsible for cancelling your subscription before the renewal date if you do not wish to be charged. You may cancel at any time through Settings → Subscription, or by contacting support@edgeflow.capital.\n\nAll Payments Final: All payments to EdgeFlow are final and non-refundable except as expressly set out in our Refund Policy at /refunds. EdgeFlow is not responsible for charges resulting from a failure to cancel a subscription on time.\n\nRefunds: Refunds are governed by our Refund Policy at /refunds, which forms part of these Terms. In summary: the first monthly subscription is refundable within 7 days, no questions asked (once per user, lifetime). Annual subscriptions are refundable within 14 days of purchase if fewer than 10 trades have been logged. Discretionary refunds may be issued for technical outages, double-charges, or currency-conversion errors.\n\nChargebacks: Before initiating a chargeback through your bank or card issuer, you agree to contact support@edgeflow.capital first. We will respond within 2 business days and resolve eligible refund requests faster than any chargeback process. Chargebacks initiated without prior contact may result in immediate account suspension, in addition to any chargeback fees passed through from the payment processor.\n\nPrice Changes: We reserve the right to modify pricing. Existing subscribers will receive at least 30 days' notice before any price increase takes effect.`,
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
    body: `These Terms shall be governed by and construed in accordance with the laws of England and Wales. Both parties submit to the exclusive jurisdiction of the courts of England and Wales for resolution of any disputes arising from or in connection with these Terms or the Service.\n\nIn the event of any dispute, the parties agree to first attempt resolution through good-faith negotiation. If the dispute cannot be resolved through negotiation within 30 days, either party may pursue resolution through the courts of England and Wales.\n\nYou waive any right to bring claims as a plaintiff or class member in any purported class action, collective action, or representative proceeding.\n\nIf you are located outside England and Wales, local mandatory consumer protection laws may apply to your use of the Service and are not overridden by this clause.`,
  },
  {
    title: '15. International Use',
    body: `EdgeFlow is operated from Kenya. We make no representation that the Service is appropriate or available in all jurisdictions. Users accessing the Service from outside Kenya do so on their own initiative and are responsible for compliance with applicable local laws and regulations.\n\nWhere local mandatory consumer protection laws apply (including but not limited to the UK Consumer Rights Act 2015, the EU Consumer Rights Directive, and the Kenya Consumer Protection Act 2012), those laws govern to the extent they conflict with these Terms.`,
  },
  {
    title: '16. Severability',
    body: `If any provision of these Terms is found to be unenforceable or invalid under applicable law, that provision shall be modified to the minimum extent necessary to make it enforceable, or severed from these Terms if modification is not possible. The remaining provisions shall continue in full force and effect.`,
  },
  {
    title: '17. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. We will provide notice of material changes by email to your registered address or via an in-app notification at least 14 days before the changes take effect.\n\nYour continued use of the Service after the effective date of any changes constitutes your acceptance of the updated Terms. If you do not agree to the revised Terms, you must stop using the Service.`,
  },
  {
    title: '18. Contact',
    body: `For questions, concerns, or legal notices regarding these Terms, contact us at:\n\nsupport@edgeflow.capital\n\nWe aim to respond to all enquiries within 5 business days.`,
  },
];

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh' }}>
      <Helmet>
        <title>Terms of Service — EdgeFlow</title>
        <meta name="description" content="EdgeFlow terms of service. Rules and conditions for using the EdgeFlow trading journal platform." />
        <link rel="canonical" href="https://www.edgeflow.capital/terms" />
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
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.0, marginBottom: 16 }}>Terms & Conditions</h1>
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
