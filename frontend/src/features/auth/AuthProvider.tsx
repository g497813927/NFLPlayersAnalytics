import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError, errorMessage, setCsrfToken } from '../../api';
import { AuthContext } from './AuthContext';
import type { AccountResponse, AccountUser, Credentials, Registration } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const mutationInFlight = useRef(false);

  const applyAccount = useCallback((result: AccountResponse) => {
    setCsrfToken(result.csrf_token);
    setUser(result.user);
    setError(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (mutationInFlight.current) return;
    const request = (generation.current += 1);
    try {
      const result = await api<AccountResponse>('/auth/me');
      if (generation.current === request) applyAccount(result);
    } catch (cause) {
      if (generation.current !== request) return;
      setError(errorMessage(cause));
      setLoading(false);
    }
  }, [applyAccount]);

  useEffect(() => {
    void refresh();
    const synchronize = () => void refresh();
    const expire = () => {
      generation.current += 1;
      applyAccount({ user: null, csrf_token: null });
    };
    window.addEventListener('focus', synchronize);
    window.addEventListener('account-session-expired', expire);
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel.current = new BroadcastChannel('nfl-account-updates');
        channel.current.onmessage = synchronize;
      } catch {
        // Some private browsing contexts disallow channels; focus still refreshes.
        channel.current = null;
      }
    }
    return () => {
      generation.current += 1;
      window.removeEventListener('focus', synchronize);
      window.removeEventListener('account-session-expired', expire);
      channel.current?.close();
    };
  }, [applyAccount, refresh]);

  async function authenticate(path: string, values: Credentials | Registration) {
    mutationInFlight.current = true;
    const request = (generation.current += 1);
    try {
      const result = await api<AccountResponse>(path, { method: 'POST', body: values });
      if (generation.current === request) {
        applyAccount(result);
        channel.current?.postMessage('changed');
      }
    } finally {
      mutationInFlight.current = false;
    }
  }

  async function signOut() {
    mutationInFlight.current = true;
    generation.current += 1;
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (cause) {
      if (!(cause instanceof ApiError && cause.status === 401)) throw cause;
    } finally {
      mutationInFlight.current = false;
    }
    applyAccount({ user: null, csrf_token: null });
    channel.current?.postMessage('changed');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin: user?.role === 'admin',
        refresh,
        signIn: (values) => authenticate('/auth/login', values),
        register: (values) => authenticate('/auth/register', values),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
