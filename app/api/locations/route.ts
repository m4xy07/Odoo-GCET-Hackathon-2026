import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createLocation, listLocations } from '@/lib/services/catalog';
import { locationSchema } from '@/lib/validators';

const filterSchema = z.object({
  type: z.enum(['internal', 'vendor', 'customer', 'adjustment']).optional(),
  warehouse: z.string().optional(),
});

export const GET = api(async (req) => {
  await requireUser();
  const filter = filterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listLocations(filter));
});

export const POST = api(async (req) => {
  await requireUser();
  const input = locationSchema.parse(await req.json());
  return ok(await createLocation(input), 201);
});
