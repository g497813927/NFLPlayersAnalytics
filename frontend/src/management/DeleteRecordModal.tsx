import { Modal } from 'antd';
import { ErrorNotice } from '../components';
import type { EditableResource } from '../types';
import { ENTITIES } from './config';

interface Props {
  entity: EditableResource;
  open: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteRecordModal({ entity, open, saving, error, onClose, onConfirm }: Props) {
  const description =
    entity === 'games'
      ? 'Deleting this game also deletes its participants and performance statistics. The season standings will be updated.'
      : entity === 'rosters'
        ? 'Deleting this roster also deletes its memberships. The deletion will be blocked if it would invalidate existing game statistics.'
        : 'The record will be removed from your local database. If other records still depend on it, the database may block this action.';
  return (
    <Modal
      title={`Delete this ${ENTITIES[entity].singular}?`}
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Delete record"
      okButtonProps={{ danger: true }}
      confirmLoading={saving}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
    >
      <p>{description}</p>
      <ErrorNotice error={error} />
    </Modal>
  );
}
