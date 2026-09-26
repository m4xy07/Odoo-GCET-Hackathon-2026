import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getProductStock } from '@/lib/services/catalog';

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, { params }) => {
  await requireUser();
  return ok(await getProductStock((await params).id));
});
