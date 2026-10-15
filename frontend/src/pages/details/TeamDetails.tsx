import { Descriptions } from 'antd';
import { ResourceTable } from '../../components';
import { useLabels } from '../../context';
import type { Paged, ResourceState, Roster, Team } from '../../types';

interface TeamDetailsProps {
  team: Team;
  rosters: ResourceState<Paged<Roster>>;
}

export function TeamDetails({ team, rosters }: TeamDetailsProps) {
  const labels = useLabels();

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
      <h3>Seasonal rosters</h3>
      <ResourceTable
        resource={rosters}
        rowKey="roster_id"
        columns={[
          { title: 'Season', dataIndex: 'season_id', render: labels.season },
          { title: 'Team', dataIndex: 'team_id', render: labels.team },
        ]}
      />
    </>
  );
}
