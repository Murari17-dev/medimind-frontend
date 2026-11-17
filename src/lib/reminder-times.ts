import type { Medication } from './types';

const pad = (value: number) => String(value).padStart(2, '0');

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => formatDate(new Date());

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

export const prettyTime = (value: string) => String(value).slice(0, 5);

export const getDeviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
};

// Used only as editable starting points when a prescription says "Morning".
const PERIOD_DEFAULTS: Record<string, string> = {
  morning: '08:00',
  afternoon: '14:00',
  night: '20:00',
};

const FREQUENCY_DEFAULTS: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['06:00', '12:00', '18:00', '22:00'],
};

export function parseClock(value: string): string | null {
  const s = value.trim();

  let m = s.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);

  if (m) {
    let h = Number(m[1]);
    const minute = Number(m[2]);
    const ap = m[3]?.toUpperCase();

    if (minute > 59 || h > 23 || (ap && (h < 1 || h > 12))) return null;

    if (ap) h = (h % 12) + (ap === 'PM' ? 12 : 0);

    return `${pad(h)}:${pad(minute)}`;
  }

  m = s.match(/^(\d{1,2})\s*([AP]M)$/i);

  if (m) {
    let h = Number(m[1]);

    if (h < 1 || h > 12) return null;

    h = (h % 12) + (m[2].toUpperCase() === 'PM' ? 12 : 0);

    return `${pad(h)}:00`;
  }

  return null;
}

export function suggestedTimes(med: Pick<Medication, 'times_of_day' | 'frequency_per_day'>): {
  times: string[];
  needsReview: boolean;
} {
  const entries = med.times_of_day || [];

  const exact = entries.map(parseClock).filter((v): v is string => !!v);
  const fromPeriods = entries
    .map((entry) => PERIOD_DEFAULTS[entry.trim().toLowerCase()])
    .filter((v): v is string => !!v);

  if (exact.length && !fromPeriods.length) {
    return { times: [...new Set(exact)].sort(), needsReview: false };
  }

  if (exact.length || fromPeriods.length) {
    return { times: [...new Set([...exact, ...fromPeriods])].sort(), needsReview: true };
  }

  const count = Math.max(1, Math.min(6, Number(med.frequency_per_day) || 1));

  const times =
    FREQUENCY_DEFAULTS[count] ||
    Array.from({ length: count }, (_, i) => {
      const minutes = 8 * 60 + Math.round((14 * 60 * i) / Math.max(1, count - 1));
      return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
    });

  return { times, needsReview: true };
}
