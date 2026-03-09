import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  createdAt: string;
  onboardingCompleted: boolean;
  guideProgress: { sections: string[] };
}

export function useProfile() {
  const qc = useQueryClient();
  const key = ['profile'];

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
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        nickname: data.nickname,
        avatarUrl: (data as any).avatar_url || '',
        createdAt: data.created_at,
      } as Profile;
    },
  });

  const setNickname = useCallback(async (nickname: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, nickname }, { onConflict: 'user_id' });

    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  const updateAvatarUrl = useCallback(async (avatarUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl } as any)
      .eq('user_id', user.id);

    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  }, [qc]);

  const needsNickname = !isLoading && profile === null;

  return { profile, isLoading, needsNickname, setNickname, updateAvatarUrl };
}
