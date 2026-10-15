import { useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { getRequestHistory, subscribeToRequests } from '../api';
import { useData } from '../hooks/useData';
import { SqlDrawer } from '../components/SqlDrawer';
import { navigation } from './navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DatasetRibbon } from './DatasetRibbon';
import { WorkspaceNotice } from './WorkspaceNotice';
import { PageFooter } from './PageFooter';
import { AppRoutes } from './AppRoutes';

export function AppShell() {
  const location = useLocation();
  const { health } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [sqlOpen, setSqlOpen] = useState(false);
  const [traceId, setTraceId] = useState<string | null>(null);
  const requests = useSyncExternalStore(subscribeToRequests, getRequestHistory);
  const currentTitle =
    navigation.find((item) => item.key === location.pathname)?.label || 'Overview';

  return (
    <Layout className="app-layout">
      <Sidebar collapsed={collapsed} pathname={location.pathname} onBreakpoint={setCollapsed} />
      <Layout className="workspace">
        <Topbar
          title={currentTitle}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onSqlOpen={() => {
            setTraceId(requests[0]?.id || null);
            setSqlOpen(true);
          }}
        />
        <Layout.Content className="main-content">
          <DatasetRibbon />
          <WorkspaceNotice />
          <AppRoutes />
          <PageFooter />
        </Layout.Content>
      </Layout>
      {health?.sql_debug_ui && (
        <SqlDrawer
          open={sqlOpen}
          onClose={() => setSqlOpen(false)}
          requestId={traceId}
          requests={requests}
          onSelect={setTraceId}
          onRefresh={() => setTraceId(requests[0]?.id || null)}
        />
      )}
    </Layout>
  );
}
