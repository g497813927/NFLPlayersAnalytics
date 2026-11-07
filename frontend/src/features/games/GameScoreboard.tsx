import type { CSSProperties } from 'react';
import type { Game } from '../../types';
import { GAME_STATUS_LABELS, gameDay, gameTime } from './gamePresentation';
import { GameTeamScore } from './GameTeamScore';
import type { GameSide, MockPlay } from './types';

interface Props {
  game: Game;
  sides: GameSide[];
  frame: MockPlay | null;
  playing: boolean;
}

export function GameScoreboard({ game, sides, frame, playing }: Props) {
  const colorStyle = {
    '--away-color': sides[0]?.color || '#c85a35',
    '--home-color': sides[1]?.color || '#4c73ce',
  } as CSSProperties;

  return (
    <div
      className="game-scoreboard"
      style={colorStyle}
    >
      <div className="scoreboard-topline">
        <span>
          {game.season_name || 'Football'} · {gameDay(game.game_time)}
        </span>
        <span className="scoreboard-source">{frame ? 'Scripted demo' : 'Saved result'}</span>
      </div>
      <div className="scoreboard-matchup">
        {sides[0] && (
          <GameTeamScore
            side={sides[0]}
            score={frame ? frame.awayScore : sides[0].score}
            possession={Boolean(frame && !frame.final && frame.possession === 'away')}
          />
        )}
        <div className="scoreboard-clock">
          {frame ? (
            <>
              <span className={`mock-live-label${playing ? ' is-playing' : ''}`}>
                <i /> MOCK LIVE
              </span>
              <strong>{frame.final ? 'Final' : `Q4 · ${frame.clock}`}</strong>
              <span>{frame.final ? 'Demo complete' : playing ? 'Playing' : 'Paused'}</span>
            </>
          ) : (
            <>
              <span className="eyebrow">GAME STATUS</span>
              <strong>{GAME_STATUS_LABELS[game.status]}</strong>
              <span>{gameTime(game.game_time)}</span>
            </>
          )}
        </div>
        {sides[1] && (
          <GameTeamScore
            side={sides[1]}
            score={frame ? frame.homeScore : sides[1].score}
            possession={Boolean(frame && !frame.final && frame.possession === 'home')}
          />
        )}
      </div>
      {!sides.length && <p className="scoreboard-pending">Participants have not been assigned.</p>}
      <div className="scoreboard-venue">{game.venue_name || 'Venue to be confirmed'}</div>
    </div>
  );
}
