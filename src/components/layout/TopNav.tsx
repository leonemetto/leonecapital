import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, BookOpen, Wallet, LogOut, Sparkles, Settings, Activity } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const tabs = [
  { title: 'Analytics', path: '/', icon: BarChart3 },
  { title: 'Analyst', path: '/analyst', icon: Activity },
  { title: 'Trades', path: '/journal', icon: BookOpen },
  { title: 'Accounts', path: '/accounts', icon: Wallet },
  { title: 'AI', path: '/ai', icon: Sparkles },
];

export function TopNav() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-10">
        {/* Brand */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Logo" className="h-7 w-7 rounded-lg opacity-90" />
            <span className="text-sm font-semibold tracking-tight text-foreground/80">Trade Journal</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 group outline-none">
                <Avatar className="h-7 w-7 ring-1 ring-border group-hover:ring-primary/40 transition-all duration-200">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-secondary text-muted-foreground text-[10px] font-medium">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.nickname || 'User'}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
                <Settings className="h-3.5 w-3.5" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-destructive">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab, i) => (
            <NavLink
              key={`${tab.title}-${i}`}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground/70'
              )}
            >
              <tab.icon className="h-3.5 w-3.5 opacity-60" />
              {tab.title}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
