import { FavoriteButton } from '../favorites/FavoriteButton';
import { TeamBadge } from './TeamBadge';
import type { GameSide } from './types';

interface Props {
  side: GameSide;
  score: number | null;
  possession: boolean;
}

export function GameTeamScore({ side, score, possession }: Props) {
  return (
    <div className="game-team-score">
      <div className="game-team-heading">
        <TeamBadge side={side} />
        <FavoriteButton
          teamId={side.team_id}
          teamName={side.name}
        />
      </div>
      <strong className="game-score-number">{score ?? '—'}</strong>
      <h3>{side.name}</h3>
      <span className="game-team-role">
        {side.participant_role}
        {possession && <span className="possession-label">● Possession</span>}
      </span>
    </div>
  );
}
