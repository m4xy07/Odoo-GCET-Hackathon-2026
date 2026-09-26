// Every API route answers { data } or { error: { message, fields } }, so reads and writes unwrap the same way

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new ApiError(json?.error?.message ?? 'Something went wrong, try again', res.status, json?.error?.fields);
  return json.data as T;
}

export const fetcher = <T>(url: string) => request<T>(url);
