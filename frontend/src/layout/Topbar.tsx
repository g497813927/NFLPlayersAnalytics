import { CodeOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Badge, Button, Layout, Space } from 'antd';
import { useData } from '../hooks/useData';

interface Props {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  onSqlOpen: () => void;
}

export function Topbar({ title, collapsed, onToggle, onSqlOpen }: Props) {
  const { health, connectionError, connecting } = useData();
  const connected = health?.initialized && !connectionError;
  return (
    <Layout.Header className="topbar">
      <div className="breadcrumb">
        <Button
          type="text"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
        />
        <span className="breadcrumb-project">Workspace</span>
        <span className="breadcrumb-slash">/</span>
        <strong>{title}</strong>
      </div>
      <Space className="topbar-status" size="middle">
        <Badge
          status={connecting ? 'processing' : connected ? 'success' : 'error'}
          text={connecting ? 'Connecting' : connected ? 'Database connected' : 'Disconnected'}
        />
        <Button href="/docs/api" target="_blank" rel="noopener noreferrer">
          API docs
        </Button>
        {health?.sql_debug_ui && (
          <Button icon={<CodeOutlined />} onClick={onSqlOpen}>
            SQL inspector
          </Button>
        )}
      </Space>
    </Layout.Header>
  );
}
