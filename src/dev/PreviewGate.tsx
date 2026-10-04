import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { buildPreviewTrades, previewAccounts, previewCriteria, previewGoals, previewProfile } from './fixtures';

/**
 * Dev-only. Seeds the query cache with sample data and renders the signed-in
 * app without an account, so screens can be checked visually. Reached with
 * `?preview` on any app URL while running `npm run dev`; add `&empty` for the
 * first-run state. Never part of a production build.
 */
export default function PreviewGate({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  useState(() => {
    const empty = new URLSearchParams(window.location.search).has('empty') || sessionStorage.getItem('ef-preview-empty') === '1';
    if (new URLSearchParams(window.location.search).has('empty')) sessionStorage.setItem('ef-preview-empty', '1');
    if (new URLSearchParams(window.location.search).has('full')) sessionStorage.removeItem('ef-preview-empty');
    const isEmpty = empty && !new URLSearchParams(window.location.search).has('full');

    const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
    const seeds: [unknown[], unknown][] = [
      [['trades'], isEmpty ? [] : buildPreviewTrades()],
      [['accounts'], previewAccounts],
      [['profile'], previewProfile],
      [['criteria_settings'], previewCriteria],
      [['trader_goals'], previewGoals],
      [['daily_journals'], isEmpty ? {} : {
        [yesterday]: { date: yesterday, notes: 'Took the London open cleanly, then forced one in New York.', keyLesson: 'Stop after two losses.', mood: 3 },
      }],
      [['subscription', undefined], { id: 'pv-sub', plan: 'pro', status: 'active', current_period_end: null }],
    ];
    for (const [key, data] of seeds) {
      qc.setQueryDefaults(key, { staleTime: Infinity, gcTime: Infinity, retry: false });
      qc.setQueryData(key, data);
    }
    return true;
  });

  return <>{children}</>;
}
