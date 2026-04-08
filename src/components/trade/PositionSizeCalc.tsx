import { useState, useMemo } from 'react';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSharedTrades } from '@/contexts/TradesContext';
import { cn } from '@/lib/utils';
import { Calculator, CaretDown, CaretUp } from '@phosphor-icons/react';

const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]';
const INPUT = 'w-full h-9 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 text-sm font-mono text-white placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-[rgba(255,255,255,0.25)] transition-colors';

export function PositionSizeCalc() {
  const { accounts } = useSharedAccounts();
  const { trades } = useSharedTrades();
  const [open, setOpen] = useState(false);

  // Derive live balance from first account
  const account = accounts[0];
  const liveBalance = useMemo(() => {
    if (!account) return 0;
    const pnl = trades.filter(t => t.accountId === account.id).reduce((s, t) => s + t.pnl, 0);
    return account.currentBalance + pnl;
  }, [account, trades]);

  const [balance, setBalance] = useState('');
  const [riskPct, setRiskPct] = useState('1');
  const [stopPips, setStopPips] = useState('');
  const [pipValue, setPipValue] = useState('10'); // $ per pip per lot (standard for most pairs)

  const effectiveBalance = parseFloat(balance) || liveBalance;
  const riskAmount = effectiveBalance * (parseFloat(riskPct) / 100);
  const lots = stopPips && pipValue
    ? riskAmount / (parseFloat(stopPips) * parseFloat(pipValue))
    : null;

  const miniLots = lots ? lots * 10 : null;
  const microLots = lots ? lots * 100 : null;
  const units = lots ? lots * 100000 : null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[11px] font-medium text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)] transition-colors outline-none px-1"
      >
        <Calculator className="h-3.5 w-3.5" weight="regular" />
        Position size calculator
        <CaretDown className="h-3 w-3" weight="bold" />
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-3.5 w-3.5 text-[rgba(255,255,255,0.3)]" weight="regular" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">
            Position Size Calculator
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors outline-none"
        >
          <CaretUp className="h-3 w-3" weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className={LABEL}>Account Balance ($)</p>
          <input
            type="number"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder={effectiveBalance > 0 ? effectiveBalance.toFixed(0) : '10000'}
            className={cn(INPUT, 'mt-1')}
          />
          {liveBalance > 0 && !balance && (
            <p className="text-[10px] text-[rgba(255,255,255,0.2)] mt-1">Auto: ${liveBalance.toFixed(0)}</p>
          )}
        </div>
        <div>
          <p className={LABEL}>Risk %</p>
          <div className="flex gap-1 mt-1">
            {['0.5', '1', '2'].map(v => (
              <button
                key={v}
                onClick={() => setRiskPct(v)}
                className={cn(
                  'flex-1 h-9 rounded-lg text-xs font-semibold border transition-all outline-none',
                  riskPct === v
                    ? 'bg-white text-black border-transparent'
                    : 'border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-white hover:border-[rgba(255,255,255,0.25)]'
                )}
              >{v}%</button>
            ))}
          </div>
        </div>
        <div>
          <p className={LABEL}>Stop Loss (pips)</p>
          <input
            type="number"
            value={stopPips}
            onChange={e => setStopPips(e.target.value)}
            placeholder="e.g. 20"
            className={cn(INPUT, 'mt-1')}
          />
        </div>
        <div>
          <p className={LABEL}>Pip Value ($/lot)</p>
          <input
            type="number"
            value={pipValue}
            onChange={e => setPipValue(e.target.value)}
            placeholder="10"
            className={cn(INPUT, 'mt-1')}
          />
          <p className="text-[10px] text-[rgba(255,255,255,0.2)] mt-1">USD pairs = $10</p>
        </div>
      </div>

      {lots !== null && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)] mb-1">Risk Amount</p>
            <p className="text-[16px] font-bold font-mono text-[#f87171]">${riskAmount.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)] mb-1">Standard Lots</p>
            <p className="text-[16px] font-bold font-mono text-white">{lots.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)] mb-1">Mini Lots</p>
            <p className="text-[16px] font-bold font-mono text-white">{miniLots!.toFixed(1)}</p>
          </div>
          <div className="rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] p-3 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)] mb-1">Micro Lots</p>
            <p className="text-[16px] font-bold font-mono text-white">{microLots!.toFixed(0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
