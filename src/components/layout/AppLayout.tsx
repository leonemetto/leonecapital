import { AppSidebar } from './AppSidebar';
import { SandboxBanner } from '@/components/onboarding/SandboxBanner';
import { useSharedAccounts } from '@/contexts/AccountsContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { accounts, selectedAccountId } = useSharedAccounts();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const isDemoSelected = selectedAccount?.type === 'demo';

  return (
    <div className="relative min-h-screen overflow-hidden flex bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <AppSidebar />
      <div className="relative z-10 flex-1 min-w-0">
        {isDemoSelected && <SandboxBanner />}
        <main className="max-w-[1600px] mx-auto p-5 md:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
