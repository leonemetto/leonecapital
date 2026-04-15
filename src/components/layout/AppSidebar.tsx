import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartLineUp,
  ChartBar,
  Rows,
  CurrencyDollar,
  Brain,
  GearSix,
  SignOut,
  CaretLeft,
  CaretRight,
  List,
  X,
  Plus,
  ClipboardText,
} from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

// ─── EdgeFlow Logomark ───
function EdgeFlowMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <polyline
        points="2,18 2,11 7,11 7,6 12,6 12,2 18,2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const baseNavItems = [
  { title: 'Dashboard',  short: 'Dash',     path: '/dashboard', Icon: ChartLineUp },
  { title: 'Analytic',   short: 'Analytic', path: '/analyst',   Icon: ChartBar },
  { title: 'Trades DB',  short: 'Trades',   path: '/journal',   Icon: Rows },
  { title: 'Accounts',   short: 'Accounts', path: '/accounts',  Icon: CurrencyDollar },
  { title: 'AI Advisor',    short: 'AI',      path: '/ai',            Icon: Brain },
  { title: 'Trading Plan',  short: 'Plan',    path: '/trading-plan',  Icon: ClipboardText },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();

  const navItems = [
    ...baseNavItems,
    { title: 'Settings', short: 'Settings', path: '/profile', Icon: GearSix },
  ];

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[220px]';

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card border border-border lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <List className="h-5 w-5 text-foreground" weight="regular" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ease-out',
          'bg-sidebar border-r border-sidebar-border',
          sidebarWidth,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className={cn(
          'h-16 flex items-center border-b border-sidebar-border px-4 shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <span className="text-foreground shrink-0">
            <EdgeFlowMark size={20} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold tracking-[-0.02em] leading-none truncate text-foreground">EDGEFLOW</h1>
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase mt-1 text-muted-foreground/60">Pro Analytics</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg hover:bg-sidebar-accent lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="h-4 w-4 text-foreground" weight="regular" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {/* Log Trade — primary action */}
          <NavLink
            to="/add-trade"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              'flex transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/20 rounded-[24px] mb-2',
              collapsed
                ? 'flex-col items-center justify-center gap-1 py-2.5 px-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                : 'flex-row items-center gap-2 px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
              isActive && 'border-foreground/40 text-foreground'
            )}
          >
            <Plus className={collapsed ? 'h-[17px] w-[17px] shrink-0' : 'h-4 w-4 shrink-0'} weight="bold" />
            {collapsed
              ? <span className="text-[8px] font-bold tracking-[0.04em] leading-none">Log</span>
              : <span className="text-[13px] font-semibold">Log Trade</span>
            }
          </NavLink>

          <div className="pb-1 mb-1 border-b border-sidebar-border" />

          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                'flex transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg',
                collapsed
                  ? 'flex-col items-center justify-center gap-1 py-2.5 px-1'
                  : 'flex-row items-center gap-3 px-3 py-2.5',
                isActive
                  ? collapsed
                    ? 'text-foreground bg-sidebar-accent'
                    : 'text-foreground border-l-2 border-primary pl-[10px] font-semibold'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.Icon
                className={collapsed ? 'h-[17px] w-[17px] shrink-0' : 'h-[18px] w-[18px] shrink-0'}
                weight="regular"
              />
              {collapsed
                ? <span className="text-[8px] font-medium tracking-[0.04em] leading-none opacity-60">{item.short}</span>
                : <span className="truncate text-[13px] font-medium">{item.title}</span>
              }
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-2 space-y-0.5">
          {collapsed ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="text-foreground text-[8px] font-bold bg-muted">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-[8px] font-medium tracking-[0.04em] opacity-60">Profile</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <SignOut className="h-[17px] w-[17px]" weight="regular" />
                <span className="text-[8px] font-medium tracking-[0.04em] opacity-60">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="text-foreground text-[9px] font-bold bg-muted">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-left min-w-0">
                  <p className="text-[12px] font-semibold leading-none truncate text-foreground">{profile?.nickname || 'User'}</p>
                  <p className="text-[9px] mt-1 text-muted-foreground">Profile</p>
                </div>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <SignOut className="h-[18px] w-[18px] shrink-0" weight="regular" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="hidden lg:flex border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              collapsed && 'justify-center px-2'
            )}
          >
            {collapsed
              ? <CaretRight className="h-3.5 w-3.5" weight="regular" />
              : <><CaretLeft className="h-3.5 w-3.5" weight="regular" /><span>Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* Layout spacer */}
      <div className={cn(
        'hidden lg:block shrink-0 transition-all duration-300',
        sidebarWidth
      )} />
    </>
  );
}
