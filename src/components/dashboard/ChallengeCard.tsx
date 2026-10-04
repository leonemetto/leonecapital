import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import type { Trade } from '@/types/trade';
import type { TradingAccount } from '@/types/account';
import { getAccountTargetProgress } from '@/lib/accountProgress';
import { useSettings } from '@/contexts/SettingsContext';
import { Meter, Pill, Stat, Surface } from '@/components/ef/primitives';
import { fmtMoney, fmtPct, fmtSignedMoney, toneOf } from '@/lib/format';

function ChallengeCard({ account, trades, wide }: { account: TradingAccount; trades: Trade[]; wide: boolean }) {
  const { countBreakevenInWinRate } = useSettings();
  const challengeSize = account.challengeSize && account.challengeSize > 0 ? account.challengeSize : account.startingBalance;
  const startDate = account.challengeStartDate ?? account.createdAt?.slice(0, 10);
  const progressStats = useMemo(() => getAccountTargetProgress(account, trades), [account, trades]);
  const challengeTrades = progressStats.trades;
  const netPnl = challengeTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const wins = challengeTrades.filter(trade => trade.outcome === 'win').length;
  const losses = challengeTrades.filter(trade => trade.outcome === 'loss').length;
  const winRateDenom = countBreakevenInWinRate ? challengeTrades.length : wins + losses;
  const winRate = winRateDenom > 0 ? (wins / winRateDenom) * 100 : 0;
  const target = progressStats.target;
  const progress = progressStats.progress;
  const start = startDate ? new Date(startDate) : new Date();
  const elapsedDays = Math.max(0, Math.ceil((Date.now() - start.getTime()) / 86_400_000));
  const daysLeft = Math.max(0, 30 - elapsedDays);
  const funded = progress >= 100 || netPnl >= target;

  return (
    <article className="min-w-0 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="m-0 truncate text-[14px] font-medium text-ef-ink">{account.name}</h3>
          <span className="ef-num shrink-0 text-[12px] text-ef-ink-3">
            {fmtMoney(challengeSize)}{account.quantity > 1 ? ` ×${account.quantity}` : ''}
          </span>
        </div>
        <Pill tone={funded ? 'pos' : 'flat'}>{funded ? 'Target reached' : 'In progress'}</Pill>
      </div>
      <div className={wide ? 'mt-4 grid gap-x-10 gap-y-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-end' : 'mt-4 flex flex-col gap-4'}>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Profit / loss" value={fmtSignedMoney(netPnl)} tone={toneOf(netPnl)} />
          <Stat label="Win rate" value={challengeTrades.length ? fmtPct(winRate) : '—'} />
          <Stat label="Days left" value={String(daysLeft)} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
            <span className="text-ef-ink-3">Toward the {fmtMoney(target)} target</span>
            <span className="ef-num text-ef-ink-2">{progress.toFixed(1)}%</span>
          </div>
          <Meter value={progress} max={100} tone={funded ? 'pos' : 'ink'} label={`Progress toward the profit target: ${progress.toFixed(1)}%`} />
        </div>
      </div>
    </article>
  );
}

/** Prop-firm challenge progress for up to two accounts. */
export function ActiveChallenges({ accounts, trades }: { accounts: TradingAccount[]; trades: Trade[] }) {
  const propAccounts = accounts.filter(account => account.type === 'prop').slice(0, 2);
  if (propAccounts.length === 0) return null;

  return (
    <Surface>
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <p className="ef-label m-0">Challenges</p>
        <Link to="/accounts" className="inline-flex items-center gap-1 text-[12px] text-ef-ink-3 underline-offset-2 hover:text-ef-ink hover:underline">
          All accounts <ArrowUpRight className="h-3 w-3" weight="bold" />
        </Link>
      </div>
      <div className={propAccounts.length > 1 ? 'grid grid-cols-1 divide-y divide-ef-line md:grid-cols-2 md:divide-x md:divide-y-0' : ''}>
        {propAccounts.map(account => (
          <ChallengeCard key={account.id} account={account} trades={trades} wide={propAccounts.length === 1} />
        ))}
      </div>
    </Surface>
  );
}
