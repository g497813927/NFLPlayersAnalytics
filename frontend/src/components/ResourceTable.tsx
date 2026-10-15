import { Empty, Table } from 'antd';
import type { TableProps } from 'antd';
import type { Paged, ResourceState } from '../types';
import { ErrorNotice } from './ErrorNotice';

type ResourceTableProps<T extends object> = Omit<
  TableProps<T>,
  'pagination' | 'loading' | 'dataSource'
> & {
  resource: ResourceState<Paged<T>>;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  empty?: string;
};

export function ResourceTable<T extends object>({
  resource,
  columns,
  rowKey,
  page = 1,
  pageSize = 20,
  onPageChange,
  empty = 'No records match these filters.',
  ...props
}: ResourceTableProps<T>) {
  return (
    <>
      <ErrorNotice error={resource.error} retry={resource.retry} />
      <Table<T>
        rowKey={rowKey}
        columns={columns}
        dataSource={resource.data?.items || []}
        loading={resource.loading}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} /> }}
        pagination={
          onPageChange
            ? {
                current: page,
                pageSize,
                total: resource.data?.total || 0,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                onChange: onPageChange,
                showTotal: (total) => `${total} records`,
              }
            : false
        }
        scroll={{ x: 'max-content' }}
        {...props}
      />
    </>
  );
}
