import {
  BarChartOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

type NavigationItem =
  | { key: string; label: string; icon: ReactNode; type?: never }
  | { type: 'divider'; key?: never; label?: never };

export const navigation: NavigationItem[] = [
  { key: '/', label: 'Overview', icon: <HomeOutlined /> },
  { key: '/teams', label: 'Teams', icon: <TeamOutlined /> },
  { key: '/athletes', label: 'Athletes', icon: <UserOutlined /> },
  { key: '/games', label: 'Games', icon: <CalendarOutlined /> },
  { key: '/standings', label: 'Standings', icon: <TrophyOutlined /> },
  { key: '/statistics', label: 'Statistics', icon: <BarChartOutlined /> },
  { type: 'divider' },
  { key: '/manage', label: 'Data management', icon: <DatabaseOutlined /> },
];
