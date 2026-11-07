import type { GameParticipant, ParticipantRole } from '../../types';

export interface GameSide extends GameParticipant {
  name: string;
  initials: string;
  color: string;
}

export interface MockPlay {
  clock: string;
  possession: ParticipantRole;
  /** Yard position measured from the possessing team's own goal line. */
  yard: number;
  down: string;
  toGain: number | null;
  title: string;
  detail: string;
  awayScore: number;
  homeScore: number;
  scoring?: boolean;
  final?: boolean;
}

export interface GameFilters {
  view: 'all' | 'favorites';
  seasonId?: number;
  teamId?: number;
  status?: string;
  query: string;
  dateFrom: string;
}
