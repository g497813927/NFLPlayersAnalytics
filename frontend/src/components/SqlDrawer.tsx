import { Alert, Button, Drawer, Empty, Select, Skeleton, Space, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useResource } from '../hooks/useResource';
import type { CapturedRequest, SqlTrace } from '../types';
import { ErrorNotice } from './ErrorNotice';

export function SqlDrawer({
  open,
  onClose,
  requestId,
  onRefresh,
  requests = [],
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
  onRefresh: () => void;
  requests?: CapturedRequest[];
  onSelect: (id: string) => void;
}) {
  const trace = useResource<SqlTrace>(
    open && requestId ? `/debug/sql/${encodeURIComponent(requestId)}` : null,
  );
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={760}
      title="SQL inspector"
      extra={
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          Latest request
        </Button>
      }
    >
      <p className="muted">
        Development view of executed SQL. Values remain separate from parameterized statements.
        Older traces expire from memory.
      </p>
      <Select
        className="trace-select"
        aria-label="Captured request"
        placeholder="Select a captured request"
        value={requestId || undefined}
        onChange={onSelect}
        options={requests.map((request) => ({
          value: request.id,
          label: `${request.method} ${request.path}`,
        }))}
      />
      {!requestId && (
        <Empty description="Open a data page or save a record to capture a request." />
      )}
      <ErrorNotice error={trace.error} retry={trace.retry} />
      {trace.loading && <Skeleton active />}
      {trace.data && (
        <>
          <Space wrap className="trace-heading">
            <Tag color="blue">{trace.data.method}</Tag>
            <Typography.Text code>{trace.data.path}</Typography.Text>
            <Typography.Text type="secondary">
              {trace.data.statements?.length || 0} statements
            </Typography.Text>
          </Space>
          <p className="muted trace-id">Request: {trace.data.request_id}</p>
          {(trace.data.statements || []).map((entry, index) => (
            <div className="sql-entry" key={index}>
              <div className="sql-entry-heading">
                <strong>Statement {index + 1}</strong>
                <span>{Number(entry.duration_ms || 0).toFixed(2)} ms</span>
              </div>
              <pre>{entry.statement}</pre>
              <div className="sql-parameters">
                <strong>Bound parameters</strong>
                <pre>{JSON.stringify(entry.parameters, null, 2)}</pre>
              </div>
            </div>
          ))}
          {!trace.data.statements?.length && (
            <Empty description="This request did not execute SQL." />
          )}
          {trace.data.truncated && (
            <Alert
              type="info"
              message="This trace exceeded the capture limit. Only its first statements are shown."
            />
          )}
        </>
      )}
    </Drawer>
  );
}
