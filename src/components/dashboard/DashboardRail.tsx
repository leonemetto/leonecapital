import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { TradingAccount } from '@/types/account';
import { Analytics, getSessionPerformance } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Warning, Trophy, TrendDown } from '@phosphor-icons/react';

interface Props {
  trades: Trade[];
  stats: Analytics;
  accounts: TradingAccount[];
  selectedAccountId: string;
  selectedPropAccount: TradingAccount | null;
}

function RailSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-[var(--ef-ink)]">{title}</h3>
        {action && <span className="text-[11px] text-[var(--ef-ink-3)] font-mono">{action}</span>}
      </div>
      {children}
    </div>
  );
}

export function DashboardRail({ trades, stats, accounts, selectedAccountId, selectedPropAccount }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const todayTrades = useMemo(() => trades.filter(t => t.date === today), [trades, today]);
  const todayPnl = useMemo(() => todayTrades.reduce((s, t) => s + t.pnl, 0), [todayTrades]);
  const todayPositive = todayPnl >= 0;

  const sessions = useMemo(() => {
    const data = getSessionPerformance(trades).filter(s => s.total > 0);
    return data.sort((a, b) => b.winRate - a.winRate).slice(0, 4);
  }, [trades]);

  const bestSession = sessions[0]?.session || null;

  const recentTrades = useMemo(() => trades.slice(0, 6), [trades]);

  // Daily loss limit check
  const selectedAccount = useMemo(() => {
    if (selectedAccountId === '__all__') return null;
    return accounts.find(a => a.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  const dailyLossAlert = useMemo(() => {
    if (!selectedAccount?.startingBalance || todayPnl >= 0) return null;
    const maxDailyLoss = selectedPropAccount
      ? (selectedPropAccount.challengeSize ?? selectedPropAccount.startingBalance) * ((selectedPropAccount.maxDailyDdPct ?? 5) / 100)
      : selectedAccount.startingBalance * 0.05;
    const pct = Math.abs(todayPnl) / maxDailyLoss * 100;
    if (pct < 70) return null;
    return { pct: Math.min(pct, 100), breached: pct >= 100 };
  }, [selectedAccount, selectedPropAccount, todayPnl]);

  // Prop firm progress for rail
  const propProgress = useMemo(() => {
    if (!selectedPropAccount) return null;
    const size = selectedPropAccount.challengeSize ?? selectedPropAccount.startingBalance;
    const target = size * ((selectedPropAccount.profitTargetPct ?? 10) / 100);
    const maxDD = size * ((selectedPropAccount.maxTotalDdPct ?? 10) / 100);
    const pnl = trades.reduce((s, t) => s + t.pnl, 0);
    return {
      profitPct: Math.min(Math.max((pnl / target) * 100, 0), 100),
      ddPct: Math.min(Math.max((Math.max(0, -pnl) / maxDD) * 100, 0), 100),
      netPnl: pnl,
      target,
      name: selectedPropAccount.name,
      trailingDrawdown: selectedPropAccount.trailingDrawdown,
    };
  }, [selectedPropAccount, trades]);

  return (
    <div className="p-5 h-full">
      {/* Today's summary */}
      <RailSection title="Today">
        {dailyLossAlert && (
          <div className={cn(
            'flex gap-2.5 p-3 rounded-lg mb-3 text-[12px] leading-snug',
            dailyLossAlert.breached
              ? 'bg-[var(--ef-neg-wash)] border border-[color-mix(in_oklab,var(--ef-neg)_20%,transparent)]'
              : 'bg-[var(--ef-warn-wash)] border border-[color-mix(in_oklab,oklch(0.7_0.14_75)_20%,transparent)]'
          )}>
            <Warning className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--ef-neg)]" weight="fill" />
            <span className="text-[var(--ef-ink-2)]">
              <strong className="font-semibold text-[var(--ef-neg)]">
                {dailyLossAlert.breached ? 'Daily limit breached' : `Daily loss ${dailyLossAlert.pct.toFixed(0)}%`}
              </strong>
              {' '}· ${Math.abs(todayPnl).toFixed(0)} down today
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg border border-border bg-card">
            <p className="text-[10px] text-[var(--ef-ink-4)] font-mono uppercase tracking-[0.06em]">Today's P&L</p>
            <p className={cn('text-[19px] font-bold font-mono mt-1 leading-none',
              todayPositive ? 'text-[var(--ef-pos)]' : 'text-[var(--ef-neg)]'
            )}
              style={{ letterSpacing: '-0.02em' }}>
              {todayPositive ? '+' : ''}${Math.abs(todayPnl).toFixed(0)}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-card">
            <p className="text-[10px] text-[var(--ef-ink-4)] font-mono uppercase tracking-[0.06em]">Trades</p>
            <p className="text-[19px] font-bold font-mono mt-1 leading-none text-[var(--ef-ink)]"
              style={{ letterSpacing: '-0.02em' }}>
              {todayTrades.length}
              <span className="text-[13px] text-[var(--ef-ink-4)] font-normal"> today</span>
            </p>
          </div>
        </div>
      </RailSection>

      {/* Session performance */}
      {sessions.length > 0 && (
        <RailSection title="Session Performance">
          {sessions.map(s => {
            const maxPnl = Math.max(...sessions.map(x => Math.abs(x.pnl ?? 0)), 1);
            const barPct = Math.abs((s.pnl ?? 0)) / maxPnl * 46;
            const pos = (s.pnl ?? 0) >= 0;
            return (
              <div key={s.session} className="flex items-center gap-2 py-2 text-[12.5px] border-b border-border last:border-0">
                <div className="w-14 shrink-0 flex items-center gap-1">
                  <span className="text-[var(--ef-ink-2)] font-medium truncate">{s.session.split('/')[0]}</span>
                  {s.session === bestSession && <Trophy className="h-3 w-3 text-amber-500 shrink-0" weight="fill" />}
                </div>
                <div className="flex-1 h-[6px] rounded-full bg-[var(--ef-bg-sunken)] overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--ef-ink-4)] opacity-40" />
                  <div
                    className="absolute top-0 bottom-0 rounded-full"
                    style={{
                      [pos ? 'left' : 'right']: '50%',
                      width: barPct + '%',
                      background: pos ? 'var(--ef-pos)' : 'var(--ef-neg)',
                    }}
                  />
                </div>
                <div className={cn('w-12 text-right font-mono text-[11.5px] shrink-0',
                  pos ? 'text-[var(--ef-pos)]' : 'text-[var(--ef-neg)]'
                )}>
                  {pos ? '+' : ''}${s.pnl?.toFixed(0) ?? '0'}
                </div>
              </div>
            );
          })}
        </RailSection>
      )}

      {/* Recent trades */}
      {recentTrades.length > 0 && (
        <RailSection title="Recent Trades">
          {recentTrades.map(t => (
            <div key={t.id} className="flex items-center gap-2 py-2 border-b border-dashed border-border last:border-0 text-[12px]">
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono shrink-0',
                t.outcome === 'win' ? 'bg-[var(--ef-pos-wash)] text-[var(--ef-pos)]' :
                t.outcome === 'loss' ? 'bg-[var(--ef-neg-wash)] text-[var(--ef-neg)]' :
                'bg-[var(--ef-bg-sunken)] text-[var(--ef-ink-4)]'
              )}>
                {t.outcome === 'win' ? 'W' : t.outcome === 'loss' ? 'L' : 'BE'}
              </span>
              <span className="font-mono font-semibold text-[var(--ef-ink)] w-16 truncate shrink-0">{t.instrument}</span>
              <span className="text-[var(--ef-ink-3)] flex-1 truncate">{t.session || t.date}</span>
              <span className={cn('font-mono text-[11.5px] shrink-0 w-14 text-right',
                t.pnl >= 0 ? 'text-[var(--ef-pos)]' : 'text-[var(--ef-neg)]'
              )}>
                {t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(0)}
              </span>
            </div>
          ))}
        </RailSection>
      )}

      {/* Prop firm mini progress */}
      {propProgress && (
        <RailSection title={`Prop Firm · ${propProgress.name}`}>
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-[var(--ef-ink-3)]">Profit target</span>
                <span className="font-mono text-[var(--ef-ink-2)]">{propProgress.profitPct.toFixed(0)}%</span>
              </div>
              <div className="h-[5px] rounded-full bg-[var(--ef-bg-sunken)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--ef-pos)] transition-all duration-500"
                  style={{ width: propProgress.profitPct + '%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <div className="flex items-center gap-1 text-[var(--ef-ink-3)]">
                  <TrendDown className="h-3 w-3" weight="fill" />
                  <span>{propProgress.trailingDrawdown ? 'Trailing DD' : 'Max DD'} buffer</span>
                </div>
                <span className={cn('font-mono', propProgress.ddPct >= 80 ? 'text-[var(--ef-neg)]' : 'text-[var(--ef-ink-2)]')}>
                  {propProgress.ddPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-[var(--ef-bg-sunken)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: propProgress.ddPct + '%',
                    background: propProgress.ddPct >= 80 ? 'var(--ef-neg)' : 'oklch(0.7 0.14 75)',
                  }} />
              </div>
            </div>
          </div>
        </RailSection>
      )}
    </div>
  );
}
