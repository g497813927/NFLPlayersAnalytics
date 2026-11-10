import type { ComparisonMetric } from './types';

export const calculationLabels: Record<ComparisonMetric['calculation'], string> = {
  sum: 'Season total',
  average: 'Average per recorded game',
  min: 'Lowest recorded value',
  max: 'Highest recorded value',
  last: 'Latest recorded value',
};

const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export function formatMetric(value: number | null): string {
  return value === null ? '—' : formatter.format(value);
}
