import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createWarehouse, listWarehouses } from '@/lib/services/catalog';
import { warehouseSchema } from '@/lib/validators';

export const GET = api(async () => {
  await requireUser();
  return ok(await listWarehouses());
});

export const POST = api(async (req) => {
  await requireUser();
  const input = warehouseSchema.parse(await req.json());
  return ok(await createWarehouse(input), 201);
});
