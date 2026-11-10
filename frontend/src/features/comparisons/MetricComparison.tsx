import { MetricBar } from './MetricBar';
import { calculationLabels } from './metricFormat';
import type { ComparisonMetric } from './types';

interface Props {
  metric: ComparisonMetric;
  leftName: string;
  rightName: string;
}

export function MetricComparison({ metric, leftName, rightName }: Props) {
  const minimum = Math.min(0, metric.left_value ?? 0, metric.right_value ?? 0);
  const maximum = Math.max(0, metric.left_value ?? 0, metric.right_value ?? 0);

  return (
    <article className="comparison-metric">
      <header>
        <h3>{metric.name}</h3>
        <span>{calculationLabels[metric.calculation]}</span>
      </header>
      <MetricBar
        side="left"
        name={leftName}
        value={metric.left_value}
        samples={metric.left_samples}
        minimum={minimum}
        maximum={maximum}
      />
      <MetricBar
        side="right"
        name={rightName}
        value={metric.right_value}
        samples={metric.right_samples}
        minimum={minimum}
        maximum={maximum}
      />
    </article>
  );
}
