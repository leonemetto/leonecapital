import { useMemo, useState } from 'react';
import { Trade } from '@/types/trade';
import { getExpectancyByField, getExpectancyByPlanAdherence } from '@/lib/analytics';
import { Warning } from '@phosphor-icons/react';

export interface DashboardLeak {
  id: string;
  title: string;
  pattern: string;
  trades: number;
  winRate: number;
  pnl: number;
  impact: number;
  severity: 'critical' | 'high' | 'medium';
  note: string;
  tags: string[];
}

interface Props {
  trades: Trade[];
  disabledLeaks: Set<string>;
  onToggle: (id: string) => void;
}

function computeLeaks(trades: Trade[]): DashboardLeak[] {
  if (trades.length < 3) return [];
  const result: DashboardLeak[] = [];

  const instrumentData = getExpectancyByField(trades, 'instrument');
  for (const l of instrumentData) {
    if (l.pnl >= -50 || l.trades < 3) continue;
    result.push({
      id: `instrument-${l.key}`,
      title: `${l.key} setups`,
      pattern: `Negative expectancy · ${l.trades} trades · ${l.winRate.toFixed(0)}% win`,
      trades: l.trades,
      winRate: l.winRate,
      pnl: l.pnl,
      impact: Math.abs(l.pnl),
      severity: l.expectancy < -50 ? 'critical' : l.expectancy < -20 ? 'high' : 'medium',
      note: `Your ${l.key} trades have ${l.expectancy.toFixed(1)}R expectancy per trade. Removing them would recover $${Math.abs(l.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })} of your losses.`,
      tags: [l.key, 'Instrument'],
    });
  }

  const sessionData = getExpectancyByField(trades, 'session');
  for (const l of sessionData) {
    if (l.pnl >= -50 || l.trades < 3 || !l.key || l.key === 'Unknown') continue;
    result.push({
      id: `session-${l.key}`,
      title: `${l.key} session`,
      pattern: `Negative expectancy · ${l.trades} trades · ${l.winRate.toFixed(0)}% win`,
      trades: l.trades,
      winRate: l.winRate,
      pnl: l.pnl,
      impact: Math.abs(l.pnl),
      severity: l.expectancy < -50 ? 'critical' : l.expectancy < -20 ? 'high' : 'medium',
      note: `Your ${l.key} session has ${l.expectancy.toFixed(1)}R expectancy. Consider avoiding or reducing size during this session.`,
      tags: [l.key, 'Session'],
    });
  }

  const planData = getExpectancyByPlanAdherence(trades);
  const violated = planData.find(p => p.key === 'Plan Violated');
  if (violated && violated.pnl < -100 && violated.trades >= 3) {
    result.push({
      id: 'discipline-plan',
      title: 'Plan violations',
      pattern: `Trades where plan was not followed · ${violated.trades} trades · ${violated.winRate.toFixed(0)}% win`,
      trades: violated.trades,
      winRate: violated.winRate,
      pnl: violated.pnl,
      impact: Math.abs(violated.pnl),
      severity: Math.abs(violated.pnl) > 500 ? 'critical' : 'high',
      note: 'These are trades where you logged that you did not follow your plan. Your plan-followed trades perform significantly better.',
      tags: ['Discipline', 'Plan'],
    });
  }

  return result.sort((a, b) => b.impact - a.impact).slice(0, 6);
}

export function DashboardLeakDetection({ trades, disabledLeaks, onToggle }: Props) {
  const [openLeak, setOpenLeak] = useState<string | null>(null);
  const leaks = useMemo(() => computeLeaks(trades), [trades]);

  if (leaks.length === 0) return null;

  const totalImpact = leaks.reduce((s, l) => s + l.impact, 0);
  const activeCount = leaks.filter(l => !disabledLeaks.has(l.id)).length;

  const sevColor = (sev: DashboardLeak['severity']) =>
    sev === 'critical' ? 'var(--ef-neg)' :
    sev === 'high' ? 'oklch(0.68 0.16 55)' :
    'var(--ef-warn)';

  return (
    <div
      style={{
        background: 'var(--ef-bg-elev)',
        border: '1px solid var(--ef-line)',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--ef-line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ef-ink)' }}>
              Leak detection
            </div>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--ef-ink-3)', marginTop: 2 }}>
              toggle off → re-project equity
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', borderRadius: 999,
            background: 'var(--ef-neg-wash)',
            color: 'var(--ef-neg)',
            fontSize: 11, fontFamily: 'var(--ff-mono)',
            border: '1px solid color-mix(in oklab, var(--ef-neg) 20%, transparent)',
          }}>
            <Warning size={10} weight="fill" />
            {activeCount} active
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ef-ink-2)', lineHeight: 1.5 }}>
          These patterns cost you{' '}
          <span className="font-mono" style={{ fontWeight: 500, color: 'var(--ef-neg)' }}>
            −${totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>{' '}
          in your logged trades.
        </div>
      </div>

      {/* Leak list */}
      <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leaks.map(l => {
          const off = disabledLeaks.has(l.id);
          const isOpen = openLeak === l.id;
          return (
            <div
              key={l.id}
              onClick={() => setOpenLeak(isOpen ? null : l.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '6px 1fr auto',
                gap: 12,
                padding: '12px',
                borderRadius: 10,
                border: '1px solid var(--ef-line)',
                background: off ? 'var(--ef-bg-sunken)' : 'var(--ef-bg-elev)',
                opacity: off ? 0.5 : 1,
                cursor: 'pointer',
                transition: 'background .15s, opacity .2s',
                alignItems: 'flex-start',
              }}
            >
              {/* Severity bar */}
              <div style={{
                width: 6, borderRadius: 3, alignSelf: 'stretch', minHeight: 48,
                background: sevColor(l.severity),
              }} />

              {/* Content */}
              <div>
                <div style={{
                  fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.01em',
                  color: 'var(--ef-ink)',
                  textDecoration: off ? 'line-through' : 'none',
                  textDecorationColor: 'var(--ef-ink-4)',
                }}>
                  {l.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ef-ink-3)', marginTop: 2 }}>
                  {l.pattern}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  {l.tags.map(t => (
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
                {isOpen && (
                  <div style={{
                    fontSize: 12, color: 'var(--ef-ink-2)', lineHeight: 1.55,
                    borderTop: '1px dashed var(--ef-line)',
                    marginTop: 10, paddingTop: 8,
                  }}>
                    {l.note}
                  </div>
                )}
              </div>

              {/* Right: impact + toggle */}
              <div
                style={{ textAlign: 'right', flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); onToggle(l.id); }}
              >
                <div className="font-mono" style={{ fontSize: 14, color: 'var(--ef-neg)', fontWeight: 500 }}>
                  {off ? '+' : '−'}${l.impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>
                  {off ? 'removed' : 'active'}
                </div>
                {/* Toggle switch */}
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: 30, height: 16, borderRadius: 10,
                    background: !off ? 'var(--ef-pos)' : 'var(--ef-ink-4)',
                    position: 'relative', flexShrink: 0,
                    transition: 'background .15s',
                  }}>
                    <div style={{
                      content: '',
                      position: 'absolute', top: 2,
                      left: !off ? 14 : 2,
                      width: 12, height: 12, borderRadius: '50%',
                      background: 'white',
                      transition: 'left .15s',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { computeLeaks };
