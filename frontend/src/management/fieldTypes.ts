import type { FormInstance } from 'antd';
import type { Labels, Lookups, ManagementFormValues } from '../types';

export interface FieldProps {
  form: FormInstance<ManagementFormValues>;
  lookups: Lookups;
  labels: Labels;
}

export const requiredRules = [{ required: true, message: 'Please complete this field.' }];
export const requiredTextRules = [
  { required: true, whitespace: true, message: 'Please complete this field.' },
];
