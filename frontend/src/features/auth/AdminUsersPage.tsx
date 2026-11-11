import { Card } from 'antd';
import { AdminUserForm } from './AdminUserForm';
import { useAuth } from './useAuth';

export function AdminUsersPage() {
  const { user } = useAuth();
  return (
    <Card className="auth-card">
      <h1>Create a user</h1>
      <p>
        Create a separate account with its own favorites. Existing accounts are never overwritten.
        Use fictional details for this prototype.
      </p>
      <AdminUserForm key={user?.user_id} />
    </Card>
  );
}
