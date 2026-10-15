import { Alert, Button } from 'antd';
import { useData } from '../hooks/useData';

export function WorkspaceNotice() {
  const { health, connectionError, connecting, refresh } = useData();
  if (connectionError)
    return (
      <Alert
        className="connection-alert"
        type="warning"
        showIcon
        message="The demo database is not ready"
        description={connectionError}
        action={
          <Button loading={connecting} onClick={refresh}>
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
  return null;
}
