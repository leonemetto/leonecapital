import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trade, TradeFormData } from '@/types/trade';

const BUCKET = 'trade-screenshots';

export async function uploadTradeScreenshot(userId: string, tradeId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${tradeId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function getScreenshotUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteTradeScreenshot(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

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
    rMultiple: r.r_multiple != null ? Number(r.r_multiple) : undefined,
    riskPercent: r.risk_percent != null ? Number(r.risk_percent) : undefined,
    htfBias: r.htf_bias || undefined,
    emotionalState: r.emotional_state != null ? Number(r.emotional_state) : undefined,
    confidenceLevel: r.confidence_level != null ? Number(r.confidence_level) : undefined,
    timeInTrade: r.time_in_trade != null ? Number(r.time_in_trade) : undefined,
    followedPlan: r.followed_plan != null ? Boolean(r.followed_plan) : undefined,
    notes: r.notes || '',
    accountId: r.account_id ?? undefined,
    screenshotUrl: r.screenshot_url ?? undefined,
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
      r_multiple: form.rMultiple ?? null,
      risk_percent: form.riskPercent ?? null,
      htf_bias: form.htfBias || '',
      emotional_state: form.emotionalState ?? null,
      confidence_level: form.confidenceLevel ?? null,
      time_in_trade: form.timeInTrade ?? null,
      followed_plan: form.followedPlan ?? null,
      screenshot_url: form.screenshotUrl ?? null,
    } as any).select().single();

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
    if (form.rMultiple !== undefined) updates.r_multiple = form.rMultiple ?? null;
    if (form.riskPercent !== undefined) updates.risk_percent = form.riskPercent ?? null;
    if (form.htfBias !== undefined) updates.htf_bias = form.htfBias || '';
    if (form.emotionalState !== undefined) updates.emotional_state = form.emotionalState ?? null;
    if (form.confidenceLevel !== undefined) updates.confidence_level = form.confidenceLevel ?? null;
    if (form.timeInTrade !== undefined) updates.time_in_trade = form.timeInTrade ?? null;
    if (form.followedPlan !== undefined) updates.followed_plan = form.followedPlan ?? null;
    if (form.screenshotUrl !== undefined) updates.screenshot_url = form.screenshotUrl ?? null;

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
