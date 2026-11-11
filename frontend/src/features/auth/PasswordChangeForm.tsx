import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { errorMessage } from '../../api';
import { useAuth } from './useAuth';
import type { PasswordChange } from './types';

interface Values extends PasswordChange {
  confirm_password: string;
}

export function PasswordChangeForm() {
  const { changePassword } = useAuth();
  const [form] = Form.useForm<Values>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(values: Values) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      form.resetFields();
      setSaved(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form<Values>
      form={form}
      layout="vertical"
      requiredMark={false}
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
      {saved && (
        <Alert
          className="error-notice"
          type="success"
          showIcon
          message="Password changed. Other sessions are signed out; this browser stays signed in."
        />
      )}
      <Form.Item
        name="current_password"
        label="Current password"
        rules={[{ required: true, max: 128 }]}
      >
        <Input.Password
          autoComplete="current-password"
          maxLength={128}
        />
      </Form.Item>
      <Form.Item
        name="new_password"
        label="New password"
        extra="Use 12–128 characters."
        rules={[{ required: true, min: 12, max: 128 }]}
      >
        <Input.Password
          autoComplete="new-password"
          maxLength={128}
        />
      </Form.Item>
      <Form.Item
        name="confirm_password"
        label="Confirm new password"
        dependencies={['new_password']}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value: string) {
              return !value || getFieldValue('new_password') === value
                ? Promise.resolve()
                : Promise.reject(new Error('The new passwords do not match.'));
            },
          }),
        ]}
      >
        <Input.Password
          autoComplete="new-password"
          maxLength={128}
        />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        block
        loading={busy}
      >
        Change password
      </Button>
    </Form>
  );
}
