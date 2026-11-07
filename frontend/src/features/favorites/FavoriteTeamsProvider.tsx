import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { FavoritesContext } from './FavoritesContext';
import { FAVORITES_KEY, parseFavorites, readFavorites } from './favoriteStorage';

export function FavoriteTeamsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readFavorites);

  useEffect(() => {
    function synchronize(event: StorageEvent) {
      if (event.key === FAVORITES_KEY || event.key === null) {
        setState({ teamIds: parseFavorites(event.newValue), storageAvailable: true });
      }
    }
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);

  function toggle(teamId: number) {
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
    <FavoritesContext.Provider value={{ ...state, toggle }}>{children}</FavoritesContext.Provider>
  );
}
