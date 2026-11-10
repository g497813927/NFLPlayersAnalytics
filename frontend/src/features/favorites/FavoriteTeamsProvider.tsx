import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import { AccountFavoriteTeamsProvider } from './AccountFavoriteTeamsProvider';
import { GuestFavoriteTeamsProvider } from './GuestFavoriteTeamsProvider';

export function FavoriteTeamsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <GuestFavoriteTeamsProvider>
      {user ? (
        <AccountFavoriteTeamsProvider
          key={user.user_id}
          userId={user.user_id}
        >
          {children}
        </AccountFavoriteTeamsProvider>
      ) : (
        children
      )}
    </GuestFavoriteTeamsProvider>
  );
}
