import { FlagOutlined } from '@ant-design/icons';
import type { GameSide, MockPlay } from './types';

interface Props {
  plays: readonly MockPlay[];
  sides: GameSide[];
  onSeek: (step: number) => void;
}

export function KeyEvents({ plays, sides, onSeek }: Props) {
  const latest = plays[plays.length - 1];
  return (
    <section
      className="key-events"
      aria-label="Simulated key events"
    >
      <div className="events-heading">
        <span className="eyebrow">THE STORY OF THE DRIVE</span>
        <h2>
          Key events <FlagOutlined />
        </h2>
        <p>Every moment of a late-game comeback.</p>
      </div>
      <p
        className="sr-only"
        aria-live="polite"
      >
        {latest.title}. Q4 {latest.clock}. {latest.detail}
      </p>
      <ol className="event-list">
        {plays
          .map((play, index) => ({ play, index }))
          .reverse()
          .map(({ play, index }) => (
            <li
              key={index}
              className={play.scoring ? 'scoring-event' : ''}
            >
              <button
                type="button"
                className="event-button"
                onClick={() => onSeek(index)}
              >
                <span className="event-time">
                  Q4 <strong>{play.clock}</strong>
                </span>
                <span className="event-copy">
                  <small>
                    {sides.find((side) => side.participant_role === play.possession)?.name}
                  </small>
                  <strong>{play.title}</strong>
                  <span>{play.detail}</span>
                </span>
                {play.scoring && (
                  <span className="event-score">
                    {play.awayScore}–{play.homeScore}
                  </span>
                )}
              </button>
            </li>
          ))}
      </ol>
      <div className="events-footnote">Scripted play-by-play · tap an event to revisit it</div>
    </section>
  );
}
