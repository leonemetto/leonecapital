import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, PlusCircle, BookOpen, Wallet,
  ChevronLeft, ChevronRight, Menu, X, Activity,
} from 'lucide-react';
import { AIMemoryCard } from '@/components/sidebar/AIMemoryCard';


const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Add Trade', path: '/add-trade', icon: PlusCircle },
  { title: 'Journal', path: '/journal', icon: BookOpen },
  { title: 'Accounts', path: '/accounts', icon: Wallet },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-card/95 backdrop-blur-md border-b border-border z-50 flex items-center px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-secondary transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <Activity className="h-4 w-4 text-profit" />
          <span className="font-bold text-sm tracking-tight">EdgeJournal</span>
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
          'fixed top-0 left-0 h-screen bg-card border-r border-border z-50 flex flex-col transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-[200px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className={cn(
          'h-12 flex items-center border-b border-border px-3 shrink-0',
          collapsed ? 'justify-center' : 'gap-2'
        )}>
          <Activity className="h-5 w-5 text-profit shrink-0" />
          {!collapsed && <span className="font-bold text-sm tracking-tight">EdgeJournal</span>}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-secondary lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* AI Memory */}
        <AIMemoryCard collapsed={collapsed} />

        {/* Collapse toggle */}
        <div className="hidden lg:flex border-t border-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors w-full',
              collapsed && 'justify-center px-2'
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer */}
      <div className={cn(
        'hidden lg:block shrink-0 transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[200px]'
      )} />
    </>
  );
}
