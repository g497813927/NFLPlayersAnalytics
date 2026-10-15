import { Alert, Button, Drawer, Empty, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useResource } from './context';

export function PageHeading({ eyebrow = 'FOOTBALL ANALYTICS', title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export function ErrorNotice({ error, retry }) {
  if (!error) return null;
  return <Alert className="error-notice" type="error" showIcon message="Unable to complete the request" description={error} action={retry && <Button size="small" onClick={retry}>Try again</Button>} />;
}

export function FilterSelect({ label, options, value, onChange, ...props }) {
  return <Select aria-label={label} placeholder={label} allowClear showSearch optionFilterProp="label" options={options} value={value} onChange={onChange} {...props} />;
}

export function StatusTag({ status }) {
  const colors = { completed: 'green', scheduled: 'blue', in_progress: 'gold', cancelled: 'default' };
  return <Tag color={colors[status] || 'default'}>{(status || 'Unknown').replaceAll('_', ' ')}</Tag>;
}

export function ResourceTable({ resource, columns, rowKey, page = 1, pageSize = 20, onPageChange, empty = 'No records match these filters.', ...props }) {
  return <><ErrorNotice error={resource.error} retry={resource.retry} /><Table
    rowKey={rowKey} columns={columns} dataSource={resource.data?.items || []} loading={resource.loading}
    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} /> }}
    pagination={onPageChange ? { current: page, pageSize, total: resource.data?.total || 0, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], onChange: onPageChange, showTotal: (total) => `${total} records` } : false}
    scroll={{ x: 'max-content' }} {...props}
  /></>;
}

export function SqlDrawer({ open, onClose, requestId, onRefresh, requests = [], onSelect }) {
  const trace = useResource(open && requestId ? `/debug/sql/${encodeURIComponent(requestId)}` : null);
  return <Drawer open={open} onClose={onClose} width={760} title="SQL inspector" extra={<Button icon={<ReloadOutlined />} onClick={onRefresh}>Latest request</Button>}>
    <p className="muted">Development view of executed SQL. Values remain separate from parameterized statements. Older traces expire from memory.</p>
    <Select className="trace-select" aria-label="Captured request" placeholder="Select a captured request" value={requestId || undefined} onChange={onSelect} options={requests.map((request) => ({ value: request.id, label: `${request.method} ${request.path}` }))} />
    {!requestId && <Empty description="Open a data page or save a record to capture a request." />}
    <ErrorNotice error={trace.error} retry={trace.retry} />
    {trace.loading && <Skeleton active />}
    {trace.data && <><Space wrap className="trace-heading"><Tag color="blue">{trace.data.method}</Tag><Typography.Text code>{trace.data.path}</Typography.Text><Typography.Text type="secondary">{trace.data.statements?.length || 0} statements</Typography.Text></Space>
      <p className="muted trace-id">Request: {trace.data.request_id}</p>
      {(trace.data.statements || []).map((entry, index) => <div className="sql-entry" key={index}>
        <div className="sql-entry-heading"><strong>Statement {index + 1}</strong><span>{Number(entry.duration_ms || 0).toFixed(2)} ms</span></div>
        <pre>{entry.statement}</pre><div className="sql-parameters"><strong>Bound parameters</strong><pre>{JSON.stringify(entry.parameters, null, 2)}</pre></div>
      </div>)}
      {!trace.data.statements?.length && <Empty description="This request did not execute SQL." />}
      {trace.data.truncated && <Alert type="info" message="This trace exceeded the capture limit. Only its first statements are shown." />}
    </>}
  </Drawer>;
}
