import { Descriptions } from 'antd';
import type { Athlete } from '../../types';

export function AthleteDetails({ athlete }: { athlete: Athlete }) {
  return (
    <Descriptions
      bordered
      size="small"
      column={1}
      items={[
        {
          key: 'nationality',
          label: 'Nationality',
          children: athlete.nationality || '—',
        },
      ]}
    />
  );
}
