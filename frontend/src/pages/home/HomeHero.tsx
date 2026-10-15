import { ArrowRightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FootballFieldArt } from './FootballFieldArt';

export function HomeHero() {
  const navigate = useNavigate();

  return (
    <div className="overview-hero">
      <div>
        <div className="eyebrow">NFL PLAYERS ANALYTICS · LOCAL PROTOTYPE</div>
        <h1>
          Every player.
          <br />
          <span>A bigger picture.</span>
        </h1>
        <p>
          Explore the teams, follow the season, and connect performance to the people behind it.
        </p>
        <Button type="primary" size="large" onClick={() => navigate('/athletes')}>
          Explore athletes <ArrowRightOutlined />
        </Button>
      </div>
      <FootballFieldArt />
    </div>
  );
}
