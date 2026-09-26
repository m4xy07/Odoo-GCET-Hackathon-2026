import { z } from 'zod';
import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getMoveTrend } from '@/lib/services/dashboard';
import { objectId } from '@/lib/validators';

// ?warehouse=<id> or ?location=<id>, same values as the dashboard filters
const query = z.object({
  warehouse: objectId.optional(),
  location: objectId.optional(),
});

export const GET = api(async (req) => {
  await requireUser();
  const params = [...new URL(req.url).searchParams].filter(
    ([, value]) => value !== '',
  );
  return ok(await getMoveTrend(query.parse(Object.fromEntries(params))));
});
