import { createContext } from 'react';

export interface FavoritesValue {
  teamIds: number[];
  storageAvailable: boolean;
  toggle: (teamId: number) => void;
}

export const FavoritesContext = createContext<FavoritesValue | null>(null);
