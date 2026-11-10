import { Select } from 'antd';
import type { ComparisonKind, ComparisonSubject } from './types';

interface Props {
  side: 'left' | 'right';
  kind: ComparisonKind;
  subject: ComparisonSubject;
  options: ComparisonSubject[];
  games?: number;
  unavailable: boolean;
  onChange: (id: number) => void;
}

export function ComparisonSubjectCard({
  side,
  kind,
  subject,
  options,
  games,
  unavailable,
  onChange,
}: Props) {
  const label = `${side === 'left' ? 'First' : 'Second'} ${kind === 'team' ? 'team' : 'player'}`;
  const status = unavailable
    ? 'Statistics unavailable'
    : games === undefined
      ? 'Loading saved statistics…'
      : `${games} ${games === 1 ? 'game' : 'games'} with recorded stats`;

  return (
    <section
      className={`comparison-subject comparison-${side}`}
      aria-label={label}
    >
      <span className="eyebrow">{label}</span>
      <Select<number>
        aria-label={label}
        showSearch
        optionFilterProp="label"
        value={subject.id}
        onChange={onChange}
        options={options.map((option) => ({ value: option.id, label: option.name }))}
      />
      <p>{subject.detail}</p>
      <span className="comparison-game-count">{status}</span>
    </section>
  );
}
