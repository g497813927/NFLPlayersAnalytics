import { Form, Input } from 'antd';
import type { FieldProps } from '../fieldTypes';
import { requiredTextRules } from '../fieldTypes';
import { DatabaseSelectField } from '../DatabaseSelectField';

export function TeamFields({ lookups }: FieldProps) {
  return (
    <>
      <Form.Item name="team_name" label="Team name" rules={requiredTextRules}>
        <Input maxLength={120} placeholder="e.g. Harbor City Owls" />
      </Form.Item>
      <Form.Item name="city" label="City" rules={requiredTextRules}>
        <Input maxLength={100} />
      </Form.Item>
      <DatabaseSelectField
        name="league_id"
        label="League"
        options={lookups.leagues.map((row) => ({ value: row.league_id, label: row.league_name }))}
      />
    </>
  );
}
