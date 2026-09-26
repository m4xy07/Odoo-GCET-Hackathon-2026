import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getOperation, updateOperation } from '@/lib/services/operations';
import { operationSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, { params }) => {
  await requireUser();
  return ok(await getOperation((await params).id));
});

export const PATCH = api<Ctx>(async (req, { params }) => {
  await requireUser();
  const input = operationSchema.parse(await req.json().catch(() => ({})));
  return ok(await updateOperation((await params).id, input));
});
