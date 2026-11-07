import type { Game } from '../../types';
import type { GameFilters } from './types';

export const EMPTY_GAME_FILTERS: GameFilters = { view: 'all', query: '', dateFrom: '' };

/** Lookups already contain every game; filter the complete dataset before paginating. */
export function filterGames(games: Game[], filters: GameFilters, favoriteIds: number[]): Game[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return games
    .filter((game) => {
      if (filters.seasonId !== undefined && game.season_id !== filters.seasonId) return false;
      if (filters.status && game.status !== filters.status) return false;
      if (
        filters.teamId !== undefined &&
        !game.participants.some((p) => p.team_id === filters.teamId)
      )
        return false;
      if (
        filters.view === 'favorites' &&
        !game.participants.some((p) => favoriteIds.includes(p.team_id))
      )
        return false;
      if (
        filters.dateFrom &&
        new Date(game.game_time).toISOString().slice(0, 10) < filters.dateFrom
      )
        return false;
      return (
        !query || game.participants.some((p) => p.team_name?.toLocaleLowerCase().includes(query))
      );
    })
    .sort(
      (left, right) =>
        Date.parse(right.game_time) - Date.parse(left.game_time) || left.game_id - right.game_id,
    );
}
