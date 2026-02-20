import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CriteriaSetting {
  id: string;
  label: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

const DEFAULT_CRITERIA = [
  { label: 'Less than 2h POI', category: 'Timeframe', sort_order: 0 },
  { label: 'Clear DOL (Draw on Liquidity)', category: 'Liquidity', sort_order: 1 },
  { label: 'Risk-to-Reward >1:2', category: 'Risk', sort_order: 2 },
  { label: 'Higher Timeframe Alignment', category: 'Trend', sort_order: 3 },
  { label: 'ICT Kill Zone Active', category: 'Session', sort_order: 4 },
  { label: 'No News in Next 30min', category: 'Risk', sort_order: 5 },
];

function rowToCriteria(r: any): CriteriaSetting {
  return {
    id: r.id,
    label: r.label,
    category: r.category,
    isActive: r.is_active,
    sortOrder: r.sort_order,
  };
}

export function useCriteria() {
  const qc = useQueryClient();
  const key = ['criteria_settings'];

  const { data: criteria = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('criteria_settings' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToCriteria);
    },
  });

  const addCriteria = useCallback(async (label: string, category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const maxOrder = criteria.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const { error } = await supabase.from('criteria_settings' as any).insert({
      user_id: user.id,
      label,
      category,
      is_active: true,
      sort_order: maxOrder + 1,
    });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [criteria, qc]);

  const updateCriteria = useCallback(async (id: string, updates: Partial<{ label: string; category: string; isActive: boolean }>) => {
    const dbUpdates: any = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    const { error } = await supabase.from('criteria_settings' as any).update(dbUpdates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  const deleteCriteria = useCallback(async (id: string) => {
    const { error } = await supabase.from('criteria_settings' as any).delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  const seedDefaults = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const rows = DEFAULT_CRITERIA.map(c => ({
      user_id: user.id,
      label: c.label,
      category: c.category,
      is_active: true,
      sort_order: c.sort_order,
    }));
    const { error } = await supabase.from('criteria_settings' as any).insert(rows);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  const activeCriteria = criteria.filter(c => c.isActive);

  return { criteria, activeCriteria, isLoading, addCriteria, updateCriteria, deleteCriteria, seedDefaults };
}
