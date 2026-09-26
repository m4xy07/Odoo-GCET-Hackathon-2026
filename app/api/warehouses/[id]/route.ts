import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { deleteWarehouse, updateWarehouse } from '@/lib/services/catalog';
import { warehouseSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = api<Ctx>(async (req, { params }) => {
  await requireUser();
  const input = warehouseSchema.parse(await req.json());
  return ok(await updateWarehouse((await params).id, input));
});

export const DELETE = api<Ctx>(async (_req, { params }) => {
  await requireUser();
  return ok(await deleteWarehouse((await params).id));
});
