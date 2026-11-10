import { formatMetric } from './metricFormat';

interface Props {
  side: 'left' | 'right';
  name: string;
  value: number | null;
  samples: number;
  minimum: number;
  maximum: number;
}

export function MetricBar({ side, name, value, samples, minimum, maximum }: Props) {
  const span = maximum - minimum || 1;
  const zero = (-minimum / span) * 100;
  const endpoint = (((value ?? 0) - minimum) / span) * 100;

  return (
    <div className={`comparison-bar comparison-${side}`}>
      <div className="comparison-bar-label">
        <span>{name}</span>
        <strong>{formatMetric(value)}</strong>
      </div>
      <div
        className="comparison-bar-track"
        aria-hidden="true"
      >
        <span
          className="comparison-bar-zero"
          style={{ left: `${zero}%` }}
        />
        {value !== null && (
          <span
            className="comparison-bar-fill"
            style={{
              left: `${Math.min(zero, endpoint)}%`,
              width: `${Math.abs(endpoint - zero)}%`,
            }}
          />
        )}
      </div>
      <small>
        {samples === 0
          ? 'No recorded value'
          : `${samples} ${samples === 1 ? 'game' : 'games'} with this statistic`}
      </small>
    </div>
  );
}
