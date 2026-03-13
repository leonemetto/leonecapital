import { AppSidebar } from './AppSidebar';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
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
    <div className="relative min-h-screen bg-background overflow-hidden flex [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <FlickeringGrid
        className="pointer-events-none fixed inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)]"
        squareSize={4}
        gridGap={6}
        color="hsl(142, 69%, 55%)"
        maxOpacity={0.25}
        flickerChance={0.3}
      />
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
