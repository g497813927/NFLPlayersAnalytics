import type { GameStatus } from '../types';

/** Shared optional filters used by the browse pages. */
export type PageFilters = {
  q?: string;
  league_id?: number;
  season_id?: number;
  team_id?: number;
  athlete_id?: number;
  game_id?: number;
  stat_definition_id?: number;
  status?: GameStatus;
  date_from?: string;
};
