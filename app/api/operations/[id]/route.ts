import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { updateLines } from '@/lib/services/inventory';
import { getOperation, updateOperation } from '@/lib/services/operations';
import { operationSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, { params }) => {
  await requireUser();
  return ok(await getOperation((await params).id));
});

// The form always sends everything. A draft takes it all, waiting and ready only take the
// lines because a delivery may be holding reserved stock.
export const PATCH = api<Ctx>(async (req, { params }) => {
  await requireUser();
  const { id } = await params;
  const input = operationSchema.parse(await req.json().catch(() => ({})));
  const { status } = await getOperation(id);
  return ok(status === 'draft' ? await updateOperation(id, input) : await updateLines(id, input.lines));
});
