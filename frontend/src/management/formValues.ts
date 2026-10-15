import type { EditableResource, ManagementFormValues, ManagementRow, WritePayload } from '../types';

function localDateTime(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function initialValues(entity: EditableResource, row: ManagementRow): ManagementFormValues {
  if (entity === 'games') {
    const home = row.participants?.find((item) => item.participant_role === 'home');
    const away = row.participants?.find((item) => item.participant_role === 'away');
    return {
      ...row,
      status: row.status || 'scheduled',
      game_time: localDateTime(row.game_time),
      home_team_id: home?.team_id,
      away_team_id: away?.team_id,
      home_score: home?.score,
      away_score: away?.score,
    };
  }
  if (entity === 'performance-statistics') {
    return { ...row, subject_type: row.team_id != null ? 'team' : 'athlete' };
  }
  return { ...row };
}

function required<T>(value: T | null | undefined, label: string): T {
  if (value == null || value === '') throw new Error(`Please complete ${label}.`);
  return value;
}

const optionalText = (value: string | null | undefined): string | null => value || null;

/** Explicit payloads omit display labels and inactive form fields. */
export function writePayload(entity: EditableResource, values: ManagementFormValues): WritePayload {
  switch (entity) {
    case 'teams':
      return {
        team_name: required(values.team_name, 'the team name'),
        city: required(values.city, 'the city'),
        league_id: required(values.league_id, 'the league'),
      };
    case 'athletes':
      return {
        first_name: required(values.first_name, 'the first name'),
        last_name: required(values.last_name, 'the last name'),
        nationality: optionalText(values.nationality),
      };
    case 'rosters':
      return {
        team_id: required(values.team_id, 'the team'),
        season_id: required(values.season_id, 'the season'),
      };
    case 'memberships':
      return {
        roster_id: required(values.roster_id, 'the roster'),
        athlete_id: required(values.athlete_id, 'the athlete'),
        position: required(values.position, 'the position'),
        jersey_number: optionalText(values.jersey_number),
        start_date: required(values.start_date, 'the start date'),
        end_date: optionalText(values.end_date),
      };
    case 'games': {
      const date = new Date(required(values.game_time, 'the game time'));
      if (Number.isNaN(date.getTime())) throw new Error('Please enter a valid date and time.');
      return {
        game_time: date.toISOString(),
        status: required(values.status, 'the status'),
        season_id: required(values.season_id, 'the season'),
        venue_id: values.venue_id ?? null,
        participants: [
          {
            team_id: required(values.home_team_id, 'the home team'),
            participant_role: 'home',
            score: values.home_score ?? null,
          },
          {
            team_id: required(values.away_team_id, 'the away team'),
            participant_role: 'away',
            score: values.away_score ?? null,
          },
        ],
      };
    }
    case 'performance-statistics': {
      const statistic = {
        game_id: required(values.game_id, 'the game'),
        stat_definition_id: required(values.stat_definition_id, 'the statistic'),
        stat_value: required(values.stat_value, 'the value'),
      };
      return values.subject_type === 'team'
        ? { ...statistic, team_id: required(values.team_id, 'the team'), athlete_id: null }
        : { ...statistic, athlete_id: required(values.athlete_id, 'the athlete'), team_id: null };
    }
  }
}
