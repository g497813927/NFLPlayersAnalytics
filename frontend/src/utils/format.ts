import type { Athlete } from '../types';

export const athleteName = (
  athlete: Partial<Pick<Athlete, 'first_name' | 'last_name'>> | null | undefined,
) => [athlete?.first_name, athlete?.last_name].filter(Boolean).join(' ');
export const shortDate = (value: string | null | undefined) =>
  value
    ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value).toLocaleDateString(
        undefined,
        { month: 'short', day: 'numeric', year: 'numeric' },
      )
    : '—';
export const gameDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
