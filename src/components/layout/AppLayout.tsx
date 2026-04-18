import { AppSidebar } from './AppSidebar';
import { SandboxBanner } from '@/components/onboarding/SandboxBanner';
import { useSharedAccounts } from '@/contexts/AccountsContext';

interface AppLayoutProps {
  children: React.ReactNode;
  rail?: React.ReactNode;
}

export function AppLayout({ children, rail }: AppLayoutProps) {
  const { accounts, selectedAccountId } = useSharedAccounts();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const isDemoSelected = selectedAccount?.type === 'demo';

  return (
    <div className="relative min-h-screen flex bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <AppSidebar />
      <div className="relative z-10 flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0">
          {isDemoSelected && <SandboxBanner />}
          <main className="max-w-[1400px] mx-auto p-5 md:p-6 lg:p-7 pt-16 lg:pt-7">
            {children}
          </main>
        </div>
        {rail && (
          <aside className="hidden xl:block w-[300px] shrink-0 border-l border-border sticky top-0 h-screen overflow-y-auto bg-background">
            {rail}
          </aside>
        )}
      </div>
    </div>
  );
}
