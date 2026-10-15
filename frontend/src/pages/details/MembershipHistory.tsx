import type { TableColumnsType } from 'antd';
import { ResourceTable } from '../../components';
import { shortDate, useLabels } from '../../context';
import type { Membership, Paged, ResourceState } from '../../types';

interface MembershipHistoryProps {
  kind: 'team' | 'athlete';
  resource: ResourceState<Paged<Membership>>;
}

export function MembershipHistory({ kind, resource }: MembershipHistoryProps) {
  const labels = useLabels();
  const columns: TableColumnsType<Membership> = [
    ...(kind === 'team'
      ? [{ title: 'Athlete', dataIndex: 'athlete_id', render: labels.athlete }]
      : []),
    { title: 'Team · season', dataIndex: 'roster_id', render: labels.roster },
    { title: 'Position', dataIndex: 'position', render: (value: string) => value || '—' },
    {
      title: '#',
      dataIndex: 'jersey_number',
      render: (value: string | null) => value ?? '—',
    },
    { title: 'From', dataIndex: 'start_date', render: shortDate },
    { title: 'Until', dataIndex: 'end_date', render: shortDate },
  ];

  return (
    <>
      <h3>{kind === 'team' ? 'Roster memberships' : 'Team history'}</h3>
      <ResourceTable resource={resource} rowKey="membership_id" columns={columns} />
    </>
  );
}
