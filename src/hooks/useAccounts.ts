import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TradingAccount, AccountFormData } from '@/types/account';

function rowToAccount(r: any): TradingAccount {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    startingBalance: Number(r.starting_balance),
    currentBalance: Number(r.current_balance),
    currency: r.currency,
    createdAt: r.created_at,
  };
}

export function useAccounts() {
  const qc = useQueryClient();
  const key = ['accounts'];

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToAccount);
    },
  });

  const addAccount = useCallback(async (form: AccountFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('accounts').insert({
      user_id: user.id,
      name: form.name,
      type: form.type,
      starting_balance: form.startingBalance,
      current_balance: form.currentBalance,
      currency: form.currency,
    }).select().single();

    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
    return rowToAccount(data);
  }, [qc]);

  const updateAccount = useCallback(async (id: string, form: Partial<AccountFormData>) => {
    const updates: any = {};
    if (form.name !== undefined) updates.name = form.name;
    if (form.type !== undefined) updates.type = form.type;
    if (form.startingBalance !== undefined) updates.starting_balance = form.startingBalance;
    if (form.currentBalance !== undefined) updates.current_balance = form.currentBalance;
    if (form.currency !== undefined) updates.currency = form.currency;

    const { error } = await supabase.from('accounts').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  const deleteAccount = useCallback(async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  return { accounts, addAccount, updateAccount, deleteAccount, isLoading };
}
