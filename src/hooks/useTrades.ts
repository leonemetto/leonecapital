import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeFormData } from '@/types/trade';
import { generateDemoTrades } from '@/lib/seedTrades';

const STORAGE_KEY = 'edgejournal_trades';

function loadTrades(): Trade[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as any[];
    // Migrate old trades: strip removed fields, ensure new fields exist
    return parsed.map(t => ({
      id: t.id,
      date: t.date,
      instrument: t.instrument,
      direction: t.direction,
      strategy: t.strategy || '',
      session: t.session || '',
      outcome: t.outcome,
      pnl: t.pnl,
      rMultiple: t.rMultiple,
      notes: t.notes || '',
      createdAt: t.createdAt,
    }));
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
    const newTrade: Trade = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTrades(prev => [newTrade, ...prev]);
    return newTrade;
  }, []);

  const updateTrade = useCallback((id: string, data: Partial<TradeFormData>) => {
    setTrades(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        return { ...t, ...data };
      })
    );
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  const seedTrades = useCallback((newTrades: Trade[]) => {
    setTrades(prev => [...newTrades, ...prev]);
  }, []);

  const clearTrades = useCallback(() => {
    setTrades([]);
  }, []);

  return { trades, addTrade, updateTrade, deleteTrade, seedTrades, clearTrades };
}
