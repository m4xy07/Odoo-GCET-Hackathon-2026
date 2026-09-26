import type { ApiFailure } from '@/lib/types';

// Carries the server's field errors ("Short code already exists") so a form can show them next to the input
export class ApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function read<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ApiFailure | null)?.error;
    throw new ApiError(error?.message ?? 'Something went wrong, try again', error?.fields);
  }
  return body.data as T;
}

// SWR reads: useSWR<WarehouseRow[]>('/api/warehouses', fetcher)
export const fetcher = <T>(url: string) => fetch(url).then((res) => read<T>(res));

export const send = <T>(method: 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown) =>
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((res) => read<T>(res));
