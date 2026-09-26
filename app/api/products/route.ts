import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createProduct, listProducts } from '@/lib/services/catalog';
import { productSchema } from '@/lib/validators';

const filterSchema = z.object({
  q: z.string().max(60).optional(),
  category: z.string().optional(),
  state: z.enum(['ok', 'low', 'out']).optional(),
});

export const GET = api(async (req) => {
  await requireUser();
  const filters = filterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listProducts(filters));
});

export const POST = api(async (req) => {
  const user = await requireUser();
  const input = productSchema.parse(await req.json());
  return ok(await createProduct(input, user.id), 201);
});
