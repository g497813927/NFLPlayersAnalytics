import { Button, Input, Segmented } from 'antd';
import { SearchOutlined, StarOutlined } from '@ant-design/icons';
import { FilterSelect } from '../../components';
import { useData } from '../../context';
import type { GameStatus } from '../../types';
import { GAME_STATUS_LABELS } from './gamePresentation';
import type { GameFilters } from './types';

interface Props {
  filters: GameFilters;
  onChange: (filters: GameFilters) => void;
  onReset: () => void;
}

export function GameFiltersBar({ filters, onChange, onReset }: Props) {
  const { lookups } = useData();
  return (
    <div className="game-filters">
      <div className="game-filters-primary">
        <Segmented<'all' | 'favorites'>
          aria-label="Schedule view"
          value={filters.view}
          onChange={(view) => onChange({ ...filters, view })}
          options={[
            { value: 'all', label: 'All games' },
            { value: 'favorites', label: 'My teams', icon: <StarOutlined /> },
          ]}
        />
        <Input
          aria-label="Search games by team"
          placeholder="Find a matchup"
          prefix={<SearchOutlined />}
          allowClear
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>
      <div className="game-filters-secondary">
        <FilterSelect
          label="All seasons"
          value={filters.seasonId}
          options={lookups.seasons.map((season) => ({
            value: season.season_id,
            label: season.season_name,
          }))}
          onChange={(seasonId) => onChange({ ...filters, seasonId })}
        />
        <FilterSelect
          label="All statuses"
          value={filters.status}
          options={(Object.keys(GAME_STATUS_LABELS) as GameStatus[]).map((status) => ({
            value: status,
            label: GAME_STATUS_LABELS[status],
          }))}
          onChange={(status) => onChange({ ...filters, status })}
        />
        <FilterSelect
          label="All teams"
          value={filters.teamId}
          options={lookups.teams.map((team) => ({ value: team.team_id, label: team.team_name }))}
          onChange={(teamId) => onChange({ ...filters, teamId })}
        />
        <Input
          type="date"
          aria-label="Games on or after UTC date"
          title="Games on or after (UTC)"
          value={filters.dateFrom}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
        />
        <Button
          type="text"
          onClick={onReset}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}
