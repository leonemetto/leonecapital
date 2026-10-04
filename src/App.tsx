import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOnboarding } from "@/hooks/useOnboarding";
import { MfaChallenge } from "@/components/MfaChallenge";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useState, useEffect, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { supabase } from "@/integrations/supabase/client";
import { TradesProvider } from "@/contexts/TradesContext";
import { AccountsProvider } from "@/contexts/AccountsContext";
import { LeaksProvider } from "@/contexts/LeaksContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { useSharedSubscription } from "@/contexts/SubscriptionContext";
import { ShellProvider, useShell } from "@/components/shell/ShellContext";
import { AppShell } from "@/components/shell/AppShell";
import { AtlasProvider } from "@/components/atlas/AtlasProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { CARD_REQUIRED, TRIAL_DAYS } from "@/config/billing";
import * as Sentry from '@sentry/react';
import NotFound from "./pages/NotFound";

const Today = lazy(() => import("./pages/Today"));
const Trades = lazy(() => import("./pages/Trades"));
const Insights = lazy(() => import("./pages/Insights"));
const Plan = lazy(() => import("./pages/Plan"));
const Accounts = lazy(() => import("./pages/Accounts"));
const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Guide = lazy(() => import("./pages/Guide"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Landing = lazy(() => import("./pages/Landing"));
const HowToUse = lazy(() => import("./pages/HowToUse"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Refunds = lazy(() => import("./pages/Refunds"));
const BillingReturn = lazy(() => import("./pages/BillingReturn"));
const ImportTrades = lazy(() => import("./pages/ImportTrades"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChecked, setMfaChecked] = useState(false);

  useEffect(() => {
    const checkMfa = async () => {
      if (!session) {
        setMfaRequired(false);
        setMfaChecked(true);
        return;
      }
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const verifiedFactors = data?.totp?.filter((f: any) => f.status === 'verified') || [];
        let aal = 'aal1';
        try {
          aal = JSON.parse(atob(session.access_token.split('.')[1]))?.aal || 'aal1';
        } catch {
          // Malformed token — treat as aal1 so MFA is required if factors exist
        }
        if (verifiedFactors.length > 0 && aal === 'aal1') {
          setMfaFactorId(verifiedFactors[0].id);
          setMfaRequired(true);
        } else {
          setMfaRequired(false);
        }
      } catch {
        setMfaRequired(false);
      } finally {
        setMfaChecked(true);
      }
    };
    checkMfa();
  }, [session]);

  if (loading || (user && !mfaChecked)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (mfaRequired && mfaFactorId) {
    return (
      <MfaChallenge
        factorId={mfaFactorId}
        onVerified={() => {
          setMfaRequired(false);
          setMfaFactorId(null);
          supabase.auth.refreshSession();
        }}
        onCancel={() => {
          supabase.auth.signOut();
          setMfaRequired(false);
          setMfaFactorId(null);
        }}
      />
    );
  }

  return <>{children}</>;
}

function PagePrefetcher() {
  useEffect(() => {
    const t = setTimeout(() => {
      import('./pages/Trades');
      import('./pages/Insights');
      import('./pages/Plan');
      import('./pages/AIAdvisor');
      import('./pages/Accounts');
      import('./pages/ProfileSettings');
      import('./pages/ImportTrades');
      import('./pages/Today');
    }, 2000);
    return () => clearTimeout(t);
  }, []);
  return null;
}

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { isLoading, profile } = useProfile();
  const { onboardingCompleted, completeOnboarding } = useOnboarding();

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return (
      <OnboardingFlow
        onComplete={completeOnboarding}
      />
    );
  }

  return <><PagePrefetcher />{children}</>;
}

function PremiumRoute({ children }: { children: React.ReactNode }) {
  const { hasProAccess, hasSubscription, isLoading } = useSharedSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (isLoading) {
    return <PageFallback />;
  }

  if (!hasProAccess) {
    // Two states: a user who never had a subscription (card-required: needs to
    // START a trial by adding a card) vs. one whose trial/subscription lapsed
    // (needs to upgrade — no second free trial). Both open the same checkout.
    const neverSubscribed = CARD_REQUIRED && !hasSubscription;
    return (
      <AppLayout width="narrow">
        <div className="ef-surface mx-auto mt-6 flex max-w-xl flex-col items-start overflow-hidden px-6 pb-8 pt-2 sm:px-8">
          <img src="/art/flow-field.webp" alt="" className="ef-art -mx-6 mb-4 w-[calc(100%+3rem)] max-w-none sm:-mx-8 sm:w-[calc(100%+4rem)]" />
          <p className="ef-label m-0">{neverSubscribed ? `${TRIAL_DAYS}-day Pro trial` : 'Pro trial ended'}</p>
          <h1 className="m-0 mt-3 text-[22px] font-medium tracking-[-0.02em] text-ef-ink">
            {neverSubscribed ? `Try EdgeFlow Pro free for ${TRIAL_DAYS} days` : 'Your Pro trial ended'}
          </h1>
          <p className="m-0 mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-ef-ink-3">
            {neverSubscribed ? (
              <>Add a card to unlock trade logging, imports, Atlas and advanced analysis.
              You won't be charged today: $0 for {TRIAL_DAYS} days, then $19 a month. Cancel any time before it renews.</>
            ) : (
              <>Your data is safe. Upgrade to continue logging trades, importing history,
              using Atlas and running advanced analysis.</>
            )}
          </p>
          <button type="button" onClick={() => setUpgradeOpen(true)} className="ef-btn ef-btn-primary mt-5 h-9 px-4">
            {neverSubscribed ? 'Start free trial' : 'Upgrade to Pro'}
          </button>
        </div>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </AppLayout>
    );
  }

  return <>{children}</>;
}

const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));


