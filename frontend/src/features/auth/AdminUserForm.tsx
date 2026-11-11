import { useState } from 'react';
import { Alert, Button, Form, Input, Select } from 'antd';
import { api, errorMessage } from '../../api';
import type { AccountUser, NewAccount } from './types';

export function AdminUserForm() {
  const [form] = Form.useForm<NewAccount>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AccountUser | null>(null);

  async function submit(values: NewAccount) {
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const account = await api<AccountUser>('/admin/users', { method: 'POST', body: values });
      form.resetFields();
      setCreated(account);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form<NewAccount>
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{ role: 'fan' }}
      onFinish={(values) => void submit(values)}
    >
      {error && (
        <Alert
          className="error-notice"
          type="error"
          showIcon
          message={error}
        />
      )}
      {created && (
        <Alert
          className="error-notice"
          type="success"
          showIcon
          message={`Created ${created.display_name} (${created.email}). You remain signed in as the administrator.`}
        />
      )}
      <Form.Item
        name="display_name"
        label="Display name"
        rules={[{ required: true, whitespace: true, max: 100 }]}
      >
        <Input
          autoComplete="off"
          maxLength={100}
        />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, type: 'email', max: 254 }]}
      >
        <Input
          type="email"
          autoComplete="off"
          maxLength={254}
        />
      </Form.Item>
      <Form.Item
        name="password"
        label="Initial password"
        extra="Use 12–128 characters. The user can change it after signing in."
        rules={[{ required: true, min: 12, max: 128 }]}
      >
        <Input.Password
          autoComplete="new-password"
          maxLength={128}
        />
      </Form.Item>
      <Form.Item
        name="role"
        label="Access level"
        extra="New accounts receive normal access."
        rules={[{ required: true }]}
      >
        <Select
          options={[
            { value: 'fan', label: 'Normal user (fan)' },
            { value: 'analyst', label: 'Analyst (normal access)' },
          ]}
        />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        block
        loading={busy}
      >
        Create user
      </Button>
    </Form>
  );
}
