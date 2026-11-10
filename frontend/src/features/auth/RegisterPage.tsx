import { Card } from 'antd';
import { Link, Navigate } from 'react-router-dom';
import { AuthForm } from './AuthForm';
import { useAuth } from './useAuth';

export function RegisterPage() {
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
      <span className="eyebrow">FOLLOW YOUR FAVORITES</span>
      <h1>Make it your game</h1>
      <p>
        Create a normal user account to sync your teams. Use fictional details for this local demo.
      </p>
      <AuthForm mode="register" />
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Card>
  );
}