// Dev-only: `?preview` renders the signed-in app with sample data and no
// account, for visual checks. The branch and its import are stripped from
// production builds because import.meta.env.DEV is false there.
const PreviewGate = import.meta.env.DEV ? lazy(() => import("./dev/PreviewGate")) : null;

function isPreview(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    if (new URLSearchParams(window.location.search).has("preview")) sessionStorage.setItem("ef-preview", "1");
    return sessionStorage.getItem("ef-preview") === "1";
  } catch {
    return false;
  }
}

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-7 md:px-6" aria-busy="true" aria-label="Loading page">
      <div className="h-6 w-40 animate-pulse rounded-chip bg-ef-sunken" />
      <div className="mt-6 h-40 animate-pulse rounded-surface bg-ef-sunken" />
      <div className="mt-3 h-64 animate-pulse rounded-surface bg-ef-sunken" />
    </div>
  );
}

// Old links to the standalone log page open the dialog over Today instead.
function AddTradeRedirect() {
  const { openLogTrade } = useShell();
  useEffect(() => { openLogTrade(); }, [openLogTrade]);
  return <Navigate to="/dashboard" replace />;
}

// The three analysis pages became tabs of Insights. Query strings carry over
// so existing deep links (and the guide's tour link) keep working.
function InsightsRedirect({ tab }: { tab?: string }) {
  const { search } = useLocation();
  return <Navigate to={`/insights${tab ? `/${tab}` : ''}${search}`} replace />;
}

function AuthedApp() {
  return (
    <SubscriptionProvider>
    <SettingsProvider>
    <AccountsProvider>
    <TradesProvider>
    <LeaksProvider>
    <ViewProvider>
    <ShellProvider>
    <AtlasProvider>
      <MotionConfig reducedMotion="always">
        <AppShell>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/dashboard" element={<PageErrorBoundary pageName="dashboard"><Today /></PageErrorBoundary>} />
              <Route path="/add-trade" element={<AddTradeRedirect />} />
              <Route path="/journal" element={<PageErrorBoundary pageName="journal"><Trades /></PageErrorBoundary>} />
              <Route path="/accounts" element={<PageErrorBoundary pageName="accounts"><Accounts /></PageErrorBoundary>} />
              <Route path="/ai" element={<PageErrorBoundary pageName="ai"><PremiumRoute><AIAdvisor /></PremiumRoute></PageErrorBoundary>} />
              <Route path="/insights" element={<PageErrorBoundary pageName="insights"><PremiumRoute><Insights /></PremiumRoute></PageErrorBoundary>} />
              <Route path="/insights/:tab" element={<PageErrorBoundary pageName="insights"><PremiumRoute><Insights /></PremiumRoute></PageErrorBoundary>} />
              <Route path="/analyst" element={<InsightsRedirect />} />
              <Route path="/leak-detection" element={<InsightsRedirect tab="leaks" />} />
              <Route path="/what-if" element={<InsightsRedirect tab="what-if" />} />
              <Route path="/profile" element={<PageErrorBoundary pageName="profile"><ProfileSettings /></PageErrorBoundary>} />
              <Route path="/import-trades" element={<PageErrorBoundary pageName="import-trades"><PremiumRoute><ImportTrades /></PremiumRoute></PageErrorBoundary>} />
              <Route path="/trading-plan" element={<PageErrorBoundary pageName="trading-plan"><PremiumRoute><Plan /></PremiumRoute></PageErrorBoundary>} />
              <Route path="/guide" element={<PageErrorBoundary pageName="guide"><Guide /></PageErrorBoundary>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppShell>
      </MotionConfig>
    </AtlasProvider>
    </ShellProvider>
    </ViewProvider>
    </LeaksProvider>
    </TradesProvider>
    </AccountsProvider>
    </SettingsProvider>
    </SubscriptionProvider>
  );
}

const App = () => (
  <Sentry.ErrorBoundary fallback={
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong.</p>
      <p style={{ fontSize: 13, color: '#888' }}>The error has been reported. Please refresh the page.</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '10px 24px', background: '#fff', color: '#000', borderRadius: 24, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>Refresh</button>
    </div>
  }>
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/billing/return" element={<BillingReturn />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={
              PreviewGate && isPreview()
                ? <PreviewGate><AuthedApp /></PreviewGate>
                : <AuthGate><ProfileGate><AuthedApp /></ProfileGate></AuthGate>
            } />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
  </Sentry.ErrorBoundary>
);

export default App;
