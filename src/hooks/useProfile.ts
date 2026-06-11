import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface Profile {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  createdAt: string;
  onboardingCompleted: boolean;
  guideProgress: { sections: string[] };
}

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
const PROFILE_KEY = ['profile'] as const;

function deriveNickname(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  const fromMeta = [meta.full_name, meta.name, meta.given_name, meta.nickname]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim();
  const fromEmail = (user.email ?? '').split('@')[0]?.replace(/[._-]/g, ' ').trim() ?? '';
  const raw = fromMeta || fromEmail || 'Trader';
  return (raw.split(/\s+/)[0] || 'Trader').slice(0, 30);
}

function rowToProfile(data: ProfileRow): Profile {
  return {
    id: data.id,
    userId: data.user_id,
    nickname: data.nickname,
    avatarUrl: data.avatar_url || '',
    createdAt: data.created_at,
    onboardingCompleted: data.onboarding_completed ?? false,
    guideProgress: (data.guide_progress as Profile['guideProgress'] | null) ?? { sections: [] },
  };
}

export function useProfile() {
  const qc = useQueryClient();
  const key = PROFILE_KEY;

  const { data: profile, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .upsert(
            { user_id: user.id, nickname: deriveNickname(user) },
            { onConflict: 'user_id' }
          )
          .select('*')
          .single();

        if (createError) throw createError;
        return rowToProfile(created);
      }

      return rowToProfile(data);
    },
  });

  const setNickname = useCallback(async (nickname: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (updated) {
      qc.setQueryData(key, rowToProfile(updated));
      return;
    }

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, nickname })
      .select('*')
      .single();

    if (createError) throw createError;
    qc.setQueryData(key, rowToProfile(created));
  }, [qc, key]);

  const updateAvatarUrl = useCallback(async (avatarUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', user.id);

    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc, key]);

  return { profile, isLoading, setNickname, updateAvatarUrl };
}
