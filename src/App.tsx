import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCriteria } from "@/hooks/useCriteria";
import { useOnboarding } from "@/hooks/useOnboarding";
import { MfaChallenge } from "@/components/MfaChallenge";
import { ChecklistSetup } from "@/components/criteria/ChecklistSetup";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TradesProvider } from "@/contexts/TradesContext";
import { AccountsProvider } from "@/contexts/AccountsContext";
import { NicknamePrompt } from "@/components/NicknamePrompt";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import AddTrade from "./pages/AddTrade";
import Journal from "./pages/Journal";
import Accounts from "./pages/Accounts";
import AIAdvisor from "./pages/AIAdvisor";
import ResetPassword from "./pages/ResetPassword";
import ProfileSettings from "./pages/ProfileSettings";
import TradingPlan from "./pages/TradingPlan";
import PerformanceAnalyst from "./pages/PerformanceAnalyst";
import Guide from "./pages/Guide";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
        const aal = JSON.parse(atob(session.access_token.split('.')[1]))?.aal || 'aal1';
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

  if (!user) return <Auth />;

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

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { isLoading, needsNickname, setNickname } = useProfile();
  const { provisionDemoAccount } = useOnboarding();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (needsNickname) {
    return <NicknamePrompt onSubmit={async (nickname) => {
      await setNickname(nickname);
      await provisionDemoAccount();
    }} />;
  }

  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('edgeflow_welcome_seen');
  });

  const handleSkip = () => {
    localStorage.setItem('edgeflow_welcome_seen', '1');
    setShowWelcome(false);
  };

  return (
    <>
      <WelcomeModal open={showWelcome} onSkip={handleSkip} />
      {children}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={
              <AuthGate>
                <OnboardingGate>
                  <ProfileGate>
                    <AccountsProvider>
                      <TradesProvider>
                        <ChecklistGate>
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/add-trade" element={<AddTrade />} />
                            <Route path="/journal" element={<Journal />} />
                            <Route path="/accounts" element={<Accounts />} />
                            <Route path="/ai" element={<AIAdvisor />} />
                            <Route path="/analyst" element={<PerformanceAnalyst />} />
                            <Route path="/profile" element={<ProfileSettings />} />
                            <Route path="/trading-plan" element={<TradingPlan />} />
                            <Route path="/guide" element={<Guide />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </ChecklistGate>
                      </TradesProvider>
                    </AccountsProvider>
                  </ProfileGate>
                </OnboardingGate>
              </AuthGate>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
