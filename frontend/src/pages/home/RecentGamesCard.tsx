import { ArrowRightOutlined } from '@ant-design/icons';
import { Card, Table } from 'antd';
import { Link } from 'react-router-dom';
import type { Game } from '../../types';
import { useGameColumns } from '../hooks/useGameColumns';

interface RecentGamesCardProps {
  games: Game[];
  loading: boolean;
  onOpen: (game: Game) => void;
}

export function RecentGamesCard({ games, loading, onOpen }: RecentGamesCardProps) {
  const columns = useGameColumns(onOpen);

  return (
    <Card
      title="Recent games"
      extra={
        <Link to="/games">
          All games <ArrowRightOutlined />
        </Link>
      }
      className="section-card"
    >
      <Table<Game>
        rowKey="game_id"
        columns={columns.filter((column) => column.key !== 'season')}
        dataSource={games}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Seed the database to explore game results.' }}
      />
    </Card>
  );
}
