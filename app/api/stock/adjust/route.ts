import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { adjustStock } from '@/lib/services/inventory';
import { adjustSchema } from '@/lib/validators';

export const POST = api(async (req) => {
  const user = await requireUser();
  const input = adjustSchema.parse(await req.json().catch(() => ({})));
  return ok(await adjustStock(input, user.id), 201);
});
