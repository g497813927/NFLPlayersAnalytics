import { useMemo } from 'react';
import type { Labels, MaybeId } from '../types';
import { athleteName, shortDate } from '../utils/format';
import { useData } from './useData';

export function useLabels(): Labels {
  const { lookups } = useData();
  return useMemo(() => {
    const label =
      <T>(rows: T[], id: (row: T) => number, name: (row: T) => string) =>
      (value: MaybeId): string => {
        const row = rows.find((item) => id(item) === value);
        return row ? name(row) : value == null ? '—' : `#${value}`;
      };
    const team = label(
      lookups.teams,
      (row) => row.team_id,
      (row) => row.team_name,
    );
    const season = label(
      lookups.seasons,
      (row) => row.season_id,
      (row) => row.season_name,
    );
    return {
      team,
      season,
      athlete: label(lookups.athletes, (row) => row.athlete_id, athleteName),
      league: label(
        lookups.leagues,
        (row) => row.league_id,
        (row) => row.league_name,
      ),
      venue: label(
        lookups.venues,
        (row) => row.venue_id,
        (row) => row.venue_name,
      ),
      stat: label(
        lookups.stat_definitions,
        (row) => row.stat_definition_id,
        (row) => row.stat_name,
      ),
      roster: label(
        lookups.rosters,
        (row) => row.roster_id,
        (row) => `${team(row.team_id)} · ${season(row.season_id)}`,
      ),
      game: label(
        lookups.games,
        (row) => row.game_id,
        (row) => {
          const teams = (row.participants || [])
            .map((participant) => team(participant.team_id))
            .join(' vs ');
          return `${teams || `Game #${row.game_id}`} · ${shortDate(row.game_time)}`;
        },
      ),
    };
  }, [lookups]);
}
