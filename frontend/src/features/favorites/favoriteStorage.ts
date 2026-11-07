export const FAVORITES_KEY = 'nfl-analytics.favorite-teams.v1';

export function parseFavorites(value: string | null): number[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0))]
      : [];
  } catch {
    return [];
  }
}

export function readFavorites(): { teamIds: number[]; storageAvailable: boolean } {
  try {
    return { teamIds: parseFavorites(localStorage.getItem(FAVORITES_KEY)), storageAvailable: true };
  } catch {
    return { teamIds: [], storageAvailable: false };
  }
}
