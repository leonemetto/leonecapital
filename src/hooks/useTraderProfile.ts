import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback } from 'react';

export interface TraderProfile {
  id: string;
  userId: string;
  tradingStyle: string;
  favoriteInstruments: string;
  favoriteSessions: string;
  accountGoals: string;
  commonMistakes: string;
  tradingRules: string;
  riskPerTrade: string;
  notes: string;
}

function rowToProfile(r: any): TraderProfile {
  return {
    id: r.id,
    userId: r.user_id,
    tradingStyle: r.trading_style || '',
    favoriteInstruments: r.favorite_instruments || '',
    favoriteSessions: r.favorite_sessions || '',
    accountGoals: r.account_goals || '',
    commonMistakes: r.common_mistakes || '',
    tradingRules: r.trading_rules || '',
    riskPerTrade: r.risk_per_trade || '',
    notes: r.notes || '',
  };
}

export function useTraderProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['trader-profile'];

  const { data: traderProfile, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('trader_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToProfile(data) : null;
    },
    enabled: !!user,
  });

  const saveProfile = useCallback(async (fields: Partial<Omit<TraderProfile, 'id' | 'userId'>>) => {
    if (!user) throw new Error('Not authenticated');

    const updates: Record<string, string> = {};
    if (fields.tradingStyle !== undefined) updates.trading_style = fields.tradingStyle;
    if (fields.favoriteInstruments !== undefined) updates.favorite_instruments = fields.favoriteInstruments;
    if (fields.favoriteSessions !== undefined) updates.favorite_sessions = fields.favoriteSessions;
    if (fields.accountGoals !== undefined) updates.account_goals = fields.accountGoals;
    if (fields.commonMistakes !== undefined) updates.common_mistakes = fields.commonMistakes;
    if (fields.tradingRules !== undefined) updates.trading_rules = fields.tradingRules;
    if (fields.riskPerTrade !== undefined) updates.risk_per_trade = fields.riskPerTrade;
    if (fields.notes !== undefined) updates.notes = fields.notes;

    if (traderProfile) {
      const { error } = await supabase
        .from('trader_profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('trader_profiles')
        .insert({ user_id: user.id, ...updates });
      if (error) throw error;
    }

    qc.invalidateQueries({ queryKey: key });
  }, [user, traderProfile, qc]);

  return { traderProfile, isLoading, saveProfile };
}
