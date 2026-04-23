import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useLeaks } from '@/contexts/LeaksContext';
import type { DashboardLeak } from '@/components/dashboard/DashboardLeakDetection';
import { getExpectancyByField } from '@/lib/analytics';
import { Warning, CheckCircle, Drop, Lightning } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const LEAK_MIN_TRADES = 15;

function SeverityBar({ sev }: { sev: DashboardLeak['severity'] }) {
  const color =
    sev === 'critical' ? 'var(--ef-neg)' :
    sev === 'high' ? 'var(--ef-warn-high)' :
    'var(--ef-warn)';
  const label =
    sev === 'critical' ? 'Critical' :
    sev === 'high' ? 'High' : 'Medium';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 999,
      background: `color-mix(in oklab, ${color} 14%, transparent)`,
      color,
      fontSize: 10.5, fontFamily: 'var(--ff-mono)', fontWeight: 500,
      border: `1px solid color-mix(in oklab, ${color} 25%, transparent)`,
    }}>
      {label}
    </span>
  );
}

function leakSimulatePath(leak: DashboardLeak): string {
  if (leak.id.startsWith('instrument-')) return `/what-if?field=instrument&key=${encodeURIComponent(leak.title.replace(' setups', ''))}`;
  if (leak.id.startsWith('session-')) return `/what-if?field=session&key=${encodeURIComponent(leak.title.replace(' session', ''))}`;
  if (leak.id === 'discipline-plan') return `/what-if?field=followedPlan&key=No`;
  return `/what-if`;
}

function LeakCard({ leak }: { leak: DashboardLeak }) {
  const [open, setOpen] = useState(false);
  const sevColor =
    leak.severity === 'critical' ? 'var(--ef-neg)' :
    leak.severity === 'high' ? 'var(--ef-warn-high)' :
    'var(--ef-warn)';

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: 'var(--ef-bg-elev)',
        border: '1px solid var(--ef-line)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color .15s',
      }}
    >
      {/* Severity accent line */}
      <div style={{ height: 3, background: sevColor }} />

      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <SeverityBar sev={leak.severity} />
              {leak.tags.map(t => (
                <span key={t} style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 7px', borderRadius: 999,
                  background: 'var(--ef-bg-sunken)', color: 'var(--ef-ink-3)',
                  fontSize: 10.5, fontFamily: 'var(--ff-mono)',
                }}>
                  {t}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ef-ink)', marginBottom: 4 }}>
              {leak.title}
            </div>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--ef-ink-3)' }}>
              {leak.pattern}
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ef-neg)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              −${leak.impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)', marginTop: 4 }}>
              {leak.trades} trades · {leak.winRate.toFixed(0)}% win
            </div>
          </div>
        </div>

        {open && (
          <div style={{
            marginTop: 12, paddingTop: 12,
            borderTop: '1px dashed var(--ef-line)',
            fontSize: 13, color: 'var(--ef-ink-2)', lineHeight: 1.6,
          }}>
            {leak.note}
          </div>
        )}

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--ef-ink-4)', fontFamily: 'var(--ff-mono)' }}>
            {open ? '▲ less' : '▼ more detail'}
          </div>
          <Link
            to={leakSimulatePath(leak)}
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--ef-bg-sunken)',
              border: '1px solid var(--ef-line)',
              color: 'var(--ef-ink-2)',
              fontSize: 11, fontWeight: 500,
              transition: 'color .1s',
            }}
          >
            <Lightning size={11} weight="bold" />
            Simulate
          </Link>
        </div>
      </div>
    </div>
  );
}

