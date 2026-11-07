import type { Game, GameParticipant, GameStatus, Lookups } from '../../types';
import type { GameSide } from './types';

const TEAM_COLORS = ['#c85a35', '#4c73ce', '#9761b2', '#218b78', '#b57d20', '#cf5276'];

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  scheduled: 'Upcoming',
  in_progress: 'In progress',
  completed: 'Final',
  cancelled: 'Cancelled',
};

export function gameSides(game: Game): GameSide[] {
  return (['away', 'home'] as const).flatMap((role) => {
    const participant: GameParticipant | undefined = game.participants.find(
      (item) => item.participant_role === role,
    );
    if (!participant) return [];
    const name = participant.team_name || `Team ${participant.team_id}`;
    return [
      {
        ...participant,
        name,
        initials: name
          .split(/\s+/)
          .slice(0, 3)
          .map((word) => word[0])
          .join('')
          .toUpperCase(),
        color: TEAM_COLORS[(participant.team_id - 1) % TEAM_COLORS.length],
      },
    ];
  });
}

export function supportsFootballDemo(game: Game, lookups: Lookups): boolean {
  const season = lookups.seasons.find((item) => item.season_id === game.season_id);
  const league = lookups.leagues.find((item) => item.league_id === season?.league_id);
  const sport = lookups.sports.find((item) => item.sport_id === league?.sport_id);
  return (
    game.status !== 'cancelled' &&
    gameSides(game).length === 2 &&
    /^(american football|football)$/i.test(sport?.sport_name || '')
  );
}

export function gameDay(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function gameTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
