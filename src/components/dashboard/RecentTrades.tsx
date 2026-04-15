import { useMemo, useState } from 'react';
import { Trade } from '@/types/trade';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, X } from '@phosphor-icons/react';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface Props { trades: Trade[] }

type Filter = 'all' | 'win' | 'loss';

const PILLS: { key: Filter; label: string }[] = [
  { key: 'all',  label: 'All'    },
  { key: 'win',  label: 'Wins'   },
  { key: 'loss', label: 'Losses' },
];

function ScreenshotViewer({ path, onClose }: { path: string; onClose: () => void }) {
  const { data: url, isLoading } = useSignedUrl(path);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors outline-none"
        >
          <X className="h-4 w-4" weight="bold" /> Close
        </button>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-white/40 text-sm">Loading...</span>
          </div>
        ) : url ? (
          <img
            src={url}
            alt="Chart screenshot"
            className="w-full h-auto max-h-[85vh] object-contain rounded-xl border border-white/10"
          />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <span className="text-white/40 text-sm">Could not load image</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecentTrades({ trades }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

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
    <>
      {viewingScreenshot && (
        <ScreenshotViewer path={viewingScreenshot} onClose={() => setViewingScreenshot(null)} />
      )}

      <div className="p-5 px-6 h-full flex flex-col">
        {/* Title + filter pills */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recent Trades</span>
          {!isEmpty && (
            <div className="flex gap-1">
              {PILLS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setFilter(p.key)}
                  className={cn(
                    'text-[10px] px-[10px] py-[4px] rounded-[20px] border transition-colors outline-none',
                    filter === p.key
                      ? 'bg-foreground text-background border-transparent font-semibold'
                      : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex-1">
          {isEmpty ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-6 rounded-full" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground/60 text-center pt-2">
                No trades yet — log your first trade to see insights
              </p>
            </div>
          ) : recent.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-8">
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
                          t.direction === 'long' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                        )}>
                          {t.direction === 'long' ? 'L' : 'S'}
                        </span>
                        {t.session && (
                          <span className="text-[10px] text-muted-foreground">{t.session}</span>
                        )}
                        {t.screenshotUrl && (
                          <button
                            onClick={() => setViewingScreenshot(t.screenshotUrl!)}
                            className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors outline-none"
                            title="View chart screenshot"
                          >
                            <Camera className="h-3 w-3" weight="regular" />
                          </button>
                        )}
                      </div>
                      {t.strategy && (
                        <span className="text-[10px] text-muted-foreground/70">{t.strategy}</span>
                      )}
                    </div>
                    <span className={cn(
                      'text-[13px] font-bold font-mono tabular-nums',
                      t.pnl > 0 ? 'text-profit' : t.pnl < 0 ? 'text-loss' : 'text-foreground'
                    )}>
                      {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                    </span>
                  </div>
                  {i < recent.length - 1 && <div className="h-px bg-border/40" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isEmpty && (
          <Link to="/journal" className="text-[11px] text-muted-foreground hover:text-foreground self-end mt-3 transition-colors">
            View all →
          </Link>
        )}
      </div>
    </>
  );
}
