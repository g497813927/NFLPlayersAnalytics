import { ArrowRightOutlined } from '@ant-design/icons';
import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  path: string;
  loading: boolean;
}

export function MetricCard({ title, value, icon, path, loading }: MetricCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="metric-card" loading={loading} onClick={() => navigate(path)} hoverable>
      <span className="metric-icon">{icon}</span>
      <Statistic title={title} value={value} />
      <span className="metric-footer">
        Explore records <ArrowRightOutlined />
      </span>
    </Card>
  );
}
