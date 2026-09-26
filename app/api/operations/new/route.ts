import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { newOperation } from '@/lib/services/operations';

const query = z.object({ type: z.enum(['IN', 'OUT', 'INT'], 'Pick receipt, delivery or transfer') });

// Blank form for NEW: default locations, next reference, Responsible = you
export const GET = api(async (req) => {
  const user = await requireUser();
  const { type } = query.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await newOperation(type, { id: user.id, name: user.name }));
});
