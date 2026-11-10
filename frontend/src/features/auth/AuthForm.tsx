import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api';
import { useAuth } from './useAuth';
import type { Registration } from './types';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, register } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registering = mode === 'register';

  async function submit(values: Registration) {
    setBusy(true);
    setError(null);
    try {
      if (registering) await register(values);
      else await signIn({ email: values.email, password: values.password });
      navigate('/games', { replace: true });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form<Registration>
      layout="vertical"
      onFinish={(values) => void submit(values)}
      requiredMark={false}
    >
      {error && (
        <Alert
          className="error-notice"
          type="error"
          showIcon
          message={error}
        />
      )}
      {registering && (
        <Form.Item
          name="display_name"
          label="Display name"
          rules={[{ required: true, whitespace: true, max: 100 }]}
        >
          <Input
            autoComplete="nickname"
            maxLength={100}
          />
        </Form.Item>
      )}
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, type: 'email', max: 254 }]}
      >
        <Input
          autoComplete="email"
          type="email"
          maxLength={254}
        />
      </Form.Item>
      <Form.Item
        name="password"
        label="Password"
        extra={registering ? 'Use 12–128 characters.' : undefined}
        rules={[{ required: true, min: registering ? 12 : 1, max: 128 }]}
      >
        <Input.Password
          autoComplete={registering ? 'new-password' : 'current-password'}
          maxLength={128}
        />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        block
        loading={busy}
      >
        {registering ? 'Create account' : 'Sign in'}
      </Button>
    </Form>
  );
}