function SessionBreakdown({ trades }: { trades: any[] }) {
  const sessions = useMemo(() => getExpectancyByField(trades, 'session').filter(s => s.key && s.key !== 'Unknown' && s.trades >= 2), [trades]);
  if (sessions.length === 0) return null;
  const maxAbs = Math.max(...sessions.map(s => Math.abs(s.pnl)), 1);

  return (
    <div style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ef-ink)', marginBottom: 14 }}>Session breakdown</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.map(s => {
          const pos = s.pnl >= 0;
          const barPct = Math.abs(s.pnl) / maxAbs * 60;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="font-mono" style={{ width: 80, fontSize: 12, color: 'var(--ef-ink-2)', fontWeight: 500, flexShrink: 0 }}>{s.key}</div>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--ef-bg-sunken)', position: 'relative', overflow: 'visible' }}>
                <div style={{ position: 'absolute', left: '50%', top: -1, width: 1, height: 8, background: 'var(--ef-ink-3)' }} />
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, borderRadius: 3,
                  [pos ? 'left' : 'right']: '50%',
                  width: barPct + '%',
                  background: pos ? 'var(--ef-pos)' : 'var(--ef-neg)',
                }} />
              </div>
              <div className="font-mono" style={{ width: 60, fontSize: 11.5, color: pos ? 'var(--ef-pos)' : 'var(--ef-neg)', textAlign: 'right', flexShrink: 0 }}>
                {pos ? '+' : ''}${s.pnl.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LeakDetection() {
  const { trades } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const { leaks } = useLeaks();

  const totalImpact = leaks.reduce((s, l) => s + l.impact, 0);
  const criticalCount = leaks.filter(l => l.severity === 'critical').length;

  // Mark leaks as seen so the sidebar badge clears on visit
  useEffect(() => {
    if (trades.length >= LEAK_MIN_TRADES) {
      localStorage.setItem('leaks_last_seen_count', String(leaks.length));
    }
  }, [leaks.length, trades.length]);

  if (trades.length < LEAK_MIN_TRADES) {
    return (
      <AppLayout>
        <div style={{ paddingBottom: 12, marginBottom: 24, borderBottom: '1px solid var(--ef-line)' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>
            Leak Detection
          </h1>
          <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>
            patterns draining your edge
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, textAlign: 'center', gap: 14 }}>
          <Drop size={48} color="var(--ef-ink-4)" weight="light" />
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ef-ink)', letterSpacing: '-0.01em' }}>
            {LEAK_MIN_TRADES - trades.length} more trades to unlock
          </div>
          <div style={{ fontSize: 13, color: 'var(--ef-ink-3)', maxWidth: 360, lineHeight: 1.6 }}>
            Leak detection needs at least {LEAK_MIN_TRADES} trades to surface meaningful patterns across instruments and sessions.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ width: 160, height: 5, borderRadius: 3, background: 'var(--ef-bg-sunken)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'var(--ef-pos)',
                width: `${Math.min((trades.length / LEAK_MIN_TRADES) * 100, 100)}%`,
                transition: 'width .3s',
              }} />
            </div>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--ef-ink-4)' }}>
              {trades.length} / {LEAK_MIN_TRADES}
            </span>
          </div>
          <Link to="/add-trade" style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center',
            padding: '8px 18px', borderRadius: 24,
            background: 'var(--ef-ink)', color: 'var(--ef-bg)',
            fontSize: 13, fontWeight: 600,
          }}>
            Log Trade →
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border" style={{ paddingBottom: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>
            Leak Detection
          </h1>
          <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>
            patterns draining your edge · {trades.length} trades analysed
          </div>
        </div>

        {leaks.length > 0 && (
          <Link
            to="/what-if"
            className="flex items-center gap-1.5 outline-none transition-colors"
            style={{
              height: 34, padding: '0 14px', borderRadius: 10,
              background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
              fontSize: 13, fontWeight: 500, color: 'var(--ef-ink-2)',
            }}
          >
            Run What-If →
          </Link>
        )}
      </div>

      {leaks.length === 0 ? (
        /* No leaks state */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 340, textAlign: 'center', gap: 12,
        }}>
          <CheckCircle size={48} color="var(--ef-pos)" weight="light" />
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ef-ink)', letterSpacing: '-0.01em' }}>
            No significant leaks found
          </div>
          <div style={{ fontSize: 13, color: 'var(--ef-ink-3)', maxWidth: 340, lineHeight: 1.6 }}>
            {trades.length < 10
              ? `Log at least 10 trades for leak detection to work. You have ${trades.length} so far.`
              : 'Your logged trade patterns don\'t show any negative-expectancy segments above the threshold. Keep it up.'}
          </div>
          {trades.length < 10 && (
            <Link to="/add-trade" style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center',
              padding: '8px 18px', borderRadius: 24,
              background: 'var(--ef-pos)', color: 'white',
              fontSize: 13, fontWeight: 600,
            }}>
              Log Trade →
            </Link>
          )}
        </div>
      ) : (
        <div className="leak-grid"
        >
          {/* Left: summary + leak cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Summary bar */}
            <div style={{
              display: 'flex', gap: 0,
              border: '1px solid var(--ef-line)', borderRadius: 12, overflow: 'hidden',
              background: 'var(--ef-bg-elev)',
            }}>
              <div style={{ flex: 1, padding: '16px 20px', borderRight: '1px solid var(--ef-line)' }}>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total loss</div>
                <div className="font-mono" style={{ fontSize: 26, fontWeight: 600, color: 'var(--ef-neg)', letterSpacing: '-0.02em', marginTop: 4 }}>
                  −${totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div style={{ flex: 1, padding: '16px 20px', borderRight: '1px solid var(--ef-line)' }}>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leaks found</div>
                <div className="font-mono" style={{ fontSize: 26, fontWeight: 600, color: 'var(--ef-ink)', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {leaks.length}
                </div>
              </div>
              <div style={{ flex: 1, padding: '16px 20px' }}>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ef-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Critical</div>
                <div className="font-mono" style={{ fontSize: 26, fontWeight: 600, color: criticalCount > 0 ? 'var(--ef-neg)' : 'var(--ef-ink-3)', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {criticalCount}
                </div>
              </div>
            </div>

            {/* Leak cards */}
            {leaks.map(l => <LeakCard key={l.id} leak={l} />)}
          </div>

          {/* Right rail: session + tip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SessionBreakdown trades={trades} />

            <div style={{
              background: 'var(--ef-neg-wash)',
              border: '1px solid color-mix(in oklab, var(--ef-neg) 20%, transparent)',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Warning size={14} color="var(--ef-neg)" weight="fill" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ef-neg)' }}>How leaks are detected</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ef-ink-2)', lineHeight: 1.6 }}>
                A pattern is flagged when a segment (instrument, session, or plan adherence) has 3+ trades and a net loss below −$50. Leaks are sorted by total impact.
              </div>
              <div style={{ marginTop: 10 }}>
                <Link to="/what-if" style={{ fontSize: 12, color: 'var(--ef-pos)', fontWeight: 500 }}>
                  Simulate removing them →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
