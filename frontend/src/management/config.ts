import type { EditableResource, ManagementRow } from '../types';

interface EntityConfig {
  label: string;
  singular: string;
  key: keyof Pick<
    ManagementRow,
    | 'team_id'
    | 'athlete_id'
    | 'roster_id'
    | 'membership_id'
    | 'game_id'
    | 'performance_statistic_id'
  >;
}

export const ENTITIES: Record<EditableResource, EntityConfig> = {
  teams: { label: 'Teams', singular: 'team', key: 'team_id' },
  athletes: { label: 'Athletes', singular: 'athlete', key: 'athlete_id' },
  rosters: { label: 'Rosters', singular: 'roster', key: 'roster_id' },
  memberships: { label: 'Memberships', singular: 'membership', key: 'membership_id' },
  games: { label: 'Games', singular: 'game', key: 'game_id' },
  'performance-statistics': {
    label: 'Statistics',
    singular: 'statistic',
    key: 'performance_statistic_id',
  },
};

export function isEditableResource(value: string): value is EditableResource {
  return Object.hasOwn(ENTITIES, value);
}
