import { useState } from 'react';
import { SwapOutlined } from '@ant-design/icons';
import { Button, Empty, Spin } from 'antd';
import { query } from '../../api';
import { ErrorNotice } from '../../components/ErrorNotice';
import { useResource } from '../../context';
import { ComparisonResults } from './ComparisonResults';
import { ComparisonSubjectCard } from './ComparisonSubjectCard';
import type { ComparisonKind, ComparisonOptions, ComparisonResponse } from './types';

export function ComparisonWorkspace({
  seasonId,
  kind,
}: {
  seasonId: number;
  kind: ComparisonKind;
}) {
  const [leftId, setLeftId] = useState<number>();
  const [rightId, setRightId] = useState<number>();
  const options = useResource<ComparisonOptions>(
    `/comparisons/options${query({ season_id: seasonId })}`,
  );
  const currentOptions = options.data?.season_id === seasonId ? options.data : null;
  const subjects = (kind === 'team' ? currentOptions?.teams : currentOptions?.athletes) ?? [];
  const left = subjects.find((subject) => subject.id === leftId) ?? subjects[0];
  const alternatives = subjects.filter((subject) => subject.id !== left?.id);
  const right =
    alternatives.find((subject) => subject.id === rightId) ??
    alternatives.find((subject) =>
      subject.positions.some((position) => left?.positions.includes(position)),
    ) ??
    alternatives[0];
  const comparison = useResource<ComparisonResponse>(
    left && right
      ? `/comparisons${query({
          subject_type: kind,
          season_id: seasonId,
          left_id: left.id,
          right_id: right.id,
        })}`
      : null,
  );
  const result =
    comparison.data?.left.id === left?.id &&
    comparison.data?.right.id === right?.id &&
    comparison.data?.season_id === seasonId &&
    comparison.data?.subject_type === kind &&
    !comparison.loading
      ? comparison.data
      : null;

  if (options.error)
    return (
      <ErrorNotice
        error={options.error}
        retry={options.retry}
      />
    );
  if (options.loading || !currentOptions) {
    return (
      <Spin tip="Loading season rosters…">
        <div className="comparison-loading" />
      </Spin>
    );
  }
  if (!left || !right) {
    return (
      <Empty
        description={`This season needs at least two ${kind === 'team' ? 'teams' : 'players'} with roster records to compare.`}
      />
    );
  }

  return (
    <>
      <div className="comparison-subjects">
        <ComparisonSubjectCard
          side="left"
          kind={kind}
          subject={left}
          options={subjects.filter((subject) => subject.id !== right.id)}
          games={result?.left_games}
          unavailable={Boolean(comparison.error)}
          onChange={setLeftId}
        />
        <Button
          className="comparison-swap"
          shape="circle"
          icon={<SwapOutlined />}
          aria-label="Swap comparison sides"
          onClick={() => {
            setLeftId(right.id);
            setRightId(left.id);
          }}
        />
        <ComparisonSubjectCard
          side="right"
          kind={kind}
          subject={right}
          options={alternatives}
          games={result?.right_games}
          unavailable={Boolean(comparison.error)}
          onChange={setRightId}
        />
      </div>
      <ErrorNotice
        error={comparison.error}
        retry={comparison.retry}
      />
      {comparison.loading && (
        <Spin tip="Comparing saved statistics…">
          <div className="comparison-loading" />
        </Spin>
      )}
      {result && <ComparisonResults comparison={result} />}
    </>
  );
}
