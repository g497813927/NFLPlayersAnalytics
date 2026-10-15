import { Form, Modal } from 'antd';
import type { FormInstance } from 'antd';
import { ErrorNotice } from '../components';
import { useData, useLabels } from '../context';
import type { EditableResource, ManagementFormValues, ManagementRow } from '../types';
import { ENTITIES } from './config';
import { EntityFields } from './EntityFields';

interface Props {
  entity: EditableResource;
  record: ManagementRow | null;
  form: FormInstance<ManagementFormValues>;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: ManagementFormValues) => Promise<void>;
}

export function RecordEditorModal({
  entity,
  record,
  form,
  saving,
  error,
  onClose,
  onSubmit,
}: Props) {
  const config = ENTITIES[entity];
  const { lookups } = useData();
  const labels = useLabels();
  return (
    <Modal
      title={`${record?.[config.key] ? 'Edit' : 'Add'} ${config.singular}`}
      open={record !== null}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save record"
      confirmLoading={saving}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
      width={entity === 'games' || entity === 'memberships' ? 680 : 560}
      forceRender
    >
      <ErrorNotice error={error} />
      <Form<ManagementFormValues>
        form={form}
        layout="vertical"
        preserve={false}
        onFinish={onSubmit}
        disabled={saving}
        requiredMark="optional"
      >
        <EntityFields entity={entity} form={form} lookups={lookups} labels={labels} />
      </Form>
    </Modal>
  );
}
