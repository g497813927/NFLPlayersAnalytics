import { ResourceTable } from '../../components';
import type { Paged, PerformanceStatistic, ResourceState } from '../../types';
import { useStatisticColumns } from '../hooks/useStatisticColumns';

interface PerformanceHistoryProps {
  kind: 'athlete' | 'game';
  resource: ResourceState<Paged<PerformanceStatistic>>;
}

export function PerformanceHistory({ kind, resource }: PerformanceHistoryProps) {
  const columns = useStatisticColumns();
  const visibleColumns = columns.filter(
    (column) =>
      !(kind === 'athlete' && column.key === 'subject') &&
      !(kind === 'game' && column.key === 'game'),
  );

  return (
    <>
      <h3>Performance statistics</h3>
      <ResourceTable
        resource={resource}
        rowKey="performance_statistic_id"
        columns={visibleColumns}
      />
    </>
  );
}
