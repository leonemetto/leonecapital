import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, BookOpen, Wallet, Activity, LogOut, Sparkles, Settings, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const tabs = [
  { title: 'ANALYTICS', path: '/', icon: BarChart3 },
  { title: 'TRADES DB', path: '/journal', icon: BookOpen },
  { title: 'ACCOUNTS', path: '/accounts', icon: Wallet },
  { title: 'AI', path: '/ai', icon: Sparkles },
];

export function TopNav() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="w-full border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        {/* Brand */}
        <div className="flex items-center justify-between pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-profit" />
            <h1 className="text-xl font-black tracking-tight">TRADE JOURNAL</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ring-2 ring-border hover:ring-primary transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.nickname || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.userId ? '' : ''}</p>
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

        {/* Tab nav */}
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab, i) => (
            <NavLink
              key={`${tab.title}-${i}`}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold tracking-wider border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
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
