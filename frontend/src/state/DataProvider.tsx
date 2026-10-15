import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, errorMessage } from '../api';
import type { Health, Lookups } from '../types';
import { DataContext } from './DataContext';

const EMPTY_LOOKUPS: Lookups = {
  sports: [],
  leagues: [],
  seasons: [],
  venues: [],
  stat_definitions: [],
  teams: [],
  athletes: [],
  rosters: [],
  games: [],
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [lookups, setLookups] = useState(EMPTY_LOOKUPS);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [connecting, setConnecting] = useState(true);
  const refresh = useCallback(async () => {
    setConnecting(true);
    const [healthResult, lookupResult] = await Promise.allSettled([
      api<Health>('/health'),
      api<Lookups>('/lookups'),
    ]);
    setHealth(healthResult.status === 'fulfilled' ? healthResult.value : null);
    if (lookupResult.status === 'fulfilled')
      setLookups({ ...EMPTY_LOOKUPS, ...lookupResult.value });
    const failure = [healthResult, lookupResult].find((result) => result.status === 'rejected');
    setConnectionError(failure ? errorMessage(failure.reason) : null);
    setRevision((value) => value + 1);
    setConnecting(false);
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return (
    <DataContext.Provider
      value={{ health, lookups, connectionError, connecting, refresh, revision }}
    >
      {children}
    </DataContext.Provider>
  );
}
