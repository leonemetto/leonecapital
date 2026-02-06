import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeFormData } from '@/types/trade';

const STORAGE_KEY = 'edgejournal_trades';

function loadTrades(): Trade[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>(loadTrades);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  const addTrade = useCallback((data: TradeFormData) => {
    const slDistance = Math.abs(data.entryPrice - data.stopLoss);
    const tpDistance = Math.abs(data.takeProfit - data.entryPrice);
    const rrRatio = slDistance > 0 ? tpDistance / slDistance : 0;
    const rMultiple = data.riskAmount > 0 ? data.pnl / data.riskAmount : 0;
    const outcome: Trade['outcome'] =
      data.pnl > 0 ? 'win' : data.pnl < 0 ? 'loss' : 'breakeven';

    const newTrade: Trade = {
      ...data,
      id: crypto.randomUUID(),
      rrRatio: isFinite(rrRatio) ? Number(rrRatio.toFixed(2)) : 0,
      rMultiple: isFinite(rMultiple) ? Number(rMultiple.toFixed(2)) : 0,
      outcome,
      createdAt: new Date().toISOString(),
    };

    setTrades(prev => [newTrade, ...prev]);
    return newTrade;
  }, []);

  const updateTrade = useCallback((id: string, data: Partial<TradeFormData>) => {
    setTrades(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...data };
        const slDistance = Math.abs(updated.entryPrice - updated.stopLoss);
        const tpDistance = Math.abs(updated.takeProfit - updated.entryPrice);
        updated.rrRatio = slDistance > 0 ? Number((tpDistance / slDistance).toFixed(2)) : 0;
        updated.rMultiple = updated.riskAmount > 0 ? Number((updated.pnl / updated.riskAmount).toFixed(2)) : 0;
        updated.outcome = updated.pnl > 0 ? 'win' : updated.pnl < 0 ? 'loss' : 'breakeven';
        return updated;
      })
    );
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  return { trades, addTrade, updateTrade, deleteTrade };
}
