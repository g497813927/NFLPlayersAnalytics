import { useContext } from 'react';
import { DataContext } from '../state/DataContext';
import type { DataContextValue } from '../state/DataContext';

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error('DataProvider is required for database views.');
  return context;
}
