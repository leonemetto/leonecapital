import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSignedUrl(path: string | undefined) {
  return useQuery({
    queryKey: ['signed_url', path],
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from('trade-screenshots')
        .createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!path,
    staleTime: 50 * 60 * 1000, // refresh before 60min token expires
  });
}
