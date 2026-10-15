import { useState } from 'react';
import { Col, Row } from 'antd';
import { ErrorNotice } from '../components';
import { useResource } from '../context';
import type { Game, Overview } from '../types';
import { HomeHero } from './home/HomeHero';
import { OverviewMetrics } from './home/OverviewMetrics';
import { RecentGamesCard } from './home/RecentGamesCard';
import { WorkspaceCard } from './home/WorkspaceCard';
import { RecordDrawer } from './RecordDrawer';

export function HomePage() {
  const overview = useResource<Overview>('/overview');
  const [selected, setSelected] = useState<Game | null>(null);

  return (
    <>
      <HomeHero />
      <ErrorNotice error={overview.error} retry={overview.retry} />
      <OverviewMetrics counts={overview.data?.counts || {}} loading={overview.loading} />
      <Row gutter={[20, 20]}>
        <Col xs={24} xl={17}>
          <RecentGamesCard
            games={overview.data?.recent_games || []}
            loading={overview.loading}
            onOpen={setSelected}
          />
        </Col>
        <Col xs={24} xl={7}>
          <WorkspaceCard />
        </Col>
      </Row>
      <RecordDrawer kind="game" record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
