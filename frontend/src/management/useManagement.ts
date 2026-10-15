import { useState } from 'react';
import { App, Form } from 'antd';
import { api, errorMessage, query } from '../api';
import { useData, useResource } from '../context';
import type { EditableResource, ManagementFormValues, ManagementRow, Paged } from '../types';
import { ENTITIES } from './config';
import { initialValues, writePayload } from './formValues';

export function useManagement(entity: EditableResource) {
  const { refresh } = useData();
  const { message } = App.useApp();
  const config = ENTITIES[entity];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ManagementRow | null>(null);
  const [deleting, setDeleting] = useState<ManagementRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [form] = Form.useForm<ManagementFormValues>();
  const resource = useResource<Paged<ManagementRow>>(
    `/${entity}${query({ page, page_size: pageSize, q: search })}`,
  );

  const startEdit = (row: ManagementRow = {}) => {
    setFormError(null);
    setEditing(row);
    form.resetFields();
    form.setFieldsValue(initialValues(entity, row));
  };

  const submit = async (values: ManagementFormValues) => {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = writePayload(entity, values);
      const id = editing[config.key];
      await api<ManagementRow>(`/${entity}${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: payload,
      });
      message.success(
        `${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${id ? 'updated' : 'created'}.`,
      );
      setEditing(null);
      await refresh();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setSaving(true);
    setDeleteError(null);
    try {
      await api<null>(`/${entity}/${deleting[config.key]}`, { method: 'DELETE' });
      setDeleting(null);
      message.success('Record deleted.');
      if (resource.data?.items.length === 1 && page > 1) setPage(page - 1);
      await refresh();
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    form,
    resource,
    page,
    pageSize,
    editing,
    deleting,
    saving,
    formError,
    deleteError,
    startEdit,
    submit,
    remove,
    search: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    changePage: (next: number, size: number) => {
      setPage(next);
      setPageSize(size);
    },
    closeEditor: () => {
      if (!saving) setEditing(null);
    },
    closeDelete: () => {
      if (!saving) setDeleting(null);
    },
    confirmDelete: (row: ManagementRow) => {
      setDeleting(row);
      setDeleteError(null);
    },
  };
}
