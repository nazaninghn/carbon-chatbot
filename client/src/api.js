// API base URL — uses env var in production, proxy in development
const BASE = import.meta.env.VITE_API_URL || '';

export function api(path, options = {}) {
  return fetch(`${BASE}${path}`, options);
}
