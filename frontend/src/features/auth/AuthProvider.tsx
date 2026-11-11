import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError, errorMessage, setCsrfToken } from '../../api';
import { AuthContext } from './AuthContext';
import type {
  AccountResponse,
  AccountUser,
  Credentials,
  PasswordChange,
  Registration,
} from './types';

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
    window.addEventListener('focus', synchronize);
    // A late 401 may belong to a previous session. Read the current cookie's
    // account instead of clearing a newer sign-in and its CSRF token.
    window.addEventListener('account-session-expired', synchronize);
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
      window.removeEventListener('account-session-expired', synchronize);
      channel.current?.close();
    };
  }, [refresh]);

  async function authenticate(path: string, values: Credentials | Registration | PasswordChange) {
    mutationInFlight.current = true;
    const request = (generation.current += 1);
    try {
      const result = await api<AccountResponse>(path, { method: 'POST', body: values });
      if (generation.current === request) {
        applyAccount(result);
        channel.current?.postMessage('changed');
      }
    } catch (cause) {
      if (path === '/auth/password' && cause instanceof ApiError && cause.status === 401) {
        mutationInFlight.current = false;
        await refresh();
      }
      throw cause;
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
        changePassword: (values) => authenticate('/auth/password', values),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
