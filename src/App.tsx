import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TradesProvider } from "@/contexts/TradesContext";
import { AccountsProvider } from "@/contexts/AccountsContext";
import Dashboard from "./pages/Dashboard";
import AddTrade from "./pages/AddTrade";
import Journal from "./pages/Journal";
import Accounts from "./pages/Accounts";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGate>
          <AccountsProvider>
            <TradesProvider>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-trade" element={<AddTrade />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TradesProvider>
          </AccountsProvider>
        </AuthGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
