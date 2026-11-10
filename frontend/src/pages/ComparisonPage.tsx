import { useState } from 'react';
import { Empty, Segmented, Spin } from 'antd';
import { PageHeading } from '../components';
import { SeasonSelect } from '../components/SeasonSelect';
import { useData } from '../context';
import { ComparisonWorkspace } from '../features/comparisons/ComparisonWorkspace';
import type { ComparisonKind } from '../features/comparisons/types';
import '../features/comparisons/comparisons.css';

export function ComparisonPage() {
  const { lookups, connecting, connectionError } = useData();
  const [kind, setKind] = useState<ComparisonKind>('team');
  const [selectedSeason, setSelectedSeason] = useState<number>();
  const seasonId =
    lookups.seasons.find((season) => season.season_id === selectedSeason)?.season_id ??
    lookups.seasons[0]?.season_id;

  return (
    <>
      <PageHeading
        eyebrow="A CLOSER LOOK"
        title="Compare the performance."
        description="Two teams or two players. The same season. See how their saved statistics compare."
      />
      <div className="comparison-controls">
        <Segmented<ComparisonKind>
          aria-label="Comparison type"
          value={kind}
          options={[
            { value: 'team', label: 'Teams' },
            { value: 'athlete', label: 'Players' },
          ]}
          onChange={setKind}
        />
        <div className="comparison-season">
          <span>Season / year</span>
          <SeasonSelect
            value={seasonId}
            onChange={setSelectedSeason}
            allowClear={false}
          />
        </div>
      </div>
      {connecting && seasonId === undefined && (
        <Spin tip="Loading seasons…">
          <div className="comparison-loading" />
        </Spin>
      )}
      {!connecting && !connectionError && seasonId === undefined && (
        <Empty description="No seasons are available yet." />
      )}
      {seasonId !== undefined && (
        <ComparisonWorkspace
          key={`${kind}-${seasonId}`}
          seasonId={seasonId}
          kind={kind}
        />
      )}
    </>
  );
}
