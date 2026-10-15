import { createContext } from 'react';
import type { Health, Lookups } from '../types';

export interface DataContextValue {
  health: Health | null;
  lookups: Lookups;
  connectionError: string | null;
  connecting: boolean;
  refresh: () => Promise<void>;
  revision: number;
}
export const DataContext = createContext<DataContextValue | null>(null);
