import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { getExpectancyByField } from '@/lib/analytics';
import { Warning } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

interface Props { trades: Trade[] }

function sevColor(expectancy: number) {
  if (expectancy < -80) return 'var(--ef-neg)';
  if (expectancy < -25) return 'oklch(0.68 0.16 55)';
  return 'oklch(0.76 0.14 75)';
}

export function TopLeaks({ trades }: Props) {
  const leaks = useMemo(() => {
    if (trades.length < 3) return [];
    const byInstrument = getExpectancyByField(trades, 'instrument');
    const bySession = getExpectancyByField(trades, 'session');
    const combined = [...byInstrument, ...bySession]
      .filter(s => s.expectancy < 0 && s.total >= 3 && s.pnl < 0);
    return combined.sort((a, b) => a.pnl - b.pnl).slice(0, 5);
  }, [trades]);

  const totalImpact = leaks.reduce((s, l) => s + l.pnl, 0);

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
            <span
              className="font-mono"
              style={{ color: 'var(--ef-neg)', fontWeight: 500 }}
            >
              −${Math.abs(totalImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>{' '}
            in logged trades.
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
        ) : leaks.map(leak => (
          <div
            key={`${leak.key}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '6px 1fr auto',
              gap: 14,
              padding: 14,
              borderRadius: 10,
              border: '1px solid var(--ef-line)',
              background: 'var(--ef-bg-elev)',
              alignItems: 'flex-start',
            }}
          >
            {/* Severity bar */}
            <div
              style={{
                width: 6,
                minHeight: 44,
                borderRadius: 3,
                alignSelf: 'stretch',
                background: sevColor(leak.expectancy),
              }}
            />

            {/* Label + tags */}
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ef-ink)' }}>
                {leak.key}
              </div>
              <div
                className="font-mono"
                style={{ color: 'var(--ef-ink-3)', fontSize: 11.5, marginTop: 2 }}
              >
                {leak.total} trades · {leak.winRate.toFixed(0)}% win
              </div>
            </div>

            {/* Impact */}
            <div style={{ textAlign: 'right' }}>
              <div
                className="font-mono"
                style={{ fontSize: 14, color: 'var(--ef-neg)', fontWeight: 500 }}
              >
                −${Math.abs(leak.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 10.5, color: 'var(--ef-ink-3)', marginTop: 2 }}
              >
                {leak.expectancy.toFixed(0)}$/trade
              </div>
            </div>
          </div>
        ))}
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
