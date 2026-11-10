import { useState } from 'react';
import { Button, Card, Space } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { FilterSelect, PageHeading, ResourceTable } from '../components';
import { SeasonSelect } from '../components/SeasonSelect';
import { athleteName, useData, useLabels } from '../context';
import type { PageFilters } from './filters';
import { useList } from './hooks/useList';
import { useStatisticColumns } from './hooks/useStatisticColumns';

export function StatisticsPage() {
  const { lookups } = useData();
  const { isAdmin } = useAuth();
  const labels = useLabels();
  const [filters, setFilters] = useState<PageFilters>({});
  const listing = useList('performance-statistics', filters);
  const columns = useStatisticColumns();

  return (
    <>
      <PageHeading
        title="Statistics"
        description="Connect individual and team performance to the game where it happened."
        action={
          <Space wrap>
            <Link to="/compare">
              <Button>Compare teams & players</Button>
            </Link>
            {isAdmin && (
              <Link to="/manage?entity=performance-statistics">
                <Button>Edit statistics</Button>
              </Link>
            )}
          </Space>
        }
      />
      <Card className="data-card">
        <div className="filter-bar">
          <SeasonSelect
            value={filters.season_id}
            onChange={(season_id) =>
              setFilters((current) => ({ ...current, season_id, game_id: undefined }))
            }
          />
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
            value={filters.game_id}
            options={lookups.games
              .filter(
                (game) => filters.season_id === undefined || game.season_id === filters.season_id,
              )
              .map((game) => ({
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
        <ResourceTable
          {...listing}
          rowKey="performance_statistic_id"
          columns={columns}
        />
      </Card>
    </>
  );
}
