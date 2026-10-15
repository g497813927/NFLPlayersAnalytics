import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const DataContext = createContext(null);
const EMPTY_LOOKUPS = { sports: [], leagues: [], seasons: [], venues: [], stat_definitions: [], teams: [], athletes: [], rosters: [], games: [] };

export function DataProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [lookups, setLookups] = useState(EMPTY_LOOKUPS);
  const [connectionError, setConnectionError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [connecting, setConnecting] = useState(true);
  const refresh = useCallback(async () => {
    setConnecting(true);
    const [healthResult, lookupResult] = await Promise.allSettled([api('/health'), api('/lookups')]);
    setHealth(healthResult.status === 'fulfilled' ? healthResult.value : null);
    if (lookupResult.status === 'fulfilled') setLookups({ ...EMPTY_LOOKUPS, ...lookupResult.value });
    const failure = [healthResult, lookupResult].find((result) => result.status === 'rejected');
    setConnectionError(failure?.reason?.message || null);
    setRevision((value) => value + 1);
    setConnecting(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <DataContext.Provider value={{ health, lookups, connectionError, connecting, refresh, revision }}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);

export function useResource(path) {
  const { revision } = useData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!path) { setData(null); setLoading(false); setError(null); return; }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api(path, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((failure) => { if (!controller.signal.aborted) { setError(failure.message); setData(null); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, revision, attempt]);
  return { data, loading, error, retry: () => setAttempt((value) => value + 1) };
}

export const athleteName = (athlete) => [athlete?.first_name, athlete?.last_name].filter(Boolean).join(' ');
export const shortDate = (value) => value ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
export const gameDate = (value) => value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export function useLabels() {
  const { lookups } = useData();
  return useMemo(() => {
    const label = (collection, idKey, name) => (id) => {
      const row = (lookups[collection] || []).find((item) => item[idKey] === id);
      return row ? name(row) : id == null ? '—' : `#${id}`;
    };
    const team = label('teams', 'team_id', (row) => row.team_name);
    const season = label('seasons', 'season_id', (row) => row.season_name);
    return {
      team, season,
      athlete: label('athletes', 'athlete_id', athleteName),
      league: label('leagues', 'league_id', (row) => row.league_name),
      venue: label('venues', 'venue_id', (row) => row.venue_name),
      stat: label('stat_definitions', 'stat_definition_id', (row) => row.stat_name),
      roster: label('rosters', 'roster_id', (row) => `${team(row.team_id)} · ${season(row.season_id)}`),
      game: label('games', 'game_id', (row) => {
        const teams = (row.participants || []).map((participant) => team(participant.team_id)).join(' vs ');
        return `${teams || `Game #${row.game_id}`} · ${shortDate(row.game_time)}`;
      }),
    };
  }, [lookups]);
}
