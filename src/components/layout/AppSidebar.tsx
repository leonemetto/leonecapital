import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3, BookOpen, Wallet, LogOut, Sparkles, Settings, BookMarked,
  Activity, ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react';
import logoImg from '@/assets/logo.svg';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const GUIDE_SECTION_IDS = ['philosophy', 'analyst', 'optimizer', 'ai-advisor', 'workflow'];

const baseNavItems = [
  { title: 'Analytics', path: '/dashboard', icon: BarChart3 },
  { title: 'Analyst', path: '/analyst', icon: Activity },
  { title: 'Trades DB', path: '/journal', icon: BookOpen },
  { title: 'Accounts', path: '/accounts', icon: Wallet },
  { title: 'AI Advisor', path: '/ai', icon: Sparkles },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { guideProgress } = useOnboarding();
  const navigate = useNavigate();
  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();

  const guideComplete = GUIDE_SECTION_IDS.every(s => guideProgress.includes(s));

  const navItems = [
    ...baseNavItems,
    guideComplete
      ? { title: 'Settings', path: '/profile', icon: Settings }
      : { title: 'Guide', path: '/guide', icon: BookMarked },
  ];

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[220px]';

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const link = (
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) => cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
          isActive
            ? 'text-white border-l-2 border-white pl-[10px]'
            : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.04)]',
          collapsed && 'justify-center px-2.5 border-l-0 pl-2.5'
        )}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] lg:hidden"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ease-out',
          'border-r border-[rgba(255,255,255,0.06)]',
          sidebarWidth,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ background: '#0a0a0a' }}
      >
        {/* Brand header */}
        <div className={cn(
          'h-16 flex items-center border-b border-[rgba(255,255,255,0.06)] px-4 shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="relative shrink-0">
            <img src={logoImg} alt="Logo" className="h-8 w-8 rounded-lg" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight leading-none truncate text-white">EDGEFLOW</h1>
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Pro Analytics</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] lg:hidden"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-[rgba(255,255,255,0.06)] p-3 space-y-0.5">
          {collapsed ? (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center justify-center w-full p-2.5 rounded-lg text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatarUrl || undefined} />
                      <AvatarFallback className="text-white text-[9px] font-bold" style={{ background: 'rgba(255,255,255,0.08)' }}>{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>Profile</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center justify-center w-full p-2.5 rounded-lg text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>Sign Out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[rgba(255,255,255,0.35)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all"
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="text-white text-[9px] font-bold" style={{ background: 'rgba(255,255,255,0.08)' }}>{initials}</AvatarFallback>
                </Avatar>
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold leading-none truncate text-white">{profile?.nickname || 'User'}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Profile</p>
                </div>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle - desktop only */}
        <div className="hidden lg:flex border-t border-[rgba(255,255,255,0.06)] p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all',
              collapsed && 'justify-center px-2'
            )}
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer for layout */}
      <div className={cn(
        'hidden lg:block shrink-0 transition-all duration-300',
        sidebarWidth
      )} />
    </>
  );
}
