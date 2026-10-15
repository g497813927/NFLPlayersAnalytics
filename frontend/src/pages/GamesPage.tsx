import { useState } from 'react';
import { Card, Input } from 'antd';
import { FilterSelect, PageHeading, ResourceTable } from '../components';
import { useData } from '../context';
import type { Game, GameStatus } from '../types';
import type { PageFilters } from './filters';
import { useGameColumns } from './hooks/useGameColumns';
import { useList } from './hooks/useList';
import { RecordDrawer } from './RecordDrawer';

const GAME_STATUSES: GameStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];

export function GamesPage() {
  const { lookups } = useData();
  const [filters, setFilters] = useState<PageFilters>({});
  const [selected, setSelected] = useState<Game | null>(null);
  const listing = useList('games', filters);
  const columns = useGameColumns(setSelected);

  return (
    <>
      <PageHeading
        title="Games"
        description="The season, one matchup at a time. Explore schedules, scores, and game statistics."
      />
      <Card className="data-card">
        <div className="filter-bar">
          <FilterSelect
            label="All seasons"
            options={lookups.seasons.map((season) => ({
              value: season.season_id,
              label: season.season_name,
            }))}
            onChange={(season_id) => setFilters((current) => ({ ...current, season_id }))}
          />
          <FilterSelect<GameStatus>
            label="All statuses"
            options={GAME_STATUSES.map((status) => ({
              value: status,
              label: status.replaceAll('_', ' '),
            }))}
            onChange={(status) => setFilters((current) => ({ ...current, status }))}
          />
          <FilterSelect
            label="All teams"
            options={lookups.teams.map((team) => ({
              value: team.team_id,
              label: team.team_name,
            }))}
            onChange={(team_id) => setFilters((current) => ({ ...current, team_id }))}
          />
          <Input
            type="date"
            aria-label="Games on or after date"
            title="Games on or after"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                date_from: event.target.value,
              }))
            }
          />
        </div>
        <ResourceTable {...listing} rowKey="game_id" columns={columns} />
      </Card>
      <RecordDrawer kind="game" record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
