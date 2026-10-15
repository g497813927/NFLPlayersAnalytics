import { useState } from 'react';
import { Card, Select, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { PageHeading, ResourceTable } from '../components';
import { useData, useLabels } from '../context';
import type { Standing } from '../types';
import { useList } from './hooks/useList';

export function StandingsPage() {
  const { lookups } = useData();
  const labels = useLabels();
  const [seasonId, setSeasonId] = useState<number | null>(null);
  const selectedSeason = seasonId ?? lookups.seasons[0]?.season_id;
  const listing = useList('standings', { season_id: selectedSeason });
  const columns: TableColumnsType<Standing> = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      width: 90,
      render: (rank: number) => (
        <span className={`rank ${rank === 1 ? 'rank-first' : ''}`}>{rank}</span>
      ),
    },
    {
      title: 'Team',
      dataIndex: 'team_id',
      render: (teamId: number, standing) => (
        <strong>{standing.team_name || labels.team(teamId)}</strong>
      ),
    },
    { title: 'Wins', dataIndex: 'wins', align: 'right' },
    { title: 'Losses', dataIndex: 'losses', align: 'right' },
    { title: 'Ties', dataIndex: 'ties', align: 'right' },
    {
      title: 'Win %',
      dataIndex: 'win_percentage',
      align: 'right',
      render: (value: number) => (
        <strong className="score">{(Number(value || 0) * 100).toFixed(1)}%</strong>
      ),
    },
    { title: 'Points', dataIndex: 'points', align: 'right' },
  ];

  return (
    <>
      <PageHeading
        title="Standings"
        description="A season-wide view of team results, updated when game results change."
      />
      <Card className="data-card">
        <div className="filter-bar">
          <Select<number>
            aria-label="Season"
            placeholder="Select season"
            value={selectedSeason}
            options={lookups.seasons.map((season) => ({
              value: season.season_id,
              label: season.season_name,
            }))}
            onChange={setSeasonId}
          />
          <Tag color="cyan">Basic demo standings</Tag>
        </div>
        <ResourceTable {...listing} rowKey="standing_id" columns={columns} />
        <div className="table-footnote">
          Completed games only. Win % = (wins + ½ ties) ÷ games played. Equal percentages share a
          rank. Official NFL tiebreakers are deferred.
        </div>
      </Card>
    </>
  );
}
