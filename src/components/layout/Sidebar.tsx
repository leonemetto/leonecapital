import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChartLineUp,
  PlusBold,
  Rows,
  Vault,
  Scroll,
  Brain,
  BookBookmark,
  CaretLeft,
  CaretRight,
  List,
  X,
} from '@phosphor-icons/react';
import { AIMemoryCard } from '@/components/sidebar/AIMemoryCard';

// ─── EdgeFlow Logomark ───
// A stepping equity-curve shape: distinctly financial, not generic
function EdgeFlowMark({ size = 18 }: { size?: number }) {
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

const navItems = [
  { title: 'Analytics',     path: '/dashboard',    Icon: ChartLineUp },
  { title: 'Add Trade',     path: '/add-trade',    Icon: PlusBold },
  { title: 'Trades DB',     path: '/journal',      Icon: Rows },
  { title: 'Accounts',      path: '/accounts',     Icon: Vault },
  { title: 'Trading Plan',  path: '/trading-plan', Icon: Scroll },
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
          className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.06)] transition-colors"
        >
          <List className="h-5 w-5 text-white" weight="regular" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <span className="text-white"><EdgeFlowMark size={16} /></span>
          <span className="font-bold text-sm tracking-tight text-white">EdgeFlow</span>
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
          'h-14 flex items-center border-b border-border px-3.5 shrink-0',
          collapsed ? 'justify-center' : 'gap-2.5'
        )}>
          <span className="text-white shrink-0"><EdgeFlowMark size={18} /></span>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-bold text-[13px] tracking-[-0.02em] text-white">EdgeFlow</span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.3)] font-medium mt-0.5">Pro Analytics</span>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-[rgba(255,255,255,0.06)] lg:hidden"
          >
            <X className="h-4 w-4 text-[rgba(255,255,255,0.5)]" weight="regular" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ title, path, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 py-2 rounded-md text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'border-l-2 border-white pl-2 pr-[10px] text-white'
                  : 'px-2.5 text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]',
                collapsed && 'justify-center px-2 border-l-0 pl-2'
              )}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" weight="regular" />
              {!collapsed && <span>{title}</span>}
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
              'flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-[rgba(255,255,255,0.3)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors w-full',
              collapsed && 'justify-center px-2'
            )}
          >
            {collapsed
              ? <CaretRight className="h-3.5 w-3.5" weight="regular" />
              : <CaretLeft className="h-3.5 w-3.5" weight="regular" />
            }
            {!collapsed && <span className="text-[11px]">Collapse</span>}
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
