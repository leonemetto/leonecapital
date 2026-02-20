import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TradeVerification {
  tradeId: string;
  checks: Record<string, boolean>;
}

export function useTradeVerifications(tradeIds: string[]) {
  return useQuery({
    queryKey: ['trade_verifications', tradeIds],
    enabled: tradeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trade_verifications')
        .select('trade_id, checks')
        .in('trade_id', tradeIds);
      if (error) throw error;
      const map: Record<string, Record<string, boolean>> = {};
      for (const row of data ?? []) {
        map[row.trade_id] = (row.checks as Record<string, boolean>) ?? {};
      }
      return map;
    },
  });
}
