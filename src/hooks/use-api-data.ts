import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { apiJson, fetcher } from '@/lib/api';
import type { DueReminder, Prescription, Reminder } from '@/lib/types';

export const PRESCRIPTIONS_KEY = '/api/v1/prescriptions';
export const REMINDERS_KEY = '/api/v1/reminders';
export const DUE_REMINDERS_KEY = '/api/v1/reminders/due';

// Tab screens stay mounted, so refetch when a tab regains focus, but skip the
// first focus because the initial request is already in flight.
function useRevalidateOnFocus(revalidate: () => unknown) {
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) {
        void revalidate();
      }
      hasFocused.current = true;
    }, [revalidate]),
  );
}

export function usePrescriptions() {
  const swr = useSWR<Prescription[]>(PRESCRIPTIONS_KEY, fetcher);
  useRevalidateOnFocus(swr.mutate);
  return swr;
}

export function useReminders() {
  const swr = useSWR<Reminder[]>(REMINDERS_KEY, fetcher);
  useRevalidateOnFocus(swr.mutate);
  return swr;
}

export function useDueReminders() {
  const swr = useSWR<DueReminder[]>(DUE_REMINDERS_KEY, fetcher, {
    refreshInterval: 60_000,
    shouldRetryOnError: false,
  });

  const acknowledge = useCallback(
    async (item: DueReminder) => {
      const claim = await apiJson<{ claimed: boolean; claim_token?: string }>(
        `${REMINDERS_KEY}/${item.id}/claim`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduled_for: item.scheduled_for }),
        },
      );

      if (claim.claimed && claim.claim_token) {
        await apiJson(
          `${REMINDERS_KEY}/${item.id}/acknowledge?claim_token=${encodeURIComponent(claim.claim_token)}`,
          { method: 'POST' },
        );
      }

      await swr.mutate();
    },
    [swr],
  );

  return { ...swr, acknowledge };
}

export function refreshPrescriptions() {
  return globalMutate(PRESCRIPTIONS_KEY);
}

export function refreshReminders() {
  return Promise.all([globalMutate(REMINDERS_KEY), globalMutate(DUE_REMINDERS_KEY)]);
}

export function clearAllCachedData() {
  return globalMutate(() => true, undefined, { revalidate: false });
}
