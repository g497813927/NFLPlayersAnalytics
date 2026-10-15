import { ResourceTable } from '../components';
import type { EditableResource, ManagementRow } from '../types';
import { useManagement } from './useManagement';
import { useManagementColumns } from './useManagementColumns';
import { ManagementToolbar } from './ManagementToolbar';
import { ManagementActions } from './ManagementActions';
import { RecordEditorModal } from './RecordEditorModal';
import { DeleteRecordModal } from './DeleteRecordModal';

export function ManagementTable({ entity }: { entity: EditableResource }) {
  const manager = useManagement(entity);
  const columns = useManagementColumns(entity);
  return (
    <>
      <ManagementToolbar
        entity={entity}
        total={manager.resource.data?.total}
        onSearch={manager.search}
        onAdd={() => manager.startEdit()}
      />
      <ResourceTable<ManagementRow>
        resource={manager.resource}
        rowKey={manager.config.key}
        page={manager.page}
        pageSize={manager.pageSize}
        onPageChange={manager.changePage}
        columns={[
          ...columns,
          {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, row) => (
              <ManagementActions
                singular={manager.config.singular}
                onEdit={() => manager.startEdit(row)}
                onDelete={() => manager.confirmDelete(row)}
              />
            ),
          },
        ]}
      />
      <RecordEditorModal
        entity={entity}
        record={manager.editing}
        form={manager.form}
        saving={manager.saving}
        error={manager.formError}
        onClose={manager.closeEditor}
        onSubmit={manager.submit}
      />
      <DeleteRecordModal
        entity={entity}
        open={manager.deleting !== null}
        saving={manager.saving}
        error={manager.deleteError}
        onClose={manager.closeDelete}
        onConfirm={manager.remove}
      />
    </>
  );
}
