import { Form, InputNumber, Radio } from 'antd';
import { athleteName } from '../../context';
import type { FieldProps } from '../fieldTypes';
import { requiredRules } from '../fieldTypes';
import { DatabaseSelectField } from '../DatabaseSelectField';

export function StatisticFields({ form, lookups, labels }: FieldProps) {
  const gameId = Form.useWatch<number | undefined>('game_id', form);
  const subjectType =
    Form.useWatch<'athlete' | 'team' | undefined>('subject_type', form) || 'athlete';
  const game = lookups.games.find((row) => row.game_id === gameId);
  const teamIds = new Set((game?.participants || []).map((row) => row.team_id));
  return (
    <>
      <DatabaseSelectField
        name="game_id"
        label="Game"
        options={lookups.games.map((row) => ({
          value: row.game_id,
          label: labels.game(row.game_id),
        }))}
        onChange={() => form.setFieldValue('team_id', undefined)}
      />
      <DatabaseSelectField
        name="stat_definition_id"
        label="Statistic"
        options={lookups.stat_definitions.map((row) => ({
          value: row.stat_definition_id,
          label: `${row.stat_name}${row.abbreviation ? ` (${row.abbreviation})` : ''}`,
        }))}
      />
      <Form.Item name="subject_type" label="Record performance for" rules={requiredRules}>
        <Radio.Group
          options={[
            { value: 'athlete', label: 'An athlete' },
            { value: 'team', label: 'A team' },
          ]}
        />
      </Form.Item>
      {subjectType === 'athlete' ? (
        <DatabaseSelectField
          name="athlete_id"
          label="Athlete"
          options={lookups.athletes.map((row) => ({
            value: row.athlete_id,
            label: athleteName(row),
          }))}
        />
      ) : (
        <DatabaseSelectField
          name="team_id"
          label="Team"
          options={lookups.teams
            .filter((row) => teamIds.has(row.team_id))
            .map((row) => ({ value: row.team_id, label: row.team_name }))}
          disabled={!gameId}
        />
      )}
      <Form.Item name="stat_value" label="Value" rules={requiredRules}>
        <InputNumber />
      </Form.Item>
      <p className="muted">
        Athletes must have an active membership with a participating team on the game date. Negative
        values are allowed where meaningful, such as yards lost.
      </p>
    </>
  );
}
