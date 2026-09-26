import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getDashboard } from '@/lib/services/dashboard';
import { objectId, opStatus, opType } from '@/lib/validators';

// ?type=OUT&status=ready,waiting&warehouse=<id>&location=<id>&category=<id>
const query = z.object({
  type: opType.optional(),
  status: z
    .string()
    .transform((s) => s.split(','))
    .pipe(z.array(opStatus))
    .optional(),
  warehouse: objectId.optional(),
  location: objectId.optional(),
  category: objectId.optional(),
});

export const GET = api(async (req) => {
  await requireUser();
  const params = [...new URL(req.url).searchParams].filter(
    ([, value]) => value !== '',
  );
  return ok(await getDashboard(query.parse(Object.fromEntries(params))));
});
