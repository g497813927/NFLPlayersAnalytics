import { createContext } from 'react';

export interface FavoritesValue {
  teamIds: number[];
  storageAvailable: boolean;
  loading: boolean;
  error: string | null;
  retry?: () => void;
  toggle: (teamId: number) => void;
}

export const FavoritesContext = createContext<FavoritesValue | null>(null);
