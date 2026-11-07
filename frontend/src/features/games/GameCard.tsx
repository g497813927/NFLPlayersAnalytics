import { ArrowUpOutlined } from '@ant-design/icons';
import type { Game } from '../../types';
import { FavoriteButton } from '../favorites/FavoriteButton';
import { gameDay, gameSides, gameTime, GAME_STATUS_LABELS } from './gamePresentation';
import { TeamBadge } from './TeamBadge';

interface Props {
  game: Game;
  selected: boolean;
  onSelect: () => void;
}

export function GameCard({ game, selected, onSelect }: Props) {
  return (
    <article className={`schedule-game-card${selected ? ' is-selected' : ''}`}>
      <div className="schedule-card-meta">
        <span>{gameDay(game.game_time)}</span>
        <strong className={`schedule-status status-${game.status}`}>
          {GAME_STATUS_LABELS[game.status]}
        </strong>
      </div>
      {gameSides(game).map((side) => (
        <div
          className="schedule-team"
          key={side.team_id}
        >
          <TeamBadge side={side} />
          <span>
            {side.name}
            <small>{side.participant_role}</small>
          </span>
          <FavoriteButton
            teamId={side.team_id}
            teamName={side.name}
          />
          <strong>{side.score ?? '—'}</strong>
        </div>
      ))}
      {!game.participants.length && <p>Participants pending</p>}
      <button
        type="button"
        className="schedule-open"
        aria-label={`Explore ${game.matchup || `game ${game.game_id}`}`}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <span>
          {gameTime(game.game_time)} · {game.season_name}
        </span>
        <span>
          {selected ? 'In spotlight' : 'Explore game'} <ArrowUpOutlined />
        </span>
      </button>
    </article>
  );
}
