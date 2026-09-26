import { HttpError, api, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { applyAction, type StockAction } from '@/lib/services/inventory';

type Ctx = { params: Promise<{ id: string; action: string }> };

const actions: StockAction[] = ['confirm', 'check', 'validate', 'cancel'];

// POST /api/operations/:id/confirm | check | validate | cancel
export const POST = api<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id, action } = await params;
  if (!actions.includes(action as StockAction)) throw new HttpError(404, 'Unknown action');
  return ok(await applyAction(id, action as StockAction, user.id));
});
