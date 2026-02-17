import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface TraderProfile {
  tradingStyle: string;
  favoriteInstruments: string;
  favoriteSessions: string;
  accountGoals: string;
  commonMistakes: string;
  tradingRules: string;
  riskPerTrade: string;
  mentalTriggers: string;
  notes: string;
  behavioralMemory: any[];
}

function rowToProfile(row: any): TraderProfile {
  return {
    tradingStyle: row.trading_style || '',
    favoriteInstruments: row.favorite_instruments || '',
    favoriteSessions: row.favorite_sessions || '',
    accountGoals: row.account_goals || '',
    commonMistakes: row.common_mistakes || '',
    tradingRules: row.trading_rules || '',
    riskPerTrade: row.risk_per_trade || '',
    mentalTriggers: row.mental_triggers || '',
    notes: row.notes || '',
    behavioralMemory: Array.isArray(row.behavioral_memory) ? row.behavioral_memory : [],
  };
}

export function useTraderProfile() {
  const { user } = useAuth();
  const [traderProfile, setTraderProfile] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('trader_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data && !error) setTraderProfile(rowToProfile(data));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const saveProfile = async (profile: Omit<TraderProfile, 'behavioralMemory'>) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      trading_style: profile.tradingStyle,
      favorite_instruments: profile.favoriteInstruments,
      favorite_sessions: profile.favoriteSessions,
      account_goals: profile.accountGoals,
      common_mistakes: profile.commonMistakes,
      trading_rules: profile.tradingRules,
      risk_per_trade: profile.riskPerTrade,
      mental_triggers: profile.mentalTriggers,
      notes: profile.notes,
    };
    const { data, error } = await supabase
      .from('trader_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (data && !error) setTraderProfile(rowToProfile(data));
    if (error) throw error;
  };

  return { traderProfile, loading, saveProfile };
}
