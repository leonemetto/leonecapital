import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface DailyJournal {
  id: string;
  date: string;
  notes: string;
  keyLesson: string;
  mood: number | null;
  updatedAt: string;
}

function rowToJournal(r: any): DailyJournal {
  return {
    id: r.id,
    date: r.date,
    notes: r.notes || '',
    keyLesson: r.key_lesson || '',
    mood: r.mood ?? null,
    updatedAt: r.updated_at,
  };
}

export function useDailyJournal(date?: string) {
  const targetDate = date ?? format(new Date(), 'yyyy-MM-dd');
  const qc = useQueryClient();
  const key = ['daily_journal', targetDate];

  const { data: entry, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('daily_journals' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('date', targetDate)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToJournal(data) : null;
    },
  });

  const save = useCallback(async (fields: { notes?: string; keyLesson?: string; mood?: number | null }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('daily_journals' as any).upsert({
      user_id: user.id,
      date: targetDate,
      notes: fields.notes ?? entry?.notes ?? '',
      key_lesson: fields.keyLesson ?? entry?.keyLesson ?? '',
      mood: fields.mood !== undefined ? fields.mood : entry?.mood ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' });
    qc.invalidateQueries({ queryKey: key });
  }, [targetDate, entry, qc, key]);

  return { entry, isLoading, save };
}

export function useJournalHistory(limit = 7) {
  return useQuery({
    queryKey: ['daily_journals_history', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('daily_journals' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(rowToJournal);
    },
  });
}
