import { Select } from 'antd';
import type { SelectProps } from 'antd';

export function FilterSelect<V extends string | number>({
  label,
  options,
  value,
  onChange,
  ...props
}: Omit<SelectProps<V>, 'options'> & { label: string; options: { value: V; label: string }[] }) {
  return (
    <Select
      aria-label={label}
      placeholder={label}
      allowClear
      showSearch
      optionFilterProp="label"
      options={options}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}
