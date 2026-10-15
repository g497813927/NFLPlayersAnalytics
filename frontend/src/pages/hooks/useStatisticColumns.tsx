import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useLabels } from '../../context';
import type { PerformanceStatistic } from '../../types';

export function useStatisticColumns(): TableColumnsType<PerformanceStatistic> {
  const labels = useLabels();

  return [
    {
      title: 'Subject',
      key: 'subject',
      render: (_, statistic) => (
        <>
          <Tag>{statistic.athlete_id != null ? 'Athlete' : 'Team'}</Tag>
          {statistic.athlete_id != null
            ? labels.athlete(statistic.athlete_id)
            : labels.team(statistic.team_id)}
        </>
      ),
    },
    {
      title: 'Statistic',
      dataIndex: 'stat_definition_id',
      render: labels.stat,
    },
    {
      title: 'Value',
      dataIndex: 'stat_value',
      align: 'right',
      render: (value: number) => <strong className="score">{value}</strong>,
    },
    {
      title: 'Game',
      key: 'game',
      dataIndex: 'game_id',
      render: labels.game,
    },
  ];
}
