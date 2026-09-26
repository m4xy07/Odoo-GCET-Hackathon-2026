import { api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { deleteLocation, updateLocation } from '@/lib/services/catalog';
import { locationSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = api<Ctx>(async (req, { params }) => {
  await requireUser();
  const input = locationSchema.parse(await req.json());
  return ok(await updateLocation((await params).id, input));
});

export const DELETE = api<Ctx>(async (_req, { params }) => {
  await requireUser();
  return ok(await deleteLocation((await params).id));
});
