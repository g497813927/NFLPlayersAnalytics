import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import { FavoritesContext } from './FavoritesContext';
import { FAVORITES_KEY, readFavorites } from './favoriteStorage';

export function GuestFavoriteTeamsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readFavorites);
  const { loading } = useAuth();

  useEffect(() => {
    function synchronize(event: StorageEvent) {
      if (event.key === FAVORITES_KEY || event.key === null) setState(readFavorites());
    }
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);

  function toggle(teamId: number) {
    if (loading) return;
    const teamIds = state.teamIds.includes(teamId)
      ? state.teamIds.filter((id) => id !== teamId)
      : [...state.teamIds, teamId];
    let storageAvailable = true;
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(teamIds));
    } catch {
      storageAvailable = false;
    }
    setState({ teamIds, storageAvailable });
  }

  return (
    <FavoritesContext.Provider value={{ ...state, toggle, loading, error: null }}>
      {children}
    </FavoritesContext.Provider>
  );
}
