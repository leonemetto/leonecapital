import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { generateDemoTrades } from '@/lib/demoData';

export function useOnboarding() {
  const { profile, isLoading } = useProfile();
  const qc = useQueryClient();

  const onboardingCompleted = profile?.onboardingCompleted ?? false;
  const guideProgress: string[] = (profile?.guideProgress as any)?.sections ?? [];

  const completeOnboarding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true } as any)
      .eq('user_id', user.id);
    qc.invalidateQueries({ queryKey: ['profile'] });
  }, [qc]);

  const markSectionComplete = useCallback(async (sectionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updated = [...new Set([...guideProgress, sectionId])];
    await supabase
      .from('profiles')
      .update({ guide_progress: { sections: updated } } as any)
      .eq('user_id', user.id);
    qc.invalidateQueries({ queryKey: ['profile'] });
  }, [qc, guideProgress]);

  const provisionDemoAccount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if demo account already exists
    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'demo')
      .limit(1);

    if (existing && existing.length > 0) return;

    // Create demo account
    const { data: account, error: accError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: 'Demo Account',
        type: 'demo',
        starting_balance: 10000,
        current_balance: 10000,
        currency: 'USD',
      })
      .select()
      .single();

    if (accError || !account) return;

    // Insert demo trades
    const demoTrades = generateDemoTrades();
    const totalPnl = demoTrades.reduce((sum, t) => sum + t.pnl, 0);

    const rows = demoTrades.map(t => ({
      user_id: user.id,
      account_id: account.id,
      date: t.date,
      instrument: t.instrument,
      direction: t.direction,
      outcome: t.outcome,
      pnl: t.pnl,
      strategy: t.strategy,
      session: t.session,
      htf_bias: t.htf_bias,
      notes: t.notes,
      r_multiple: t.r_multiple,
      risk_percent: t.risk_percent,
      confidence_level: t.confidence_level,
      emotional_state: t.emotional_state,
      followed_plan: t.followed_plan,
      time_in_trade: t.time_in_trade,
    }));

    await supabase.from('trades').insert(rows);

    // Update current balance
    await supabase
      .from('accounts')
      .update({ current_balance: 10000 + totalPnl })
      .eq('id', account.id);

    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['trades'] });
  }, [qc]);

  const deleteDemoAccount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: demoAccounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'demo');

    if (!demoAccounts) return;

    for (const acc of demoAccounts) {
      await supabase.from('trades').delete().eq('account_id', acc.id);
      await supabase.from('accounts').delete().eq('id', acc.id);
    }

    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['trades'] });
  }, [qc]);

  return {
    onboardingCompleted,
    guideProgress,
    isLoading,
    completeOnboarding,
    markSectionComplete,
    provisionDemoAccount,
    deleteDemoAccount,
  };
}
