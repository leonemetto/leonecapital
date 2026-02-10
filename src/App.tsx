import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TradesProvider } from "@/contexts/TradesContext";
import { AccountsProvider } from "@/contexts/AccountsContext";
import Dashboard from "./pages/Dashboard";
import AddTrade from "./pages/AddTrade";
import Journal from "./pages/Journal";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
