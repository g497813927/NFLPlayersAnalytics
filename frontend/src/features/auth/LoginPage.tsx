import { Card } from 'antd';
import { Link, Navigate } from 'react-router-dom';
import { AuthForm } from './AuthForm';
import { useAuth } from './useAuth';

export function LoginPage() {
  const { user, loading } = useAuth();
  if (user)
    return (
      <Navigate
        to="/games"
        replace
      />
    );
  return (
    <Card
      className="auth-card"
      loading={loading}
    >
      <span className="eyebrow">YOUR TEAMS, EVERYWHERE</span>
      <h1>Welcome back</h1>
      <p>Sign in to keep your favorite teams with you across devices.</p>
      <AuthForm mode="login" />
      <p>
        New here? <Link to="/register">Create an account</Link>
      </p>
      <small>Admin accounts use the same sign-in screen.</small>
    </Card>
  );
}
