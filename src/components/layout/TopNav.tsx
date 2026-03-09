import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, BookOpen, Wallet, LogOut, Sparkles, Settings, Activity, ChevronDown, BookMarked } from 'lucide-react';
import logoImg from '@/assets/logo.svg';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

const tabs = [
  { title: 'ANALYTICS', path: '/', icon: BarChart3 },
  { title: 'ANALYST', path: '/analyst', icon: Activity },
  { title: 'TRADES DB', path: '/journal', icon: BookOpen },
  { title: 'ACCOUNTS', path: '/accounts', icon: Wallet },
  { title: 'AI', path: '/ai', icon: Sparkles },
  { title: 'GUIDE', path: '/guide', icon: BookMarked },
];

export function TopNav() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { accounts, selectedAccountId, setSelectedAccountId } = useSharedAccounts();
  const navigate = useNavigate();
  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();

  const liveAccounts = accounts.filter(a => a.type !== 'demo');
  const demoAccounts = accounts.filter(a => a.type === 'demo');
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountLabel = selectedAccountId === '__all__' ? 'All Accounts' : selectedAccount?.name ?? 'All Accounts';

  return (
    <header className="w-full glass-nav sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        {/* Brand */}
        <div className="flex items-center justify-between pt-5 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img src={logoImg} alt="Logo" className="h-9 w-9 rounded-xl" />
              <div className="absolute -inset-1 bg-primary/10 rounded-xl blur-md -z-10" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">EDGEFLOW</h1>
              <p className="text-[9px] text-muted-foreground/50 font-medium tracking-[0.2em] uppercase mt-0.5">Professional Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Account Switcher */}
            {accounts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-all text-xs font-medium">
                    <span className="hidden sm:inline truncate max-w-[120px]">{accountLabel}</span>
                    <span className="sm:hidden">Acct</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() => setSelectedAccountId('__all__')}
                    className={cn('cursor-pointer text-xs', selectedAccountId === '__all__' && 'bg-primary/10 text-primary')}
                  >
                    All Accounts
                  </DropdownMenuItem>
                  {liveAccounts.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground">Live Accounts</DropdownMenuLabel>
                      {liveAccounts.map(a => (
                        <DropdownMenuItem
                          key={a.id}
                          onClick={() => setSelectedAccountId(a.id)}
                          className={cn('cursor-pointer text-xs', selectedAccountId === a.id && 'bg-primary/10 text-primary')}
                        >
                          {a.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {demoAccounts.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground">Demo Accounts</DropdownMenuLabel>
                      {demoAccounts.map(a => (
                        <DropdownMenuItem
                          key={a.id}
                          onClick={() => setSelectedAccountId(a.id)}
                          className={cn('cursor-pointer text-xs', selectedAccountId === a.id && 'bg-primary/10 text-primary')}
                        >
                          {a.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Profile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-secondary/60 transition-all group">
                  <div className="rounded-full ring-2 ring-border/60 group-hover:ring-primary/40 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold leading-none">{profile?.nickname || 'User'}</p>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">Trader</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.nickname || 'User'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
                  <Settings className="h-3.5 w-3.5" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab, i) => (
            <NavLink
              key={`${tab.title}-${i}`}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] border-b-2 transition-all whitespace-nowrap rounded-t-lg',
                isActive
                  ? 'border-primary text-primary bg-primary/[0.04]'
                  : 'border-transparent text-muted-foreground/60 hover:text-foreground hover:border-muted-foreground/20 hover:bg-secondary/30'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.title}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
