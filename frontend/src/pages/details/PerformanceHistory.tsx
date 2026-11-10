import { ResourceTable } from '../../components';
import type { Paged, PerformanceStatistic, ResourceState } from '../../types';
import { useStatisticColumns } from '../hooks/useStatisticColumns';

interface PerformanceHistoryProps {
  kind: 'athlete' | 'game' | 'team';
  resource: ResourceState<Paged<PerformanceStatistic>>;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function PerformanceHistory({ kind, resource, ...pagination }: PerformanceHistoryProps) {
  const columns = useStatisticColumns();
  const visibleColumns = columns.filter(
    (column) =>
      !(kind !== 'game' && column.key === 'subject') && !(kind === 'game' && column.key === 'game'),
  );

  return (
    <>
      <h3>Performance statistics</h3>
      <ResourceTable
        {...pagination}
        resource={resource}
        rowKey="performance_statistic_id"
        columns={visibleColumns}
      />
    </>
  );
}
