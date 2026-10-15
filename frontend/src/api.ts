import type { ApiErrorEnvelope, CapturedRequest, FieldError, QueryParams } from './types';

let latestRequestId: string | null = null;
let requestHistory: CapturedRequest[] = [];
const listeners = new Set<() => void>();

export const subscribeToRequests = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getLatestRequestId = () => latestRequestId;
export const getRequestHistory = () => requestHistory;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly fields?: FieldError[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'The request could not be completed. Please try again.';

function isErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = value.error;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string' &&
    (!('fields' in error) ||
      (Array.isArray(error.fields) &&
        error.fields.every(
          (field: unknown) =>
            typeof field === 'object' &&
            field !== null &&
            'field' in field &&
            typeof field.field === 'string' &&
            'message' in field &&
            typeof field.message === 'string',
        )))
  );
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: object;
  signal?: AbortSignal;
}

/** Successful JSON follows the response contract of the requested FastAPI endpoint. */
export async function api<T>(
  path: string,
  { method = 'GET', body, signal }: ApiOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('The API is unavailable. Start the backend, then try again.');
  }
  if (!path.startsWith('/debug/') && path !== '/health') {
    const requestId = response.headers.get('X-Request-ID');
    if (requestId) {
      latestRequestId = requestId;
      requestHistory = [
        { id: requestId, method, path },
        ...requestHistory.filter((request) => request.id !== requestId),
      ].slice(0, 30);
      listeners.forEach((listener) => listener());
    }
  }
  if (response.status === 204) return null as T;
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('The server returned an unreadable response. Please try again.');
  }
  if (!response.ok) {
    throw new ApiError(
      isErrorEnvelope(data)
        ? data.error.message
        : 'This action could not be completed. Please check your entries and try again.',
      isErrorEnvelope(data) ? data.error.fields : undefined,
    );
  }
  return data as T;
}

export function query(params: QueryParams = {}): string {
  const values: [string, string][] = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)]);
  const encoded = new URLSearchParams(values).toString();
  return encoded ? `?${encoded}` : '';
}
