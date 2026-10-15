import { useState, useSyncExternalStore } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ApartmentOutlined, BarChartOutlined, CalendarOutlined, CodeOutlined, DatabaseOutlined, HomeOutlined, MenuFoldOutlined, MenuUnfoldOutlined, TeamOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Layout, Menu, Space, Tag } from 'antd';
import { getRequestHistory, subscribeToRequests } from './api';
import { DataProvider, useData } from './context';
import { SqlDrawer } from './components';
import { AthletesPage, GamesPage, HomePage, StandingsPage, StatisticsPage, TeamsPage } from './pages';
import ManagementPage from './Management';

const navigation = [
  { key: '/', label: 'Overview', icon: <HomeOutlined /> },
  { key: '/teams', label: 'Teams', icon: <TeamOutlined /> },
  { key: '/athletes', label: 'Athletes', icon: <UserOutlined /> },
  { key: '/games', label: 'Games', icon: <CalendarOutlined /> },
  { key: '/standings', label: 'Standings', icon: <TrophyOutlined /> },
  { key: '/statistics', label: 'Statistics', icon: <BarChartOutlined /> },
  { type: 'divider' },
  { key: '/manage', label: 'Data management', icon: <DatabaseOutlined /> },
];

function Shell() {
  const location = useLocation();
  const { health, connectionError, connecting, refresh } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [sqlOpen, setSqlOpen] = useState(false);
  const [traceId, setTraceId] = useState(null);
  const requests = useSyncExternalStore(subscribeToRequests, getRequestHistory);
  const connected = health?.initialized && !connectionError;
  const currentTitle = navigation.find((item) => item.key === location.pathname)?.label || 'Overview';
  return <Layout className="app-layout">
    <Layout.Sider width={236} collapsedWidth={72} collapsed={collapsed} breakpoint="lg" onBreakpoint={setCollapsed} className="sidebar">
      <Link to="/" className="brand" aria-label="NFL Players Analytics home"><span className="brand-symbol"><ApartmentOutlined /></span>{!collapsed && <span>NFL ANALYTICS<small>Prototype workspace</small></span>}</Link>
      {!collapsed && <div className="nav-label">EXPLORE</div>}
      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={navigation.map((item) => item.type === 'divider' ? item : { ...item, label: <Link to={item.key}>{item.label}</Link> })} />
      <div className={`sidebar-footer ${collapsed ? 'collapsed' : ''}`}><span className="prototype-dot" />{!collapsed && <div>Prototype 01<small>Built for discovery.</small></div>}</div>
    </Layout.Sider>
    <Layout className="workspace">
      <Layout.Header className="topbar"><div className="breadcrumb"><Button type="text" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} /><span className="breadcrumb-project">Workspace</span><span className="breadcrumb-slash">/</span><strong>{currentTitle}</strong></div><Space className="topbar-status" size="middle"><Badge status={connecting ? 'processing' : connected ? 'success' : 'error'} text={connecting ? 'Connecting' : connected ? 'Database connected' : 'Disconnected'} />{health?.sql_debug_ui && <Button icon={<CodeOutlined />} onClick={() => { setTraceId(requests[0]?.id || null); setSqlOpen(true); }}>SQL inspector</Button>}</Space></Layout.Header>
      <Layout.Content className="main-content"><div className="dataset-ribbon"><span className="dataset-dot" /><span>Synthetic football data</span><Tag bordered={false}>LOCAL DEMO</Tag></div>
        {connectionError && <Alert className="connection-alert" type="warning" showIcon message="The demo database is not ready" description={connectionError} action={<Button loading={connecting} onClick={refresh}>Reconnect</Button>} />}
        {!connectionError && health && !health.initialized && <Alert className="connection-alert" type="info" showIcon message="Initialize and seed the database to start exploring" description="Follow the database setup commands in the project README, then reconnect." action={<Button onClick={refresh}>Reconnect</Button>} />}
        <Routes><Route path="/" element={<HomePage />} /><Route path="/teams" element={<TeamsPage />} /><Route path="/athletes" element={<AthletesPage />} /><Route path="/games" element={<GamesPage />} /><Route path="/standings" element={<StandingsPage />} /><Route path="/statistics" element={<StatisticsPage />} /><Route path="/manage" element={<ManagementPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>
        <footer className="page-footer"><span>NFL Players Analytics · CS5614</span><span>Fictional records. Real relationships.</span></footer>
      </Layout.Content>
    </Layout>
    {health?.sql_debug_ui && <SqlDrawer open={sqlOpen} onClose={() => setSqlOpen(false)} requestId={traceId} requests={requests} onSelect={setTraceId} onRefresh={() => setTraceId(requests[0]?.id || null)} />}
  </Layout>;
}

export default function App() {
  return <DataProvider><Shell /></DataProvider>;
}
