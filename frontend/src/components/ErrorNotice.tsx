import { Alert, Button } from 'antd';

export function ErrorNotice({ error, retry }: { error: string | null; retry?: () => void }) {
  if (!error) return null;
  return (
    <Alert
      className="error-notice"
      type="error"
      showIcon
      message="Unable to complete the request"
      description={error}
      action={
        retry && (
          <Button size="small" onClick={retry}>
            Try again
          </Button>
        )
      }
    />
  );
}
