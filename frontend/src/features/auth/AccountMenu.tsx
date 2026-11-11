import { useState } from 'react';
import { App, Button, Dropdown } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { errorMessage } from '../../api';
import { useAuth } from './useAuth';

export function AccountMenu() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const { message } = App.useApp();

  async function logout() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (cause) {
      void message.error(errorMessage(cause));
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) return <Button loading>Account</Button>;
  if (!user)
    return (
      <Link
        className="account-sign-in"
        to="/login"
      >
        Sign in
      </Link>
    );

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          {
            key: 'identity',
            label: `${user.display_name} · ${isAdmin ? 'Admin' : 'User'}`,
            disabled: true,
          },
          ...(isAdmin
            ? [
                { key: 'manage', label: <Link to="/manage">Manage sports data</Link> },
                { key: 'users', label: <Link to="/admin/users">Create a user</Link> },
              ]
            : []),
          { key: 'password', label: <Link to="/account/password">Change password</Link> },
          { key: 'logout', label: 'Sign out', onClick: () => void logout() },
        ],
      }}
    >
      <Button
        className="account-button"
        icon={<UserOutlined />}
        loading={signingOut}
      >
        <span>{user.display_name}</span>
      </Button>
    </Dropdown>
  );
}
