import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { listStock } from '@/lib/services/catalog';

const filterSchema = z.object({
  warehouse: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  q: z.string().max(60).optional(),
});

export const GET = api(async (req) => {
  await requireUser();
  const filters = filterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listStock(filters));
});
