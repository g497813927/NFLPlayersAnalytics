import { CodeOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Badge, Button, Layout } from 'antd';
import { useData } from '../hooks/useData';
import { AccountMenu } from '../features/auth/AccountMenu';
import { useAuth } from '../features/auth/useAuth';

interface Props {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  onSqlOpen: () => void;
}

export function Topbar({ title, collapsed, onToggle, onSqlOpen }: Props) {
  const { health, connectionError, connecting } = useData();
  const { isAdmin } = useAuth();
  const connected = health?.initialized && !connectionError;
  return (
    <Layout.Header className="topbar">
      <div className="breadcrumb">
        <Button
          type="text"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
          aria-controls="app-navigation"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
        />
        <span className="breadcrumb-project">Workspace</span>
        <span className="breadcrumb-slash">/</span>
        <strong>{title}</strong>
      </div>
      <div className="topbar-status">
        <Badge
          status={connecting ? 'processing' : connected ? 'success' : 'error'}
          text={connecting ? 'Connecting' : connected ? 'Database connected' : 'Disconnected'}
        />
        <Button
          href="/docs/api"
          target="_blank"
          rel="noopener noreferrer"
        >
          API docs
        </Button>
        {isAdmin && health?.sql_debug_ui && (
          <Button
            icon={<CodeOutlined />}
            onClick={onSqlOpen}
          >
            SQL inspector
          </Button>
        )}
        <AccountMenu />
      </div>
    </Layout.Header>
  );
}
