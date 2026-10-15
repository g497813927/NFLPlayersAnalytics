import { PlusOutlined } from '@ant-design/icons';
import { Button, Input, Space } from 'antd';
import type { EditableResource } from '../types';
import { ENTITIES } from './config';

interface Props {
  entity: EditableResource;
  total?: number;
  onSearch: (value: string) => void;
  onAdd: () => void;
}

export function ManagementToolbar({ entity, total, onSearch, onAdd }: Props) {
  const config = ENTITIES[entity];
  return (
    <div className="management-toolbar">
      <div>
        <h2>{config.label}</h2>
        <span className="muted">{total ?? '—'} records in the database</span>
      </div>
      <Space>
        {['teams', 'athletes'].includes(entity) && (
          <Input.Search
            allowClear
            placeholder={`Search ${config.label.toLowerCase()}`}
            aria-label={`Search ${config.label.toLowerCase()}`}
            onSearch={onSearch}
          />
        )}
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add {config.singular}
        </Button>
      </Space>
    </div>
  );
}
