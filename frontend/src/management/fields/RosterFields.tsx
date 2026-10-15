import { Form } from 'antd';
import type { FieldProps } from '../fieldTypes';
import { DatabaseSelectField } from '../DatabaseSelectField';

export function RosterFields({ form, lookups }: FieldProps) {
  const seasonId = Form.useWatch<number | undefined>('season_id', form);
  const season = lookups.seasons.find((row) => row.season_id === seasonId);
  const teams = lookups.teams.filter((row) => !season || row.league_id === season.league_id);
  return (
    <>
      <DatabaseSelectField
        name="season_id"
        label="Season"
        options={lookups.seasons.map((row) => ({ value: row.season_id, label: row.season_name }))}
        onChange={() => form.setFieldValue('team_id', undefined)}
      />
      <DatabaseSelectField
        name="team_id"
        label="Team"
        options={teams.map((row) => ({ value: row.team_id, label: row.team_name }))}
      />
      <p className="muted">
        Each team has one roster per season. Add athletes through the Memberships tab.
      </p>
    </>
  );
}
