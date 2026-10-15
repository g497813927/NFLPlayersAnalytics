import { Form, Select } from 'antd';
import type { SelectProps } from 'antd';
import type { ManagementFormValues, SelectOption } from '../types';
import { requiredRules } from './fieldTypes';

interface Props extends Omit<SelectProps<number>, 'options'> {
  name: keyof ManagementFormValues;
  label: string;
  options: SelectOption[];
  required?: boolean;
}

export function DatabaseSelectField({ name, label, options, required = true, ...props }: Props) {
  return (
    <Form.Item<ManagementFormValues>
      name={name}
      label={label}
      rules={required ? requiredRules : []}
    >
      <Select<number>
        showSearch
        optionFilterProp="label"
        placeholder="Choose a record"
        options={options}
        {...props}
      />
    </Form.Item>
  );
}
