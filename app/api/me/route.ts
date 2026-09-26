import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import type { Me } from '@/lib/types';

export const GET = api(async () => {
  const user = await requireUser();
  const me: Me = { id: user.id, loginId: user.loginId, email: user.email, name: user.name, role: user.role };
  return ok(me);
});
