import { useMemo, useState } from 'react';
import { Trade } from '@/types/trade';
import { getExpectancyByField } from '@/lib/analytics';
import { Warning, ArrowsClockwise } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

interface Props { trades: Trade[] }

type Severity = 'critical' | 'warning' | 'minor';

function getSeverity(expectancy: number, total: number): Severity {
  if (expectancy < -80 || (expectancy < -40 && total >= 5)) return 'critical';
  if (expectancy < -25) return 'warning';
  return 'minor';
}

const SEV_CONFIG: Record<Severity, { label: string; barColor: string; badgeBg: string; badgeColor: string }> = {
  critical: {
    label: 'Critical',
    barColor: 'var(--ef-neg)',
    badgeBg: 'var(--ef-neg-wash)',
    badgeColor: 'var(--ef-neg)',
  },
  warning: {
    label: 'Warning',
    barColor: 'oklch(0.68 0.16 55)',
    badgeBg: 'color-mix(in oklab, oklch(0.68 0.16 55) 12%, transparent)',
    badgeColor: 'oklch(0.68 0.16 55)',
  },
  minor: {
    label: 'Minor',
    barColor: 'oklch(0.76 0.14 75)',
    badgeBg: 'var(--ef-warn-wash)',
    badgeColor: 'oklch(0.68 0.14 75)',
  },
};

export function TopLeaks({ trades }: Props) {
  const [disabled, setDisabled] = useState<Set<string>>(new Set());

  const leaks = useMemo(() => {
    if (trades.length < 3) return [];
    const byInstrument = getExpectancyByField(trades, 'instrument');
    const bySession = getExpectancyByField(trades, 'session');
    const combined = [...byInstrument, ...bySession]
      .filter(s => s.expectancy < 0 && s.total >= 3 && s.pnl < 0);
    return combined.sort((a, b) => a.pnl - b.pnl).slice(0, 5);
  }, [trades]);

  const totalImpact = leaks.reduce((s, l) => s + l.pnl, 0);

  const recoveryAmount = leaks
    .filter(l => disabled.has(l.key))
    .reduce((s, l) => s + Math.abs(l.pnl), 0);

  const toggleLeak = (key: string) => {
    setDisabled(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      className="rounded-[14px] border border-border bg-card flex flex-col"
      style={{ overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--ef-line)' }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ef-ink)' }}>
              Leak detection
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 12, color: 'var(--ef-ink-3)', marginTop: 2 }}
            >
              toggle off → re-project equity
            </div>
          </div>
          {leaks.length > 0 && (
            <div
              className="flex items-center gap-1 font-mono shrink-0"
              style={{
                fontSize: 11, color: 'var(--ef-neg)',
                background: 'var(--ef-neg-wash)',
                padding: '3px 8px', borderRadius: 999,
              }}
            >
              <Warning size={10} weight="fill" />
              {leaks.length} active
            </div>
          )}
        </div>

        {leaks.length > 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--ef-ink-2)', marginTop: 10, lineHeight: 1.5 }}>
            These patterns cost you{' '}
            <span className="font-mono" style={{ color: 'var(--ef-neg)', fontWeight: 500 }}>
              −${Math.abs(totalImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>{' '}
            in logged trades.
          </div>
        )}

        {/* Recovery projection */}
        {recoveryAmount > 0 && (
          <div
            className="flex items-center gap-2 font-mono"
            style={{
              marginTop: 10, padding: '8px 12px',
              background: 'var(--ef-pos-wash)',
              border: '1px solid color-mix(in oklab, var(--ef-pos) 20%, transparent)',
              borderRadius: 8, fontSize: 12,
            }}
          >
            <ArrowsClockwise size={12} weight="bold" style={{ color: 'var(--ef-pos)', flexShrink: 0 }} />
            <span style={{ color: 'var(--ef-ink-2)' }}>
              Estimated recovery:{' '}
              <span style={{ color: 'var(--ef-pos)', fontWeight: 600 }}>
                +${recoveryAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              {' '}if removed
            </span>
          </div>
        )}
      </div>

      {/* Leak list */}
      <div
        className="flex-1 flex flex-col gap-[10px]"
        style={{ padding: '16px 20px', overflowY: 'auto' }}
      >
        {leaks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center font-mono"
            style={{ padding: '40px 0', color: 'var(--ef-ink-4)', fontSize: 12.5, textAlign: 'center' }}
          >
            <div style={{ marginBottom: 4 }}>No leaks detected</div>
            <div style={{ fontSize: 11, color: 'var(--ef-ink-4)' }}>Log more trades to enable analysis</div>
          </div>
        ) : leaks.map(leak => {
          const isOff = disabled.has(leak.key);
          const sev = getSeverity(leak.expectancy, leak.total);
          const { label: sevLabel, barColor, badgeBg, badgeColor } = SEV_CONFIG[sev];

          return (
            <div
              key={leak.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '6px 1fr auto',
                gap: 14,
                padding: 14,
                borderRadius: 10,
                border: '1px solid var(--ef-line)',
                background: isOff
                  ? 'color-mix(in oklab, var(--ef-bg-sunken) 60%, transparent)'
                  : 'var(--ef-bg-elev)',
                alignItems: 'flex-start',
                opacity: isOff ? 0.55 : 1,
                transition: 'opacity 0.2s, background 0.2s',
              }}
            >
              {/* Severity bar */}
              <div
                style={{
                  width: 6,
                  minHeight: 44,
                  borderRadius: 3,
                  alignSelf: 'stretch',
                  background: isOff ? 'var(--ef-line)' : barColor,
                  transition: 'background 0.2s',
                }}
              />

              {/* Label + tags */}
              <div>
                <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 3 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ef-ink)' }}>
                    {leak.key}
                  </div>
                  {/* Severity badge */}
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: isOff ? 'var(--ef-bg-sunken)' : badgeBg,
                      color: isOff ? 'var(--ef-ink-4)' : badgeColor,
                      border: `1px solid ${isOff ? 'var(--ef-line)' : `color-mix(in oklab, ${badgeColor} 25%, transparent)`}`,
                    }}
                  >
                    {isOff ? 'removed' : sevLabel}
                  </div>
                </div>
                <div
                  className="font-mono"
                  style={{ color: 'var(--ef-ink-3)', fontSize: 11.5, marginTop: 2 }}
                >
                  {leak.total} trades · {leak.winRate.toFixed(0)}% win
                </div>
              </div>

              {/* Impact + toggle */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 14,
                    color: isOff ? 'var(--ef-ink-4)' : 'var(--ef-neg)',
                    fontWeight: 500,
                    textDecoration: isOff ? 'line-through' : 'none',
                  }}
                >
                  −${Math.abs(leak.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 10.5, color: 'var(--ef-ink-3)' }}
                >
                  {leak.expectancy.toFixed(0)}$/trade
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggleLeak(leak.key)}
                  aria-label={isOff ? 'Re-enable leak' : 'Disable leak'}
                  style={{
                    width: 32, height: 18, borderRadius: 9,
                    background: isOff ? 'var(--ef-line)' : 'var(--ef-pos)',
                    position: 'relative',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: isOff ? 2 : 14,
                      width: 14, height: 14,
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.18s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex justify-end"
        style={{ padding: '10px 20px', borderTop: '1px dashed var(--ef-line)' }}
      >
        <Link
          to="/analyst"
          className="font-mono hover:text-[var(--ef-ink)] transition-colors"
          style={{ fontSize: 11.5, color: 'var(--ef-ink-3)' }}
        >
          Full analysis →
        </Link>
      </div>
    </div>
  );
}
