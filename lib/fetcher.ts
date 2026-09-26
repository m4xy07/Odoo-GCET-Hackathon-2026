import type { ApiFailure, ApiSuccess } from '@/lib/types';

// SWR fetcher for our API: resolves to data, throws the server's own message so the page can show it
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => null)) as
    ApiSuccess<T> | ApiFailure | null;
  if (res.ok && body && 'data' in body) return body.data;
  throw new Error(
    body && 'error' in body ? body.error.message : 'Could not load, try again',
  );
}
