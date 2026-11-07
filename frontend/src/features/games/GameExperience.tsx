import { useState } from 'react';
import { Button, Segmented } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useData } from '../../context';
import type { Game } from '../../types';
import { gameSides, supportsFootballDemo } from './gamePresentation';
import { useMockGame } from './useMockGame';
import { DriveField } from './DriveField';
import { GameScoreboard } from './GameScoreboard';
import { KeyEvents } from './KeyEvents';
import { LowKeyImpact } from './LowKeyImpact';
import { PlaybackControls } from './PlaybackControls';
import { QuarterScores } from './QuarterScores';
import { SavedGameStats } from './SavedGameStats';

interface Props {
  game: Game;
  onDetails: () => void;
}

export function GameExperience({ game, onDetails }: Props) {
  const { lookups } = useData();
  const eligible = supportsFootballDemo(game, lookups);
  const [mode, setMode] = useState<'saved' | 'demo'>(eligible ? 'demo' : 'saved');
  const demo = mode === 'demo' && eligible;
  const replay = useMockGame(demo);
  const sides = gameSides(game);

  return (
    <section
      className="game-experience"
      aria-label="Game spotlight"
    >
      <div className="game-experience-heading">
        <div>
          <span className="eyebrow">IN THE SPOTLIGHT</span>
          <h2>{demo ? 'A game can turn in a moment.' : 'The game, at a glance.'}</h2>
        </div>
        <Segmented<'saved' | 'demo'>
          aria-label="Game display mode"
          value={demo ? 'demo' : 'saved'}
          onChange={setMode}
          options={[
            { value: 'saved', label: 'Saved game' },
            { value: 'demo', label: 'Mock live', disabled: !eligible },
          ]}
        />
      </div>
      <div className="game-experience-grid">
        <div className="game-main-panel">
          <GameScoreboard
            game={game}
            sides={sides}
            frame={demo ? replay.frame : null}
            playing={replay.playing}
          />
          {demo ? (
            <>
              <DriveField
                frame={replay.frame}
                sides={sides}
              />
              <QuarterScores
                sides={sides}
                frame={replay.frame}
              />
              <PlaybackControls replay={replay} />
            </>
          ) : (
            <div className="saved-game-note">
              <h3>
                {game.status === 'scheduled'
                  ? 'The next chapter is still to come.'
                  : 'Every number has a story.'}
              </h3>
              <p>
                {game.status === 'scheduled'
                  ? 'Scores will appear here once they are recorded. Explore the matchup or try the fictional live demo.'
                  : 'Explore the recorded result and player statistics for this matchup.'}
              </p>
              <Button onClick={onDetails}>
                View game record <ArrowRightOutlined />
              </Button>
            </div>
          )}
        </div>
        <div className="game-side-panel">
          {demo ? (
            <>
              <KeyEvents
                plays={replay.plays}
                sides={sides}
                onSeek={replay.seek}
              />
              <LowKeyImpact
                step={replay.step}
                sides={sides}
              />
            </>
          ) : (
            <SavedGameStats
              game={game}
              sides={sides}
            />
          )}
        </div>
      </div>
      <div className="game-experience-footer">
        <p>
          {demo
            ? 'Mock live uses a fictional final drive with these teams. Plays and scores are simulated; saved results stay unchanged.'
            : 'Scores and statistics are saved database records. No real-time sports feed is connected.'}
        </p>
        {demo && (
          <Button
            type="text"
            size="small"
            onClick={onDetails}
          >
            View saved record <ArrowRightOutlined />
          </Button>
        )}
      </div>
    </section>
  );
}
