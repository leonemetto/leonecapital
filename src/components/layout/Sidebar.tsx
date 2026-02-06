import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, PlusCircle, BookOpen, CalendarDays, Brain,
  ChevronLeft, ChevronRight, Menu, X, TrendingUp,
} from 'lucide-react';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Add Trade', path: '/add-trade', icon: PlusCircle },
  { title: 'Journal', path: '/journal', icon: BookOpen },
  { title: 'Calendar', path: '/calendar', icon: CalendarDays },
  { title: 'Insights', path: '/insights', icon: Brain },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-md border-b border-border z-50 flex items-center px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">EdgeJournal</span>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-card border-r border-border z-50 flex flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className={cn(
          'h-14 flex items-center border-b border-border px-4 shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <TrendingUp className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="font-bold text-lg tracking-tight">EdgeJournal</span>}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-secondary lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary glow-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex border-t border-border p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors w-full',
              collapsed && 'justify-center px-2'
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer for content */}
      <div className={cn(
        'hidden lg:block shrink-0 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )} />
    </>
  );
}
