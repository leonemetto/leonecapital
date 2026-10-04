import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  SunHorizon,
  Rows,
  ChartLineUp,
  ListChecks,
  Compass,
  Plus,
  SidebarSimple,
  X,
  GearSix,
  Wallet,
  UploadSimple,
  Question,
  SignOut,
  Sun,
  Moon,
  DotsThree,
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLeaks } from '@/contexts/LeaksContext';
import { cn } from '@/lib/utils';
import { AccountSwitcher } from './AccountSwitcher';
import { useShell } from './ShellContext';

// Ordered by the trader's loop: look at today, work the trades, learn, adjust the plan.
export const NAV_ITEMS = [
  { title: 'Today', short: 'Today', path: '/dashboard', Icon: SunHorizon, match: ['/dashboard'] },
  { title: 'Trades', short: 'Trades', path: '/journal', Icon: Rows, match: ['/journal', '/import-trades'] },
  { title: 'Insights', short: 'Insights', path: '/insights', Icon: ChartLineUp, match: ['/insights'], badge: true },
  { title: 'Plan', short: 'Plan', path: '/trading-plan', Icon: ListChecks, match: ['/trading-plan'] },
] as const;

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD_KEY = isMac ? '⌘' : 'Ctrl';

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen, openLogTrade, openAtlas, atlasOpen, closeAtlas } = useShell();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { newLeakCount } = useLeaks();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();
  // The drawer on small screens always shows the full sidebar.
  const slim = collapsed && !mobileNavOpen;
  const closeMobile = () => setMobileNavOpen(false);

  const go = (path: string) => {
    closeMobile();
    navigate(path);
  };

  return (
    <>
      {mobileNavOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'var(--ef-scrim)' }}
          onClick={closeMobile}
        />
      )}

      <aside
        aria-label="Primary"
        className={cn(
          'fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-ef-line bg-ef-bg transition-[width,transform] duration-200 ease-out',
          slim ? 'w-[68px]' : 'w-[236px]',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-[52px] shrink-0 items-center px-3', slim ? 'justify-center' : 'justify-between')}>
          <div className="flex min-w-0 items-center gap-2.5 pl-1">
            <img src="/logo-new.png" width={20} height={20} alt="" className="shrink-0 object-contain" />
            {!slim && (
              <span className="truncate text-[13px] font-semibold tracking-[0.02em] text-ef-ink">EDGEFLOW</span>
            )}
          </div>
          {!slim && (
            <>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
                className="ef-btn ef-btn-ghost ef-btn-sm hidden w-7 px-0 lg:inline-flex"
              >
                <SidebarSimple className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
                className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0 lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className={cn('flex flex-col gap-2 px-3 pb-2', slim && 'px-2')}>
          <AccountSwitcher collapsed={slim} onNavigate={closeMobile} />
          <button
            type="button"
            onClick={() => {
              closeMobile();
              openLogTrade();
            }}
            className={cn(
              'ef-btn ef-btn-primary w-full',
              slim ? 'h-11 flex-col gap-0.5 px-0' : 'h-9 justify-between',
            )}
          >
            <span className={cn('flex items-center', slim ? 'flex-col gap-0.5' : 'gap-1.5')}>
              <Plus className="h-3.5 w-3.5" weight="bold" />
              <span className={slim ? 'text-[8px] font-semibold tracking-[0.04em]' : undefined}>
                {slim ? 'Log' : 'Log trade'}
              </span>
            </span>
            {!slim && (
              <kbd className="ef-num rounded-[4px] border px-1 text-[10px] font-medium opacity-60" style={{ borderColor: 'color-mix(in oklab, currentColor 35%, transparent)' }}>L</kbd>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto px-3 pt-2', slim && 'px-2')}>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {NAV_ITEMS.map(item => {
              const showBadge = 'badge' in item && item.badge && newLeakCount > 0;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      cn(
                        'ef-focus group relative flex items-center rounded-[8px] transition-colors',
                        slim ? 'h-12 flex-col justify-center gap-1' : 'h-9 gap-2.5 px-2.5',
                        isActive
                          ? 'bg-ef-sunken text-ef-ink'
                          : 'text-ef-ink-3 hover:bg-ef-hover hover:text-ef-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !slim && (
                          <span aria-hidden className="absolute -left-3 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-ef-ink" />
                        )}
                        <span className="relative">
                          <item.Icon className="h-[17px] w-[17px]" weight={isActive ? 'fill' : 'regular'} />
                          {showBadge && slim && (
                            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-ef-neg" />
                          )}
                        </span>
                        {slim ? (
                          <span className="text-[8px] font-medium tracking-[0.04em]">{item.short}</span>
                        ) : (
                          <span className="flex-1 truncate text-[13px] font-medium">{item.title}</span>
                        )}
                        {showBadge && !slim && (
                          <span
                            className="ef-num inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-chip bg-ef-neg-wash px-1 text-[10.5px] font-medium text-ef-neg"
                            aria-label={`${newLeakCount} new leaks`}
                          >
                            {newLeakCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Atlas + profile */}
        <div className={cn('flex flex-col gap-0.5 border-t border-ef-line p-3', slim && 'p-2')}>
          <button
            type="button"
            onClick={() => {
              closeMobile();
              if (atlasOpen) closeAtlas();
              else openAtlas();
            }}
            aria-pressed={atlasOpen}
            className={cn(
              'ef-focus flex items-center rounded-[8px] transition-colors',
              slim ? 'h-12 flex-col justify-center gap-1' : 'h-9 gap-2.5 px-2.5',
              atlasOpen ? 'bg-ef-sunken text-ef-ink' : 'text-ef-ink-3 hover:bg-ef-hover hover:text-ef-ink',
            )}
          >
            <Compass className="h-[17px] w-[17px]" weight={atlasOpen ? 'fill' : 'regular'} />
            {slim ? (
              <span className="text-[8px] font-medium tracking-[0.04em]">Atlas</span>
            ) : (
              <>
                <span className="flex-1 text-left text-[13px] font-medium">Ask Atlas</span>
                <span className="flex items-center gap-0.5">
                  <kbd className="ef-kbd">{MOD_KEY}</kbd>
                  <kbd className="ef-kbd">J</kbd>
                </span>
              </>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className={cn(
                  'ef-focus flex items-center rounded-[8px] text-ef-ink-3 transition-colors hover:bg-ef-hover hover:text-ef-ink',
                  slim ? 'h-12 flex-col justify-center gap-1' : 'h-10 gap-2.5 px-2',
                )}
              >
                <Avatar className="h-6 w-6 shrink-0 rounded-[7px]">
                  <AvatarImage src={profile?.avatarUrl || undefined} className="rounded-[7px]" />
                  <AvatarFallback className="rounded-[7px] bg-ef-sunken text-[9px] font-semibold text-ef-ink">{initials}</AvatarFallback>
                </Avatar>
                {slim ? (
                  <span className="text-[8px] font-medium tracking-[0.04em]">You</span>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-ef-ink">
                      {profile?.nickname || 'Trader'}
                    </span>
                    <DotsThree className="h-4 w-4 shrink-0" weight="bold" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-[212px] rounded-surface border-ef-line bg-ef-elev p-1.5 backdrop-blur-none"
              style={{ boxShadow: 'var(--ef-shadow-pop)' }}
            >
              <MenuItem icon={GearSix} label="Settings" onSelect={() => go('/profile')} />
              <MenuItem icon={Wallet} label="Accounts" onSelect={() => go('/accounts')} />
              <MenuItem icon={UploadSimple} label="Import trades" onSelect={() => go('/import-trades')} />
              <MenuItem icon={Question} label="Help and features" onSelect={() => go('/how-to-use')} />
              <DropdownMenuSeparator className="bg-ef-line" />
              <MenuItem
                icon={resolvedTheme === 'dark' ? Sun : Moon}
                label={resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}
                onSelect={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              />
              <DropdownMenuSeparator className="bg-ef-line" />
              <MenuItem icon={SignOut} label="Sign out" onSelect={() => signOut()} />
            </DropdownMenuContent>
          </DropdownMenu>

          {slim && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              className="ef-focus hidden h-9 items-center justify-center rounded-[8px] text-ef-ink-4 transition-colors hover:bg-ef-hover hover:text-ef-ink lg:flex"
            >
              <SidebarSimple className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Spacer keeps the content clear of the fixed sidebar */}
      <div aria-hidden className={cn('hidden shrink-0 transition-[width] duration-200 lg:block', collapsed ? 'w-[68px]' : 'w-[236px]')} />
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-ef-ink-2 focus:bg-ef-hover focus:text-ef-ink"
    >
      <Icon className="h-4 w-4 text-ef-ink-3" />
      {label}
    </DropdownMenuItem>
  );
}
