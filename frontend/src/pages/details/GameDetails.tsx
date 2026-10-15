import { Descriptions } from 'antd';
import { StatusTag } from '../../components';
import { gameDate, useLabels } from '../../context';
import type { Game } from '../../types';
import { MatchupPanel } from './MatchupPanel';

export function GameDetails({ game }: { game: Game }) {
  const labels = useLabels();

  return (
    <>
      <Descriptions
        bordered
        size="small"
        column={2}
        items={[
          { key: 'date', label: 'Date & time', children: gameDate(game.game_time) },
          { key: 'season', label: 'Season', children: labels.season(game.season_id) },
          { key: 'venue', label: 'Venue', children: labels.venue(game.venue_id) },
          { key: 'status', label: 'Status', children: <StatusTag status={game.status} /> },
        ]}
      />
      <MatchupPanel participants={game.participants} />
    </>
  );
}
