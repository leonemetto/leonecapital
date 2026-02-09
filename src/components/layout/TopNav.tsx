import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, BookOpen, PlusCircle, Activity } from 'lucide-react';

const tabs = [
  { title: 'ANALYTICS', path: '/', icon: BarChart3 },
  { title: 'TRADES DB', path: '/journal', icon: BookOpen },
  { title: 'LOG TRADE', path: '/add-trade', icon: PlusCircle },
];

export function TopNav() {
  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 py-3">
          <Activity className="h-5 w-5 text-profit" />
          <h1 className="text-lg font-black tracking-tight">TRADE JOURNAL+ANALYTICS</h1>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wider border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
