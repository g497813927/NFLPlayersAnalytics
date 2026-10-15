/** API contracts shared by the client, pages, and forms. Dates arrive as ISO strings. */
export type DateString = string;
export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ParticipantRole = 'home' | 'away';
export type MaybeId = number | null | undefined;
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface Sport {
  sport_id: number;
  sport_name: string;
}
export interface League {
  league_id: number;
  league_name: string;
  country: string | null;
  sport_id: number;
}
export interface Season {
  season_id: number;
  season_name: string;
  start_date: DateString;
  end_date: DateString;
  league_id: number;
}
export interface Venue {
  venue_id: number;
  venue_name: string;
  city: string | null;
}
export interface TeamWrite {
  team_name: string;
  city: string;
  league_id: number;
}
export interface Team extends TeamWrite {
  team_id: number;
  league_name?: string;
  sport_id?: number;
  sport_name?: string;
}
export interface AthleteWrite {
  first_name: string;
  last_name: string;
  nationality: string | null;
}
export interface Athlete extends AthleteWrite {
  athlete_id: number;
  athlete_name?: string;
  full_name?: string;
}
export interface RosterWrite {
  team_id: number;
  season_id: number;
}
export interface Roster extends RosterWrite {
  roster_id: number;
  team_name?: string;
  season_name?: string;
  league_id?: number;
  label?: string;
}
export interface MembershipWrite {
  roster_id: number;
  athlete_id: number;
  position: string;
  jersey_number: string | null;
  start_date: DateString;
  end_date: DateString | null;
}
export interface Membership extends MembershipWrite {
  membership_id: number;
  athlete_name?: string;
  team_id?: number;
  team_name?: string;
  season_id?: number;
  season_name?: string;
  roster_label?: string;
}
export interface GameParticipantWrite {
  team_id: number;
  participant_role: ParticipantRole;
  score: number | null;
}
export interface GameParticipant extends GameParticipantWrite {
  game_id: number;
  team_name?: string;
}
export interface GameWrite {
  game_time: DateString;
  status: GameStatus;
  season_id: number;
  venue_id: number | null;
  participants: GameParticipantWrite[];
}
export interface Game extends Omit<GameWrite, 'participants'> {
  game_id: number;
  participants: GameParticipant[];
  season_name?: string;
  league_id?: number;
  venue_name?: string | null;
  matchup?: string;
  game_label?: string;
}
export interface StatDefinition {
  stat_definition_id: number;
  stat_name: string;
  abbreviation: string;
  calc_type: string;
  sport_id: number;
}
interface StatisticValues {
  game_id: number;
  stat_definition_id: number;
  stat_value: number;
}
/** The database and backend enforce the same exclusive subject rule. */
export type StatisticWrite = StatisticValues &
  ({ athlete_id: number; team_id: null } | { athlete_id: null; team_id: number });
export type PerformanceStatistic = StatisticWrite & {
  performance_statistic_id: number;
  stat_name?: string;
  athlete_name?: string | null;
  team_name?: string | null;
  game_label?: string;
  season_id?: number;
};
export interface Standing {
  standing_id: number;
  team_id: number;
  season_id: number;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  win_percentage: number;
  team_name?: string;
  season_name?: string;
  games_played?: number;
}
export interface ResourceRecords {
  teams: Team;
  athletes: Athlete;
  rosters: Roster;
  memberships: Membership;
  games: Game;
  'performance-statistics': PerformanceStatistic;
  standings: Standing;
}
export type EditableResource = Exclude<keyof ResourceRecords, 'standings'>;
export type WritePayload =
  TeamWrite | AthleteWrite | RosterWrite | MembershipWrite | GameWrite | StatisticWrite;
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}
export interface Health {
  status: 'ok' | 'setup_required' | 'unavailable';
  database: 'connected' | 'disconnected';
  initialized: boolean;
  sql_debug_ui: boolean;
  synthetic: boolean;
}
export interface Overview {
  counts: Record<string, number>;
  recent_games: Game[];
}
export interface Lookups {
  sports: Sport[];
  leagues: League[];
  seasons: Season[];
  venues: Venue[];
  stat_definitions: StatDefinition[];
  teams: Team[];
  athletes: Athlete[];
  rosters: Roster[];
  games: Game[];
}
export interface FieldError {
  field: string;
  message: string;
}
export interface ApiErrorEnvelope {
  error: { code: string; message: string; fields?: FieldError[] };
}
export interface CapturedRequest {
  id: string;
  method: string;
  path: string;
}
export interface SqlStatement {
  statement: string;
  parameters: JsonValue;
  duration_ms: number | null;
}
export interface SqlTrace {
  request_id: string;
  method: string;
  path: string;
  statements: SqlStatement[];
  truncated: boolean;
}
export interface SelectOption {
  value: number;
  label: string;
  disabled?: boolean;
}
export interface Labels {
  team: (id: MaybeId) => string;
  season: (id: MaybeId) => string;
  athlete: (id: MaybeId) => string;
  league: (id: MaybeId) => string;
  venue: (id: MaybeId) => string;
  stat: (id: MaybeId) => string;
  roster: (id: MaybeId) => string;
  game: (id: MaybeId) => string;
}

/** One reusable management form mounts only the fields for its selected resource. */
export interface ManagementFormValues {
  team_name?: string;
  city?: string;
  league_id?: number;
  first_name?: string;
  last_name?: string;
  nationality?: string | null;
  team_id?: number | null;
  athlete_id?: number | null;
  season_id?: number;
  roster_id?: number;
  position?: string;
  jersey_number?: string | null;
  start_date?: DateString;
  end_date?: DateString | null;
  game_time?: DateString;
  status?: GameStatus;
  venue_id?: number | null;
  home_team_id?: number;
  away_team_id?: number;
  home_score?: number | null;
  away_score?: number | null;
  game_id?: number;
  stat_definition_id?: number;
  stat_value?: number;
  subject_type?: 'athlete' | 'team';
}
/** A management tab supplies one complete record; a new record starts empty. */
export interface ManagementRow extends ManagementFormValues {
  membership_id?: number;
  performance_statistic_id?: number;
  participants?: GameParticipant[];
}
