import type { TableColumnsType } from 'antd';
import { athleteName, gameDate, shortDate, useLabels } from '../context';
import { StatusTag } from '../components';
import type { EditableResource, GameStatus, ManagementRow } from '../types';

export function useManagementColumns(entity: EditableResource): TableColumnsType<ManagementRow> {
  const labels = useLabels();
  const columns: Record<EditableResource, TableColumnsType<ManagementRow>> = {
    teams: [
      { title: 'Team', dataIndex: 'team_name' },
      { title: 'City', dataIndex: 'city' },
      { title: 'League', dataIndex: 'league_id', render: labels.league },
    ],
    athletes: [
      { title: 'Athlete', render: (_, row) => athleteName(row) },
      {
        title: 'Nationality',
        dataIndex: 'nationality',
        render: (value: string | null) => value || '—',
      },
    ],
    rosters: [
      { title: 'Team', dataIndex: 'team_id', render: labels.team },
      { title: 'Season', dataIndex: 'season_id', render: labels.season },
    ],
    memberships: [
      { title: 'Athlete', dataIndex: 'athlete_id', render: labels.athlete },
      { title: 'Roster', dataIndex: 'roster_id', render: labels.roster },
      { title: 'Position', dataIndex: 'position' },
      {
        title: 'Jersey',
        dataIndex: 'jersey_number',
        render: (value: string | null) => value ?? '—',
      },
      { title: 'From', dataIndex: 'start_date', render: shortDate },
      { title: 'Until', dataIndex: 'end_date', render: shortDate },
    ],
    games: [
      { title: 'Game', dataIndex: 'game_id', render: labels.game },
      { title: 'Date & time', dataIndex: 'game_time', render: gameDate },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (value: GameStatus) => <StatusTag status={value} />,
      },
    ],
    'performance-statistics': [
      {
        title: 'Subject',
        render: (_, row) =>
          row.athlete_id != null ? labels.athlete(row.athlete_id) : labels.team(row.team_id),
      },
      { title: 'Statistic', dataIndex: 'stat_definition_id', render: labels.stat },
      { title: 'Value', dataIndex: 'stat_value' },
      { title: 'Game', dataIndex: 'game_id', render: labels.game },
    ],
  };
  return columns[entity];
}
