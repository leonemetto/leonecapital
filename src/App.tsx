import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCriteria } from "@/hooks/useCriteria";
import { useOnboarding } from "@/hooks/useOnboarding";
import { MfaChallenge } from "@/components/MfaChallenge";
import { ChecklistSetup } from "@/components/criteria/ChecklistSetup";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TradesProvider } from "@/contexts/TradesContext";
import { AccountsProvider } from "@/contexts/AccountsContext";
import { LeaksProvider } from "@/contexts/LeaksContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { NicknamePrompt } from "@/components/NicknamePrompt";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import * as Sentry from '@sentry/react';
import Dashboard from "./pages/Dashboard";
import AddTrade from "./pages/AddTrade";
import Journal from "./pages/Journal";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";

const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const TradingPlan = lazy(() => import("./pages/TradingPlan"));
const PerformanceAnalyst = lazy(() => import("./pages/PerformanceAnalyst"));
const Guide = lazy(() => import("./pages/Guide"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Landing = lazy(() => import("./pages/Landing"));
const HowToUse = lazy(() => import("./pages/HowToUse"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const ImportTrades = lazy(() => import("./pages/ImportTrades"));
const LeakDetection = lazy(() => import("./pages/LeakDetection"));
const WhatIfSimulator = lazy(() => import("./pages/WhatIfSimulator"));

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

function ChecklistGate({ children }: { children: React.ReactNode }) {
  const { criteria, isLoading } = useCriteria();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading) return <>{children}</>;
  if (!dismissed && criteria.length === 0) {
    return <ChecklistSetup onDone={() => setDismissed(true)} />;
  }
  return <>{children}</>;
}

function PagePrefetcher() {
  useEffect(() => {
    const t = setTimeout(() => {
      import('./pages/Journal');
      import('./pages/PerformanceAnalyst');
      import('./pages/LeakDetection');
      import('./pages/WhatIfSimulator');
      import('./pages/AIAdvisor');
      import('./pages/TradingPlan');
      import('./pages/Accounts');
      import('./pages/ProfileSettings');
      import('./pages/ImportTrades');
    }, 2000);
    return () => clearTimeout(t);
  }, []);
  return null;
}

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { isLoading, needsNickname, setNickname, profile } = useProfile();
  const { onboardingCompleted, completeOnboarding } = useOnboarding();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (needsNickname) {
    return <NicknamePrompt onSubmit={setNickname} />;
  }

  if (!onboardingCompleted) {
    return (
      <OnboardingFlow
        nickname={profile?.nickname ?? ''}
        onComplete={completeOnboarding}
      />
    );
  }

  return <><PagePrefetcher />{children}</>;
}

const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

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
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={
              <AuthGate>
                <ProfileGate>
                  <SubscriptionProvider>
                  <AccountsProvider>
                    <TradesProvider>
                      <LeaksProvider>
                      <ChecklistGate>
                        <Routes>
                          <Route path="/dashboard" element={<PageErrorBoundary pageName="dashboard"><Dashboard /></PageErrorBoundary>} />
                          <Route path="/add-trade" element={<PageErrorBoundary pageName="add-trade"><AddTrade /></PageErrorBoundary>} />
                          <Route path="/journal" element={<PageErrorBoundary pageName="journal"><Journal /></PageErrorBoundary>} />
                          <Route path="/accounts" element={<PageErrorBoundary pageName="accounts"><Accounts /></PageErrorBoundary>} />
                          <Route path="/ai" element={<PageErrorBoundary pageName="ai"><AIAdvisor /></PageErrorBoundary>} />
                          <Route path="/analyst" element={<PageErrorBoundary pageName="analyst"><PerformanceAnalyst /></PageErrorBoundary>} />
                          <Route path="/profile" element={<PageErrorBoundary pageName="profile"><ProfileSettings /></PageErrorBoundary>} />
                          <Route path="/import-trades" element={<PageErrorBoundary pageName="import-trades"><ImportTrades /></PageErrorBoundary>} />
                          <Route path="/trading-plan" element={<PageErrorBoundary pageName="trading-plan"><TradingPlan /></PageErrorBoundary>} />
                          <Route path="/guide" element={<PageErrorBoundary pageName="guide"><Guide /></PageErrorBoundary>} />
                          <Route path="/leak-detection" element={<PageErrorBoundary pageName="leak-detection"><LeakDetection /></PageErrorBoundary>} />
                          <Route path="/what-if" element={<PageErrorBoundary pageName="what-if"><WhatIfSimulator /></PageErrorBoundary>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ChecklistGate>
                      </LeaksProvider>
                    </TradesProvider>
                  </AccountsProvider>
                  </SubscriptionProvider>
                </ProfileGate>
              </AuthGate>
            } />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

  </Sentry.ErrorBoundary>
);

export default App;
