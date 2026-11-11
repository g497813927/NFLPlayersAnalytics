import { Card } from 'antd';
import { Navigate } from 'react-router-dom';
import { PasswordChangeForm } from './PasswordChangeForm';
import { useAuth } from './useAuth';

export function PasswordChangePage() {
  const { user, loading } = useAuth();
  if (!loading && !user)
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  return (
    <Card
      className="auth-card"
      loading={loading}
    >
      <h1>Change password</h1>
      <p>
        Confirm your current password to protect your account. Other devices will need to sign in
        again.
      </p>
      {user && <PasswordChangeForm key={user.user_id} />}
    </Card>
  );
}
