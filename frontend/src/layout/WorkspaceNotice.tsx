import { Alert, Button } from 'antd';
import { useData } from '../hooks/useData';
import { useAuth } from '../features/auth/useAuth';

export function WorkspaceNotice() {
  const { health, connectionError, connecting, refresh } = useData();
  const { error: accountError, refresh: refreshAccount } = useAuth();
  if (connectionError)
    return (
      <Alert
        className="connection-alert"
        type="warning"
        showIcon
        message="The demo database is not ready"
        description={connectionError}
        action={
          <Button
            loading={connecting}
            onClick={refresh}
          >
            Reconnect
          </Button>
        }
      />
    );
  if (health && !health.initialized)
    return (
      <Alert
        className="connection-alert"
        type="info"
        showIcon
        message="Initialize and seed the database to start exploring"
        description="Follow the database setup commands in the project README, then reconnect."
        action={<Button onClick={refresh}>Reconnect</Button>}
      />
    );
  if (accountError)
    return (
      <Alert
        className="connection-alert"
        type="warning"
        showIcon
        message="Your account could not be loaded"
        description={accountError}
        action={<Button onClick={() => void refreshAccount()}>Retry</Button>}
      />
    );
  return null;
}
