import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { listLowStock } from '@/lib/services/catalog';

export const GET = api(async () => {
  await requireUser();
  return ok(await listLowStock());
});
