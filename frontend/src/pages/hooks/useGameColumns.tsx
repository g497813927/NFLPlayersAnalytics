import type { TableColumnsType } from 'antd';
import { StatusTag } from '../../components';
import { gameDate, useLabels } from '../../context';
import type { Game, GameStatus } from '../../types';

export function useGameColumns(onOpen: (game: Game) => void): TableColumnsType<Game> {
  const labels = useLabels();

  return [
    {
      title: 'Matchup',
      key: 'matchup',
      render: (_, game) => {
        const away = game.participants.find((item) => item.participant_role === 'away');
        const home = game.participants.find((item) => item.participant_role === 'home');
        const title =
          home && away
            ? `${labels.team(away.team_id)} at ${labels.team(home.team_id)}`
            : game.matchup || `Game #${game.game_id}`;

        return (
          <button className="text-button" onClick={() => onOpen(game)}>
            {title}
          </button>
        );
      },
    },
    {
      title: 'Date & time',
      dataIndex: 'game_time',
      render: gameDate,
    },
    {
      title: 'Season',
      key: 'season',
      dataIndex: 'season_id',
      render: labels.season,
    },
    {
      title: 'Result',
      key: 'result',
      render: (_, game) => {
        const away = game.participants.find((item) => item.participant_role === 'away');
        const home = game.participants.find((item) => item.participant_role === 'home');

        return home?.score != null && away?.score != null ? (
          <span className="score">
            {away.score} – {home.score}
          </span>
        ) : (
          <span className="muted">Pending</span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: GameStatus) => <StatusTag status={status} />,
    },
  ];
}
