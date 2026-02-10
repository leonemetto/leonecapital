import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3, BookOpen, PlusCircle, Activity,
  ClipboardCheck, Trophy, Target, Wallet,
} from 'lucide-react';

const tabs = [
  { title: 'ANALYTICS', path: '/', icon: BarChart3 },
  { title: 'TRADES DB', path: '/journal', icon: BookOpen },
  { title: 'ACCOUNTS', path: '/accounts', icon: Wallet },
];

export function TopNav() {
  return (
    <header className="w-full border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 pt-4 pb-3">
          <Activity className="h-5 w-5 text-profit" />
          <h1 className="text-xl font-black tracking-tight">TRADE JOURNAL+ANALYTICS</h1>
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
