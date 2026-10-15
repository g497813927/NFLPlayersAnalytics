import { useState } from 'react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Input } from 'antd';
import type { TableColumnsType } from 'antd';
import { FilterSelect, PageHeading, ResourceTable } from '../components';
import { useData, useLabels } from '../context';
import type { Team } from '../types';
import type { PageFilters } from './filters';
import { useList } from './hooks/useList';
import { RecordDrawer } from './RecordDrawer';

export function TeamsPage() {
  const { lookups } = useData();
  const labels = useLabels();
  const [filters, setFilters] = useState<PageFilters>({});
  const [selected, setSelected] = useState<Team | null>(null);
  const listing = useList('teams', filters);
  const columns: TableColumnsType<Team> = [
    {
      title: 'Team',
      dataIndex: 'team_name',
      render: (name: string, team) => (
        <button className="text-button" onClick={() => setSelected(team)}>
          <span className="record-avatar">
            {name
              .split(' ')
              .map((word) => word[0])
              .slice(0, 2)
              .join('')}
          </span>
          {name}
        </button>
      ),
    },
    { title: 'City', dataIndex: 'city' },
    { title: 'League', dataIndex: 'league_id', render: labels.league },
    {
      title: '',
      key: 'view',
      render: (_, team) => (
        <Button
          type="text"
          onClick={() => setSelected(team)}
          icon={<ArrowRightOutlined />}
          aria-label={`View ${team.team_name}`}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Teams"
        description="Meet the league. Open a team to see its seasonal rosters and players."
      />
      <Card className="data-card">
        <div className="filter-bar">
          <Input.Search
            allowClear
            placeholder="Search team or city"
            aria-label="Search team or city"
            onSearch={(q) => setFilters((current) => ({ ...current, q }))}
          />
          <FilterSelect
            label="All leagues"
            options={lookups.leagues.map((league) => ({
              value: league.league_id,
              label: league.league_name,
            }))}
            onChange={(league_id) => setFilters((current) => ({ ...current, league_id }))}
          />
        </div>
        <ResourceTable {...listing} rowKey="team_id" columns={columns} />
      </Card>
      <RecordDrawer kind="team" record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
