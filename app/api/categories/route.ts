import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createCategory, listCategories } from '@/lib/services/catalog';
import { categorySchema } from '@/lib/validators';

export const GET = api(async () => {
  await requireUser();
  return ok(await listCategories());
});

export const POST = api(async (req) => {
  await requireUser();
  const input = categorySchema.parse(await req.json());
  return ok(await createCategory(input), 201);
});
