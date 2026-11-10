export type ComparisonKind = 'team' | 'athlete';

export interface ComparisonSubject {
  id: number;
  name: string;
  detail: string;
  positions: string[];
}

export interface ComparisonOptions {
  season_id: number;
  season_name: string;
  league_name: string;
  teams: ComparisonSubject[];
  athletes: ComparisonSubject[];
}

export interface ComparisonMetric {
  stat_definition_id: number;
  name: string;
  abbreviation: string;
  calculation: 'sum' | 'average' | 'min' | 'max' | 'last';
  left_value: number | null;
  right_value: number | null;
  left_samples: number;
  right_samples: number;
}

export interface ComparisonResponse {
  subject_type: ComparisonKind;
  season_id: number;
  season_name: string;
  league_name: string;
  left: ComparisonSubject;
  right: ComparisonSubject;
  left_games: number;
  right_games: number;
  metrics: ComparisonMetric[];
}
