import { useState } from 'react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Input } from 'antd';
import type { TableColumnsType } from 'antd';
import { FilterSelect, PageHeading, ResourceTable } from '../components';
import { athleteName, useData } from '../context';
import type { Athlete } from '../types';
import type { PageFilters } from './filters';
import { useList } from './hooks/useList';
import { RecordDrawer } from './RecordDrawer';

export function AthletesPage() {
  const { lookups } = useData();
  const [filters, setFilters] = useState<PageFilters>({});
  const [selected, setSelected] = useState<Athlete | null>(null);
  const listing = useList('athletes', filters);
  const columns: TableColumnsType<Athlete> = [
    {
      title: 'Athlete',
      key: 'name',
      render: (_, athlete) => (
        <button className="text-button" onClick={() => setSelected(athlete)}>
          <span className="record-avatar athlete-avatar">
            {athlete.first_name[0]}
            {athlete.last_name[0]}
          </span>
          {athleteName(athlete)}
        </button>
      ),
    },
    {
      title: 'Nationality',
      dataIndex: 'nationality',
      render: (value: string | null) => value || '—',
    },
    {
      title: '',
      key: 'view',
      align: 'right',
      render: (_, athlete) => (
        <Button type="link" onClick={() => setSelected(athlete)}>
          View profile <ArrowRightOutlined />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Athletes"
        description="Find a player, trace their team history, and explore their performance."
      />
      <Card className="data-card">
        <div className="filter-bar">
          <Input.Search
            allowClear
            placeholder="Search athlete name"
            aria-label="Search athlete name"
            onSearch={(q) => setFilters((current) => ({ ...current, q }))}
          />
          <FilterSelect
            label="All teams"
            options={lookups.teams.map((team) => ({
              value: team.team_id,
              label: team.team_name,
            }))}
            onChange={(team_id) => setFilters((current) => ({ ...current, team_id }))}
          />
        </div>
        <ResourceTable {...listing} rowKey="athlete_id" columns={columns} />
      </Card>
      <RecordDrawer kind="athlete" record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
