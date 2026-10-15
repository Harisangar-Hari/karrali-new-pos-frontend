import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

/**
 * Primary axios client. Sends cookies with every request and retries
 * once after a successful /auth/refresh if a 401 is returned.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Bare client used ONLY for the refresh call — no interceptors, so a 401
 * on /auth/refresh itself can't loop back into the retry logic.
 */
const bareClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshInFlight: Promise<void> | null = null;

/**
 * Coalesces concurrent refresh attempts into a single network call.
 */
async function refreshSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = bareClient
      .post('/auth/refresh')
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Paths where a 401 must NOT trigger a refresh attempt:
 *   - /auth/login   → bad credentials, refreshing won't help
 *   - /auth/refresh → already the refresh call; avoid recursion
 *   - /auth/logout  → user is (or should be) gone; don't resurrect session
 */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function shouldAttemptRefresh(url: string | undefined): boolean {
  if (!url) return true;
  return !NO_REFRESH_PATHS.some((p) => url.includes(p));
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retried &&
      shouldAttemptRefresh(original.url)
    ) {
      original._retried = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        // Refresh failed → fall through and reject with the original error.
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Convenience wrapper for typed GET/POST/etc — kept thin on purpose so
 * TanStack Query can consume it directly.
 */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}