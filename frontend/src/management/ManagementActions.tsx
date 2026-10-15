import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';

interface Props {
  singular: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ManagementActions({ singular, onEdit, onDelete }: Props) {
  return (
    <Space>
      <Button size="small" icon={<EditOutlined />} onClick={onEdit} aria-label={`Edit ${singular}`}>
        Edit
      </Button>
      <Button
        size="small"
        danger
        icon={<DeleteOutlined />}
        onClick={onDelete}
        aria-label={`Delete ${singular}`}
      />
    </Space>
  );
}
