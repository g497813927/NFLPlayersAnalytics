import { ArrowRightOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context';

export function WorkspaceCard() {
  const navigate = useNavigate();
  const { health } = useData();

  return (
    <Card title="Your demo workspace" className="section-card workspace-card">
      <div className="workspace-status">
        <DatabaseOutlined />
        <div>
          <strong>{health?.initialized ? 'Database connected' : 'Database setup required'}</strong>
          <span>{health?.database || 'SQLite'} · local development</span>
        </div>
      </div>
      <p>
        All people, teams, and results in this prototype are synthetic. Browse records or use Data
        Management to try changes.
      </p>
      <Button block onClick={() => navigate('/manage')}>
        Manage records <ArrowRightOutlined />
      </Button>
      <div className="future-note">
        <span className="eyebrow">COMING LATER</span>
        <p>Sign-in, favorites, comparisons, imports, and exports.</p>
      </div>
    </Card>
  );
}
