import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createOperation, listOperations } from '@/lib/services/operations';
import { objectId, operationSchema, opStatus, opType } from '@/lib/validators';

// ?status=ready or ?status=ready,waiting
const listQuery = z.object({
  type: opType.optional(),
  status: z.string().transform((s) => s.split(',')).pipe(z.array(opStatus)).optional(),
  q: z.string().trim().max(80).optional(),
  warehouse: objectId.optional(),
  location: objectId.optional(),
  late: z.literal('1').transform(() => true).optional(),
});

export const GET = api(async (req) => {
  await requireUser();
  const params = [...new URL(req.url).searchParams].filter(([, value]) => value !== '');
  return ok(await listOperations(listQuery.parse(Object.fromEntries(params))));
});

export const POST = api(async (req) => {
  const user = await requireUser();
  const input = operationSchema.parse(await req.json().catch(() => ({})));
  return ok(await createOperation(input, user.id), 201);
});
