import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { archiveProduct, getProduct, updateProduct } from '@/lib/services/catalog';
import { productSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, { params }) => {
  await requireUser();
  return ok(await getProduct((await params).id));
});

export const PATCH = api<Ctx>(async (req, { params }) => {
  await requireUser();
  const input = productSchema.parse(await req.json());
  return ok(await updateProduct((await params).id, input));
});

// archives, see archiveProduct
export const DELETE = api<Ctx>(async (_req, { params }) => {
  await requireUser();
  return ok(await archiveProduct((await params).id));
});
