import type { ReactNode } from 'react';
import { Button, Result, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading)
    return (
      <Spin tip="Loading your account">
        <div className="auth-loading" />
      </Spin>
    );
  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="Admin access required"
        subTitle="Everyone can explore the data. Only administrators can edit shared sports records or create users."
        extra={
          user ? (
            <Link to="/games">Explore games</Link>
          ) : (
            <Link to="/login">
              <Button type="primary">Sign in</Button>
            </Link>
          )
        }
      />
    );
  }
  return children;
}
