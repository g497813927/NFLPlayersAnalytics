import { ArrowRightOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context';
import { useAuth } from '../../features/auth/useAuth';

export function WorkspaceCard() {
  const navigate = useNavigate();
  const { health } = useData();
  const { user, isAdmin } = useAuth();

  return (
    <Card
      title="Your demo workspace"
      className="section-card workspace-card"
    >
      <div className="workspace-status">
        <DatabaseOutlined />
        <div>
          <strong>{health?.initialized ? 'Database connected' : 'Database setup required'}</strong>
          <span>{health?.database || 'SQLite'} · local development</span>
        </div>
      </div>
      <p>
        All teams, athletes, and results are synthetic.{' '}
        {isAdmin
          ? 'Use Data Management to edit team statistics, scores, and other shared records.'
          : 'Explore the data and follow your favorite teams.'}
      </p>
      <Button
        block
        onClick={() => navigate(isAdmin ? '/manage' : user ? '/games' : '/login')}
      >
        {isAdmin ? 'Manage records' : user ? 'My favorite teams' : 'Sign in to sync favorites'}{' '}
        <ArrowRightOutlined />
      </Button>
      <div className="future-note">
        <span className="eyebrow">COMING LATER</span>
        <p>Saved comparisons, imports, and exports.</p>
      </div>
    </Card>
  );
}
