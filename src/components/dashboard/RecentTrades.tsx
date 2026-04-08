import { useMemo, useState } from 'react';
import { Trade } from '@/types/trade';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from '@phosphor-icons/react';

interface Props { trades: Trade[] }

type Filter = 'all' | 'win' | 'loss';

const PILLS: { key: Filter; label: string }[] = [
  { key: 'all',  label: 'All'    },
  { key: 'win',  label: 'Wins'   },
  { key: 'loss', label: 'Losses' },
];

export function RecentTrades({ trades }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const recent = useMemo(() => {
    let pool = [...trades];
    if (filter === 'win')  pool = pool.filter(t => t.outcome === 'win');
    if (filter === 'loss') pool = pool.filter(t => t.outcome === 'loss');
    return pool
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [trades, filter]);

  const isEmpty = trades.length === 0;

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5 px-6 h-full flex flex-col">
      {/* Title + filter pills */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[rgba(255,255,255,0.4)]">Recent Trades</span>
        {!isEmpty && (
          <div className="flex gap-1">
            {PILLS.map(p => (
              <button
                key={p.key}
                onClick={() => setFilter(p.key)}
                className={cn(
                  'text-[10px] px-[10px] py-[4px] rounded-[20px] border transition-colors',
                  filter === p.key
                    ? 'bg-foreground text-background border-transparent font-semibold'
                    : 'bg-transparent text-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.15)] hover:text-[rgba(255,255,255,0.65)]'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex-1">
        {isEmpty ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-6 rounded-full" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            ))}
            <p className="text-xs text-[rgba(255,255,255,0.25)] text-center pt-2">
              No trades yet — log your first trade to see insights
            </p>
          </div>
        ) : recent.length === 0 ? (
          <p className="text-xs text-[rgba(255,255,255,0.25)] text-center py-8">
            No {filter === 'win' ? 'winning' : 'losing'} trades yet
          </p>
        ) : (
          <div className="space-y-0">
            {recent.map((t, i) => (
              <div key={t.id}>
                <div className="flex items-center gap-2 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{t.instrument}</span>
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                        t.direction === 'long' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
                      )}>
                        {t.direction === 'long' ? 'L' : 'S'}
                      </span>
                      {t.session && (
                        <span className="text-[10px] text-[rgba(255,255,255,0.3)]">{t.session}</span>
                      )}
                      {t.screenshotUrl && (
                        <Camera className="h-3 w-3 text-[rgba(255,255,255,0.25)] shrink-0" weight="regular" />
                      )}
                    </div>
                    {t.strategy && (
                      <span className="text-[10px] text-[rgba(255,255,255,0.3)]">{t.strategy}</span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[13px] font-bold tabular-nums',
                    t.pnl > 0 ? 'text-profit' : t.pnl < 0 ? 'text-loss' : 'text-foreground'
                  )}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </span>
                </div>
                {i < recent.length - 1 && <div className="h-px bg-[rgba(255,255,255,0.05)]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isEmpty && (
        <Link to="/journal" className="text-[11px] text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.5)] self-end mt-3 transition-colors">
          View all →
        </Link>
      )}
    </div>
  );
}
