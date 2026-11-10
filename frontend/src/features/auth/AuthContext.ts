import { createContext } from 'react';
import type { AccountUser, Credentials, Registration } from './types';

export interface AuthValue {
  user: AccountUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signIn: (values: Credentials) => Promise<void>;
  register: (values: Registration) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);
