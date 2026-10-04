import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyJournal {
  /** "YYYY-MM-DD" */
  date: string;
  notes: string;
  keyLesson: string;
  /** 1 (tilted) to 5 (sharp), or null when not set. */
  mood: number | null;
}

const KEY = ['daily_journals'];

/**
 * Session notes, one per calendar day. daily_journals is not in the generated
 * types yet, hence the casts (same approach as useGoals).
 */
export function useDailyJournals() {
  const qc = useQueryClient();

  const { data: journals = {}, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {} as Record<string, DailyJournal>;
      const { data, error } = await supabase
        .from('daily_journals' as any)
        .select('date, notes, key_lesson, mood')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(400);
      if (error) throw error;
      const map: Record<string, DailyJournal> = {};
      for (const row of (data ?? []) as any[]) {
        map[row.date] = {
          date: row.date,
          notes: row.notes ?? '',
          keyLesson: row.key_lesson ?? '',
          mood: row.mood ?? null,
        };
      }
      return map;
    },
  });

  const save = useCallback(async (entry: DailyJournal) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('daily_journals' as any).upsert(
      {
        user_id: user.id,
        date: entry.date,
        notes: entry.notes,
        key_lesson: entry.keyLesson,
        mood: entry.mood,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' },
    );
    if (error) throw error;
    qc.invalidateQueries({ queryKey: KEY });
  }, [qc]);

  return { journals, isLoading, save };
}

/** True when the day has anything written. */
export function hasJournalContent(j: DailyJournal | undefined): boolean {
  return !!j && (j.notes.trim().length > 0 || j.keyLesson.trim().length > 0 || j.mood != null);
}
