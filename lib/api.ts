import { ZodError } from 'zod';

// Throw this from a route or service to answer with a clean { error } and a status code
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, status = 200) => Response.json({ data }, { status });

// Wrap every route handler so thrown HttpError and ZodError become the contract's error shape
export function api<Ctx>(handler: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: { message: err.message, fields: err.fields } }, { status: err.status });
      }
      if (err instanceof ZodError) {
        const fields = Object.fromEntries(err.issues.map((i) => [i.path.join('.'), i.message]));
        return Response.json({ error: { message: 'Check the highlighted fields', fields } }, { status: 400 });
      }
      console.error(err);
      return Response.json({ error: { message: 'Something went wrong, try again' } }, { status: 500 });
    }
  };
}
