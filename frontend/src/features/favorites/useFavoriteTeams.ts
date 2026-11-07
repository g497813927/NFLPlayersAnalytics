import { useContext } from 'react';
import { FavoritesContext } from './FavoritesContext';

export function useFavoriteTeams() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('Favorite teams require FavoriteTeamsProvider.');
  return context;
}
