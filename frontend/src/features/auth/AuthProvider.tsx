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
  const mutationQueue = useRef(Promise.resolve());
  const pendingMutations = useRef(0);

  const applyAccount = useCallback((result: AccountResponse) => {
    setCsrfToken(result.csrf_token);
    setUser(result.user);
    setError(null);
    setLoading(false);
  }, []);

  const restoreAccount = useCallback(async () => {
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

  const refresh = useCallback(async () => {
    if (pendingMutations.current) return;
    await restoreAccount();
  }, [restoreAccount]);

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

  function enqueueMutation(operation: () => Promise<void>) {
    pendingMutations.current += 1;
    if (pendingMutations.current === 1) generation.current += 1;
    const result = mutationQueue.current.then(operation).finally(() => {
      pendingMutations.current -= 1;
    });
    // Keep later actions runnable after a rejection. Each caller still receives
    // its own error, and logout uses the cookie/CSRF token from the prior action.
    mutationQueue.current = result.catch(() => undefined);
    return result;
  }

  function authenticate(path: string, values: Credentials | Registration | PasswordChange) {
    return enqueueMutation(async () => {
      const request = (generation.current += 1);
      try {
        const result = await api<AccountResponse>(path, { method: 'POST', body: values });
        if (generation.current === request) {
          applyAccount(result);
          channel.current?.postMessage('changed');
        }
      } catch (cause) {
        if (path === '/auth/password' && cause instanceof ApiError && cause.status === 401) {
          await restoreAccount();
        }
        throw cause;
      }
    });
  }

  function signOut() {
    return enqueueMutation(async () => {
      generation.current += 1;
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch (cause) {
        if (!(cause instanceof ApiError && cause.status === 401)) throw cause;
      }
      applyAccount({ user: null, csrf_token: null });
      channel.current?.postMessage('changed');
    });
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
