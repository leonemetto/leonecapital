import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TraderGoals {
  dailyTarget: number | null;
  weeklyTarget: number | null;
  monthlyTarget: number | null;
  maxDailyLoss: number | null;
}

const KEY = ['trader_goals'];

export function useGoals() {
  const qc = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('trader_goals' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) return null;
      return {
        dailyTarget: data.daily_target ?? null,
        weeklyTarget: data.weekly_target ?? null,
        monthlyTarget: data.monthly_target ?? null,
        maxDailyLoss: data.max_daily_loss ?? null,
      } as TraderGoals;
    },
  });

  const save = useCallback(async (g: Partial<TraderGoals>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('trader_goals' as any).upsert({
      user_id: user.id,
      daily_target: g.dailyTarget ?? null,
      weekly_target: g.weeklyTarget ?? null,
      monthly_target: g.monthlyTarget ?? null,
      max_daily_loss: g.maxDailyLoss ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    qc.invalidateQueries({ queryKey: KEY });
  }, [qc]);

  return { goals, isLoading, save };
}
