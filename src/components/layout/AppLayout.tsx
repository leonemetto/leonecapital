import { AppSidebar } from './AppSidebar';
import { SandboxBanner } from '@/components/onboarding/SandboxBanner';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSharedSubscription } from '@/contexts/SubscriptionContext';

interface AppLayoutProps {
  children: React.ReactNode;
  rail?: React.ReactNode;
}

export function AppLayout({ children, rail }: AppLayoutProps) {
  const { accounts, selectedAccountId } = useSharedAccounts();
  const { isTrialing, trialEndsAt, isTrialExpired } = useSharedSubscription();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const isDemoSelected = selectedAccount?.type === 'demo';
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <div
      className="relative min-h-screen flex bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{
        background:
          'radial-gradient(circle at 78% -12%, color-mix(in oklab, var(--ef-bg-elev) 55%, transparent), transparent 34%), var(--ef-bg)',
      }}
    >
      <AppSidebar />
      <div className="relative z-10 flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0">
          {isDemoSelected && <SandboxBanner />}
          {isTrialing && !isTrialExpired && trialDaysLeft !== null && (
            <div className="border-b border-border bg-muted/35 px-5 py-2.5 text-center text-xs text-muted-foreground">
              Pro trial active. <span className="font-mono tabular-nums text-foreground">{trialDaysLeft}</span> {trialDaysLeft === 1 ? 'day' : 'days'} left.
              {' '}Upgrade from Settings when you are ready.
            </div>
          )}
          <main className="max-w-[1560px] mx-auto p-5 md:p-6 lg:p-7 pt-16 lg:pt-7">
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
