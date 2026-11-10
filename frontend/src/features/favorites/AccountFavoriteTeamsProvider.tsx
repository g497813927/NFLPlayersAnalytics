import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, errorMessage } from '../../api';
import { useAuth } from '../auth/useAuth';
import { FavoritesContext } from './FavoritesContext';

interface FavoriteResponse {
  user_id: number;
  team_ids: number[];
}

export function AccountFavoriteTeamsProvider({
  userId,
  children,
}: {
  userId: number;
  children: ReactNode;
}) {
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh: refreshAccount } = useAuth();
  const generation = useRef(0);
  const writing = useRef(false);

  const apply = useCallback(
    (result: FavoriteResponse) => {
      if (result.user_id !== userId) {
        void refreshAccount();
        throw new Error('Your account changed. Refresh this page to load its favorites.');
      }
      setTeamIds(result.team_ids);
      setReady(true);
      setError(null);
    },
    [refreshAccount, userId],
  );

  const refresh = useCallback(async () => {
    if (writing.current) return;
    const request = (generation.current += 1);
    setLoading(true);
    try {
      const result = await api<FavoriteResponse>('/me/favorite-teams');
      if (request === generation.current) apply(result);
    } catch (cause) {
      if (request === generation.current) setError(errorMessage(cause));
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    void refresh();
    const synchronize = () => void refresh();
    window.addEventListener('focus', synchronize);
    return () => {
      generation.current += 1;
      window.removeEventListener('focus', synchronize);
    };
  }, [refresh]);

  async function toggle(teamId: number) {
    if (writing.current || loading || !ready) return;
    writing.current = true;
    setLoading(true);
    const request = (generation.current += 1);
    try {
      const result = await api<FavoriteResponse>(`/me/favorite-teams/${teamId}`, {
        method: teamIds.includes(teamId) ? 'DELETE' : 'PUT',
      });
      if (request === generation.current) apply(result);
    } catch (cause) {
      if (request === generation.current) setError(errorMessage(cause));
    } finally {
      writing.current = false;
      if (request === generation.current) setLoading(false);
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        teamIds,
        storageAvailable: true,
        loading: loading || !ready,
        error,
        retry: () => void refresh(),
        toggle: (teamId) => void toggle(teamId),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
