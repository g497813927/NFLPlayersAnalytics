export interface AccountUser {
  user_id: number;
  email: string;
  display_name: string;
  role: 'fan' | 'analyst' | 'admin';
}

export interface AccountResponse {
  user: AccountUser | null;
  csrf_token: string | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  display_name: string;
}
