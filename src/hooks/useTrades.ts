import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trade, TradeFormData } from '@/types/trade';

function rowToTrade(r: any): Trade {
  return {
    id: r.id,
    date: r.date,
    instrument: r.instrument,
    direction: r.direction,
    strategy: r.strategy || '',
    session: r.session || '',
    outcome: r.outcome,
    pnl: Number(r.pnl),
    notes: r.notes || '',
    accountId: r.account_id ?? undefined,
    createdAt: r.created_at,
  };
}

export function useTrades() {
  const qc = useQueryClient();
  const key = ['trades'];

  const { data: trades = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToTrade);
    },
  });

  const addTrade = useCallback(async (form: TradeFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('trades').insert({
      user_id: user.id,
      date: form.date,
      instrument: form.instrument,
      direction: form.direction,
      strategy: form.strategy,
      session: form.session,
      outcome: form.outcome,
      pnl: form.pnl,
      notes: form.notes,
      account_id: form.accountId || null,
    }).select().single();

    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
    return rowToTrade(data);
  }, [qc]);

  const updateTrade = useCallback(async (id: string, form: Partial<TradeFormData>) => {
    const updates: any = {};
    if (form.date !== undefined) updates.date = form.date;
    if (form.instrument !== undefined) updates.instrument = form.instrument;
    if (form.direction !== undefined) updates.direction = form.direction;
    if (form.strategy !== undefined) updates.strategy = form.strategy;
    if (form.session !== undefined) updates.session = form.session;
    if (form.outcome !== undefined) updates.outcome = form.outcome;
    if (form.pnl !== undefined) updates.pnl = form.pnl;
    if (form.notes !== undefined) updates.notes = form.notes;
    if (form.accountId !== undefined) updates.account_id = form.accountId || null;

    const { error } = await supabase.from('trades').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  const deleteTrade = useCallback(async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  return { trades, addTrade, updateTrade, deleteTrade, isLoading };
}
