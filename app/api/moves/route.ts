import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { listMoves } from '@/lib/services/inventory';
import { objectId, opType } from '@/lib/validators';

// from and to are dates, e.g. ?from=2026-09-01&to=2026-09-30
const query = z.object({
  q: z.string().trim().max(80).optional(),
  type: opType.optional(),
  product: objectId.optional(),
  location: objectId.optional(),
  from: z.coerce.date('Pick a valid from date').optional(),
  to: z.coerce.date('Pick a valid to date').optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const GET = api(async (req) => {
  await requireUser();
  const params = [...new URL(req.url).searchParams].filter(([, value]) => value !== '');
  return ok(await listMoves(query.parse(Object.fromEntries(params))));
});
