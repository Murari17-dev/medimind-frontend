import { supabase } from './supabase';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://medimind-backend-8mbb.onrender.com'
).replace(/\/$/, '');

// Free hosting tiers can take a while to wake up, and OCR is slow.
const DEFAULT_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type ApiRequestInit = RequestInit & { timeoutMs?: number };

export async function apiFetch(path: string, options: ApiRequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${session.access_token}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError(
        'The MediMind server took too long to respond. Please try again.',
        408,
      );
    }
    throw new ApiError(
      'Could not reach the MediMind server. Check your connection and try again.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    const detail = body?.detail;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(' ');
    }
  } catch {
    // The body was not JSON; use the fallback.
  }

  return fallback;
}

export async function apiJson<T>(
  path: string,
  options: ApiRequestInit = {},
  fallbackError = 'Something went wrong. Please try again.',
): Promise<T> {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    throw new ApiError(
      await readErrorMessage(response, fallbackError),
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export const jsonRequest = (method: string, body: unknown): ApiRequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const fetcher = <T>(path: string) => apiJson<T>(path);
