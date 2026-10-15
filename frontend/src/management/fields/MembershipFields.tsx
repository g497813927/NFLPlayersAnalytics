import { Col, Form, Input, Row } from 'antd';
import { athleteName } from '../../context';
import type { FieldProps } from '../fieldTypes';
import { requiredRules, requiredTextRules } from '../fieldTypes';
import { DatabaseSelectField } from '../DatabaseSelectField';

export function MembershipFields({ form, lookups, labels }: FieldProps) {
  const rosterId = Form.useWatch<number | undefined>('roster_id', form);
  const startDate = Form.useWatch<string | undefined>('start_date', form);
  const roster = lookups.rosters.find((row) => row.roster_id === rosterId);
  const season = lookups.seasons.find((row) => row.season_id === roster?.season_id);
  const chooseRoster = (value: number) => {
    const chosenRoster = lookups.rosters.find((row) => row.roster_id === value);
    const chosenSeason = lookups.seasons.find((row) => row.season_id === chosenRoster?.season_id);
    form.setFieldsValue({ start_date: chosenSeason?.start_date, end_date: chosenSeason?.end_date });
  };
  return (
    <>
      <DatabaseSelectField
        name="roster_id"
        label="Team and season"
        options={lookups.rosters.map((row) => ({
          value: row.roster_id,
          label: labels.roster(row.roster_id),
        }))}
        onChange={chooseRoster}
      />
      <DatabaseSelectField
        name="athlete_id"
        label="Athlete"
        options={lookups.athletes.map((row) => ({
          value: row.athlete_id,
          label: athleteName(row),
        }))}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Form.Item name="position" label="Position" rules={requiredTextRules}>
            <Input maxLength={40} placeholder="e.g. Quarterback" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="jersey_number" label="Jersey number">
            <Input maxLength={10} placeholder="e.g. 00" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="start_date" label="Start date" rules={requiredRules}>
            <Input type="date" min={season?.start_date} max={season?.end_date} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="end_date"
            label="End date"
            dependencies={['start_date']}
            rules={[
              {
                validator: (_, value: string | null | undefined) =>
                  !value || !startDate || value >= startDate
                    ? Promise.resolve()
                    : Promise.reject(new Error('End date must be on or after the start date.')),
              },
            ]}
          >
            <Input type="date" min={startDate || season?.start_date} max={season?.end_date} />
          </Form.Item>
        </Col>
      </Row>
      <p className="muted">Membership dates must fall within the selected roster’s season.</p>
    </>
  );
}
