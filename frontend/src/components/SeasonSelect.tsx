import { useData, useLabels } from '../context';
import type { Season } from '../types';
import { FilterSelect } from './FilterSelect';

interface Props {
  value?: number;
  onChange: (value: number | undefined) => void;
  seasons?: Season[];
  allowClear?: boolean;
}

export function SeasonSelect({ value, onChange, seasons, allowClear = true }: Props) {
  const { lookups } = useData();
  const labels = useLabels();

  return (
    <FilterSelect<number>
      label="Season / year"
      placeholder="All seasons / years"
      value={value}
      onChange={onChange}
      allowClear={allowClear}
      options={(seasons ?? lookups.seasons).map((season) => ({
        value: season.season_id,
        label: `${season.season_name} · ${labels.league(season.league_id)}`,
      }))}
    />
  );
}
