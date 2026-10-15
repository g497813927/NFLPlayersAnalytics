import { Tag } from 'antd';
import type { GameStatus } from '../types';

export function StatusTag({ status }: { status: GameStatus | undefined }) {
  const colors = {
    completed: 'green',
    scheduled: 'blue',
    in_progress: 'gold',
    cancelled: 'default',
  };
  return (
    <Tag color={colors[status ?? 'scheduled'] || 'default'}>
      {(status || 'Unknown').replaceAll('_', ' ')}
    </Tag>
  );
}
