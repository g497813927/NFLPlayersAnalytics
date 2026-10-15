let latestRequestId = null;
let requestHistory = [];
const listeners = new Set();

export const subscribeToRequests = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getLatestRequestId = () => latestRequestId;
export const getRequestHistory = () => requestHistory;

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('The API is unavailable. Start the backend, then try again.');
  }
  if (!path.startsWith('/debug/') && path !== '/health') {
    const requestId = response.headers.get('X-Request-ID');
    if (requestId) {
      latestRequestId = requestId;
      requestHistory = [{ id: requestId, method, path }, ...requestHistory.filter((request) => request.id !== requestId)].slice(0, 30);
      listeners.forEach((listener) => listener());
    }
  }
  if (response.status === 204) return null;
  let data;
  try { data = await response.json(); } catch {
    throw new Error('The server returned an unreadable response. Please try again.');
  }
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'This action could not be completed. Please check your entries and try again.');
    error.fields = data?.error?.fields;
    throw error;
  }
  return data;
}

export function query(params = {}) {
  const values = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  const encoded = new URLSearchParams(values).toString();
  return encoded ? `?${encoded}` : '';
}
