import { useState } from 'react';
import { Card } from 'antd';
import { FilterSelect, PageHeading, ResourceTable } from '../components';
import { athleteName, useData, useLabels } from '../context';
import type { PageFilters } from './filters';
import { useList } from './hooks/useList';
import { useStatisticColumns } from './hooks/useStatisticColumns';

export function StatisticsPage() {
  const { lookups } = useData();
  const labels = useLabels();
  const [filters, setFilters] = useState<PageFilters>({});
  const listing = useList('performance-statistics', filters);
  const columns = useStatisticColumns();

  return (
    <>
      <PageHeading
        title="Statistics"
        description="Connect individual and team performance to the game where it happened."
      />
      <Card className="data-card">
        <div className="filter-bar">
          <FilterSelect
            label="All statistics"
            options={lookups.stat_definitions.map((definition) => ({
              value: definition.stat_definition_id,
              label: definition.stat_name,
            }))}
            onChange={(stat_definition_id) =>
              setFilters((current) => ({
                ...current,
                stat_definition_id,
              }))
            }
          />
          <FilterSelect
            label="All games"
            options={lookups.games.map((game) => ({
              value: game.game_id,
              label: labels.game(game.game_id),
            }))}
            onChange={(game_id) => setFilters((current) => ({ ...current, game_id }))}
          />
          <FilterSelect
            label="All athletes"
            value={filters.athlete_id}
            options={lookups.athletes.map((athlete) => ({
              value: athlete.athlete_id,
              label: athleteName(athlete),
            }))}
            onChange={(athlete_id) =>
              setFilters((current) => ({
                ...current,
                athlete_id,
                team_id: undefined,
              }))
            }
          />
          <FilterSelect
            label="All teams"
            value={filters.team_id}
            options={lookups.teams.map((team) => ({
              value: team.team_id,
              label: team.team_name,
            }))}
            onChange={(team_id) =>
              setFilters((current) => ({
                ...current,
                team_id,
                athlete_id: undefined,
              }))
            }
          />
        </div>
        <ResourceTable {...listing} rowKey="performance_statistic_id" columns={columns} />
      </Card>
    </>
  );
}
