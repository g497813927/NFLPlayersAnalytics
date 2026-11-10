import { Empty } from 'antd';
import { MetricComparison } from './MetricComparison';
import type { ComparisonResponse } from './types';

export function ComparisonResults({ comparison }: { comparison: ComparisonResponse }) {
  return (
    <section aria-label="Statistics comparison">
      <div className="comparison-results-heading">
        <div>
          <span className="eyebrow">THE NUMBERS SIDE BY SIDE</span>
          <h2>{comparison.season_name} season</h2>
        </div>
        <span className="muted">Completed games · {comparison.league_name}</span>
      </div>
      {comparison.metrics.length ? (
        <div className="comparison-metrics">
          {comparison.metrics.map((metric) => (
            <MetricComparison
              key={metric.stat_definition_id}
              metric={metric}
              leftName={comparison.left.name}
              rightName={comparison.right.name}
            />
          ))}
        </div>
      ) : (
        <Empty description="Neither selection has recorded statistics in completed games for this season." />
      )}
      <p className="comparison-footnote">
        Each statistic uses its defined calculation and its own chart scale. Only recorded values
        are included; a dash means no data. A larger value is not always better.
        {comparison.subject_type === 'team' && ' Team values come from recorded team statistics.'}
      </p>
    </section>
  );
}
