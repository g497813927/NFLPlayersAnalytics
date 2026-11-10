import { useState } from 'react';
import { Descriptions } from 'antd';
import { ResourceTable } from '../../components';
import { SeasonSelect } from '../../components/SeasonSelect';
import { useData, useLabels } from '../../context';
import type { Team } from '../../types';
import { useList } from '../hooks/useList';
import { MembershipHistory } from './MembershipHistory';
import { PerformanceHistory } from './PerformanceHistory';

interface TeamDetailsProps {
  team: Team;
  initialSeasonId?: number;
}

export function TeamDetails({ team, initialSeasonId }: TeamDetailsProps) {
  const labels = useLabels();
  const { lookups } = useData();
  const [seasonId, setSeasonId] = useState(initialSeasonId);
  const seasons = lookups.seasons.filter((season) => season.league_id === team.league_id);
  const filters = { team_id: team.team_id, season_id: seasonId };
  const rosters = useList('rosters', filters);
  const memberships = useList('memberships', filters);
  const statistics = useList('performance-statistics', filters);

  return (
    <>
      <Descriptions
        bordered
        size="small"
        column={2}
        items={[
          { key: 'city', label: 'City', children: team.city },
          { key: 'league', label: 'League', children: labels.league(team.league_id) },
        ]}
      />
      <div className="filter-bar team-season-filter">
        <SeasonSelect
          value={seasonId}
          onChange={setSeasonId}
          seasons={seasons}
        />
        <span className="muted">Filter this team's roster, players, and statistics by season.</span>
      </div>
      <h3>Seasonal rosters</h3>
      <ResourceTable
        {...rosters}
        rowKey="roster_id"
        columns={[
          { title: 'Season', dataIndex: 'season_id', render: labels.season },
          { title: 'Team', dataIndex: 'team_id', render: labels.team },
        ]}
      />
      <MembershipHistory
        kind="team"
        {...memberships}
      />
      <PerformanceHistory
        kind="team"
        {...statistics}
      />
    </>
  );
}
