import { Alert, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import type { GameStatus } from '../../types';
import type { FieldProps } from '../fieldTypes';
import { requiredRules } from '../fieldTypes';
import { DatabaseSelectField } from '../DatabaseSelectField';

export function GameFields({ form, lookups }: FieldProps) {
  const seasonId = Form.useWatch<number | undefined>('season_id', form);
  const status = Form.useWatch<GameStatus | undefined>('status', form);
  const homeId = Form.useWatch<number | undefined>('home_team_id', form);
  const awayId = Form.useWatch<number | undefined>('away_team_id', form);
  const validTeams = new Set(
    lookups.rosters.filter((row) => row.season_id === seasonId).map((row) => row.team_id),
  );
  const teams = lookups.teams
    .filter((row) => validTeams.has(row.team_id))
    .map((row) => ({ value: row.team_id, label: row.team_name }));
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <DatabaseSelectField
            name="season_id"
            label="Season"
            options={lookups.seasons.map((row) => ({
              value: row.season_id,
              label: row.season_name,
            }))}
            onChange={() =>
              form.setFieldsValue({ home_team_id: undefined, away_team_id: undefined })
            }
          />
        </Col>
        <Col span={12}>
          <Form.Item name="status" label="Status" rules={requiredRules}>
            <Select<GameStatus>
              options={(['scheduled', 'in_progress', 'completed', 'cancelled'] as const).map(
                (value) => ({ value, label: value.replaceAll('_', ' ') }),
              )}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="game_time" label="Game time (your local time)" rules={requiredRules}>
            <Input type="datetime-local" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <DatabaseSelectField
            name="venue_id"
            label="Venue"
            required={false}
            allowClear
            options={lookups.venues.map((row) => ({ value: row.venue_id, label: row.venue_name }))}
          />
        </Col>
      </Row>
      <div className="form-section">
        <h3>Matchup</h3>
        <p className="muted">
          Select teams with rosters in this season. Completed games require both scores.
        </p>
        <Row gutter={16}>
          <Col span={17}>
            <DatabaseSelectField
              name="away_team_id"
              label="Away team"
              options={teams.map((row) => ({ ...row, disabled: row.value === homeId }))}
              disabled={!seasonId}
            />
          </Col>
          <Col span={7}>
            <Form.Item
              name="away_score"
              label="Away score"
              rules={status === 'completed' ? requiredRules : []}
            >
              <InputNumber min={0} precision={0} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={17}>
            <DatabaseSelectField
              name="home_team_id"
              label="Home team"
              options={teams.map((row) => ({ ...row, disabled: row.value === awayId }))}
              disabled={!seasonId}
            />
          </Col>
          <Col span={7}>
            <Form.Item
              name="home_score"
              label="Home score"
              rules={status === 'completed' ? requiredRules : []}
            >
              <InputNumber min={0} precision={0} />
            </Form.Item>
          </Col>
        </Row>
        {seasonId && teams.length < 2 && (
          <Alert
            type="warning"
            message="This season needs at least two team rosters before a game can be added."
          />
        )}
      </div>
    </>
  );
}
