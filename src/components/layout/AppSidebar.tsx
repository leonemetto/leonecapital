import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartLineUp,
  ChartBarHorizontal,
  Table,
  Wallet,
  Brain,
  GearSix,
  SignOut,
  CaretLeft,
  CaretRight,
  List,
  X,
  Plus,
  ClipboardText,
  DropHalf,
  Scales,
  Question,
  Crosshair,
} from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLeaks } from '@/contexts/LeaksContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

function EdgeFlowMark({ size = 20 }: { size?: number }) {
  return (
    <img src="/logo-new.png" width={size} height={size} alt="EdgeFlow" style={{ objectFit: 'contain' }} />
  );
}

const baseNavItems = [
  { title: 'Dashboard',       short: 'Dash',    path: '/dashboard',       Icon: ChartLineUp },
  { title: 'Trades DB',       short: 'Trades',  path: '/journal',         Icon: Table },
  { title: 'Analytics',       short: 'Stats',   path: '/analyst',         Icon: ChartBarHorizontal },
  { title: 'Leak Detection',  short: 'Leaks',   path: '/leak-detection',  Icon: DropHalf,   badge: true },
  { title: 'Optimizer',       short: 'Optim.',  path: '/what-if',         Icon: Scales },
  { title: 'Atlas',           short: 'AI',      path: '/ai',              Icon: Brain },
  { title: 'Trading Plan',    short: 'Plan',    path: '/trading-plan',    Icon: ClipboardText },
  { title: 'Accounts',        short: 'Accts',   path: '/accounts',        Icon: Wallet },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();

  const { newLeakCount: leakCount } = useLeaks();

  const navItems = baseNavItems;

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-[220px]';

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-background border border-border lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          'border-r border-border bg-background',
          sidebarWidth,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className={cn(
          'h-[60px] flex items-center border-b border-border px-4 shrink-0',
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
            className="ml-auto p-1.5 rounded-lg hover:bg-muted lg:hidden outline-none"
          >
            <X className="h-4 w-4 text-foreground" weight="regular" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {/* Log Trade — primary action */}
          <NavLink
            to="/add-trade"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              'flex transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[8px] mb-2',
              collapsed
                ? 'flex-col items-center justify-center gap-1 py-2.5 px-1 bg-foreground text-background shadow-[0_16px_34px_rgba(0,0,0,0.28)]'
                : 'flex-row items-center gap-2 px-3 py-2.5 bg-foreground text-background shadow-[0_16px_34px_rgba(0,0,0,0.28)]',
              isActive && 'opacity-80'
            )}
          >
            <Crosshair className={collapsed ? 'h-[16px] w-[16px] shrink-0' : 'h-[14px] w-[14px] shrink-0'} weight="bold" />
            {collapsed
              ? <span className="text-[8px] font-bold tracking-[0.04em] leading-none">Log</span>
              : <span className="text-[13px] font-semibold">Log Trade</span>
            }
          </NavLink>

          <div className="pb-1 mb-1 border-b border-border" />

          {/* Section label */}
          {!collapsed && (
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50 px-2 pt-1 pb-0.5">Analyze</p>
          )}

          {navItems.map(item => {
            const showBadge = (item as any).badge && leakCount > 0;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cn(
                  'group relative flex transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[10px]',
                  collapsed
                    ? 'flex-col items-center justify-center gap-1 py-2.5 px-1'
                    : 'flex-row items-center gap-2.5 px-2 py-1.5',
                  isActive
                    ? 'bg-white/[0.055] text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.055)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.035]'
                )}
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0'
                      )}
                      style={{ background: 'var(--ef-ink)' }}
                    />
                    <span
                      className={cn(
                        'relative grid shrink-0 place-items-center rounded-lg transition-all',
                        collapsed ? 'h-7 w-7' : 'h-7 w-7',
                        isActive
                          ? 'bg-foreground text-background shadow-[0_8px_22px_rgba(255,255,255,0.08)]'
                          : 'bg-white/[0.035] text-muted-foreground/75 group-hover:bg-white/[0.06] group-hover:text-foreground'
                      )}
                    >
                  <item.Icon
                        className={collapsed ? 'h-[16px] w-[16px]' : 'h-[15px] w-[15px]'}
                        weight={isActive ? 'fill' : 'regular'}
                  />
                  {showBadge && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--ef-neg)',
                      border: '1.5px solid var(--background)',
                      display: 'block',
                    }} />
                  )}
                    </span>
                    {collapsed ? (
                      <span className="text-[8px] font-medium tracking-[0.04em] leading-none">{item.short}</span>
                    ) : (
                      <span className="truncate text-[13px] font-medium flex-1">{item.title}</span>
                    )}
                    {!collapsed && showBadge && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 18, height: 18, borderRadius: 9,
                        background: 'var(--ef-neg)',
                        color: 'white',
                        fontSize: 10, fontWeight: 700,
                        fontFamily: 'var(--ff-mono)',
                        flexShrink: 0,
                      }}>
                        {leakCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-2 space-y-0.5">
          {collapsed ? (
            <>
              <button
                onClick={() => navigate('/how-to-use')}
                className="flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none"
              >
                <Question className="h-[17px] w-[17px]" weight="regular" />
                <span className="text-[8px] font-medium tracking-[0.04em] opacity-60">Help</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="text-[8px] font-bold bg-muted text-foreground">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-[8px] font-medium tracking-[0.04em] opacity-60">You</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none"
              >
                <SignOut className="h-[17px] w-[17px]" weight="regular" />
                <span className="text-[8px] font-medium tracking-[0.04em] opacity-60">Out</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/how-to-use')}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none"
              >
                <Question className="h-[16px] w-[16px] shrink-0" weight="regular" />
                <span>Help & Features</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none"
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="text-[9px] font-bold bg-muted text-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[12px] font-semibold leading-none truncate text-foreground">{profile?.nickname || 'User'}</p>
                  <p className="text-[10px] mt-0.5 text-muted-foreground/60">Settings</p>
                </div>
                <GearSix className="h-[14px] w-[14px] shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" weight="regular" />
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none"
              >
                <SignOut className="h-[16px] w-[16px] shrink-0" weight="regular" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="hidden lg:flex border-t border-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-all outline-none',
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
