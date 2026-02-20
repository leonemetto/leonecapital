import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type OptionType = 'instruments' | 'confirmations';

const DEFAULT_INSTRUMENTS = [
  'XAUUSD', 'NAS100', 'US30', 'SPX500', 'EUR/USD', 'GBP/USD', 'USD/JPY',
  'GBP/JPY', 'AUD/USD', 'USD/CAD', 'BTC/USD', 'ETH/USD', 'SOL/USD',
];

const DEFAULT_CONFIRMATIONS = ['CISD', 'IFVG', 'Both'];

export function useCustomOptions() {
  const [instruments, setInstruments] = useState<string[]>(DEFAULT_INSTRUMENTS);
  const [confirmations, setConfirmations] = useState<string[]>(DEFAULT_CONFIRMATIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('trader_profiles')
        .select('notes')
        .eq('user_id', user.id)
        .single();

      if (data?.notes) {
        try {
          const parsed = JSON.parse(data.notes);
          if (parsed.__customOptions) {
            if (parsed.__customOptions.instruments?.length) {
              setInstruments([...DEFAULT_INSTRUMENTS, ...parsed.__customOptions.instruments.filter(
                (i: string) => !DEFAULT_INSTRUMENTS.includes(i)
              )]);
            }
            if (parsed.__customOptions.confirmations?.length) {
              setConfirmations([...DEFAULT_CONFIRMATIONS, ...parsed.__customOptions.confirmations.filter(
                (c: string) => !DEFAULT_CONFIRMATIONS.includes(c)
              )]);
            }
          }
        } catch { /* notes field not JSON, ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveOptions(type: OptionType, allOptions: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const defaults = type === 'instruments' ? DEFAULT_INSTRUMENTS : DEFAULT_CONFIRMATIONS;
      const custom = allOptions.filter(o => !defaults.includes(o));

      // Read existing notes to preserve other data
      const { data: existing } = await supabase
        .from('trader_profiles')
        .select('notes')
        .eq('user_id', user.id)
        .single();

      let existingCustom: Record<string, string[]> = {};
      if (existing?.notes) {
        try {
          const parsed = JSON.parse(existing.notes);
          if (parsed.__customOptions) existingCustom = parsed.__customOptions;
        } catch { /* not JSON */ }
      }

      const updated = { ...existingCustom, [type]: custom };
      const notesPayload = JSON.stringify({ __customOptions: updated });

      await supabase
        .from('trader_profiles')
        .upsert({ user_id: user.id, notes: notesPayload }, { onConflict: 'user_id' });
    } catch (e) {
      console.error('Failed to save custom options', e);
    }
  }

  const addInstrument = useCallback(async (value: string) => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed || instruments.includes(trimmed)) return;
    const next = [...instruments, trimmed];
    setInstruments(next);
    await saveOptions('instruments', next);
  }, [instruments]);

  const addConfirmation = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || confirmations.includes(trimmed)) return;
    const next = [...confirmations, trimmed];
    setConfirmations(next);
    await saveOptions('confirmations', next);
  }, [confirmations]);

  return { instruments, confirmations, addInstrument, addConfirmation, loading };
}
