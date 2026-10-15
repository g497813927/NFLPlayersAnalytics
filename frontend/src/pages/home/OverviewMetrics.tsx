import { CalendarOutlined, TeamOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';
import type { ReactNode } from 'react';
import { MetricCard } from './MetricCard';

interface OverviewMetricsProps {
  counts: Record<string, number>;
  loading: boolean;
}

interface Metric {
  title: string;
  value: number | string;
  icon: ReactNode;
  path: string;
}

export function OverviewMetrics({ counts, loading }: OverviewMetricsProps) {
  const metrics: Metric[] = [
    {
      title: 'Teams',
      value: counts.teams ?? counts.team ?? '—',
      icon: <TeamOutlined />,
      path: '/teams',
    },
    {
      title: 'Athletes',
      value: counts.athletes ?? counts.athlete ?? '—',
      icon: <UserOutlined />,
      path: '/athletes',
    },
    {
      title: 'Games',
      value: counts.games ?? counts.game ?? '—',
      icon: <CalendarOutlined />,
      path: '/games',
    },
    {
      title: 'Statistics',
      value:
        counts.performance_statistics ?? counts.statistics ?? counts.performance_statistic ?? '—',
      icon: <TrophyOutlined />,
      path: '/statistics',
    },
  ];

  return (
    <Row gutter={[16, 16]} className="metric-row">
      {metrics.map((metric) => (
        <Col xs={12} lg={6} key={metric.title}>
          <MetricCard {...metric} loading={loading} />
        </Col>
      ))}
    </Row>
  );
}
