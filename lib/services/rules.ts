import type { MoveRow, OperationDetail, OpStatus, OpType } from '@/lib/types';

// The operation rules from the contract, kept free of the database so they are easy to test.

export type OpAction = OperationDetail['actions'][number];

// kg and litre quantities are decimals, round so 10.3 - 10.1 does not become 0.2000000000000011
const round = (n: number) => Math.round(n * 1000) / 1000;

// null means the action is not allowed from this status.
// allAvailable only matters for deliveries: enough free stock goes to ready, otherwise waiting.
export function nextStatus(type: OpType, status: OpStatus, action: OpAction, allAvailable = true): OpStatus | null {
  if (action === 'cancel') return status === 'done' || status === 'canceled' ? null : 'canceled';
  if (action === 'confirm' && status === 'draft' && type !== 'ADJ') {
    return type === 'OUT' && !allAvailable ? 'waiting' : 'ready';
  }
  if (action === 'check' && status === 'waiting') return allAvailable ? 'ready' : 'waiting';
  if (action === 'validate' && (status === 'ready' || (status === 'draft' && type === 'ADJ'))) return 'done';
  return null;
}

// The buttons the form shows, straight from the state machine above
export function allowedActions(type: OpType, status: OpStatus): OpAction[] {
  if (status === 'done') return ['print'];
  const actions: OpAction[] = ['confirm', 'check', 'validate', 'cancel'];
  return actions.filter((action) => nextStatus(type, status, action) !== null);
}

// draft is fully editable, waiting and ready only allow line quantity changes, done and canceled are locked
export const canEdit = (status: OpStatus) => status === 'draft' || status === 'waiting' || status === 'ready';

// Two lines of the same product draw from the same free stock, so demand adds up line by line
export function lineAvailability(lines: { product: string; quantity: number }[], freeByProduct: Record<string, number>) {
  const left = { ...freeByProduct };
  return lines.map(({ product, quantity }) => {
    const free = left[product] ?? 0;
    left[product] = round(free - quantity);
    return free >= quantity;
  });
}

// Counted vs on hand. The ledger stores a positive quantity, the direction says which way it moved.
export function adjustmentDiff(current: number, counted: number): { quantity: number; direction: 'in' | 'out' | 'none' } {
  const diff = round(counted - current);
  if (diff === 0) return { quantity: 0, direction: 'none' };
  return { quantity: Math.abs(diff), direction: diff > 0 ? 'in' : 'out' };
}

// Move History paints in green and out red
export function moveDirection(type: OpType, toInternal: boolean): MoveRow['direction'] {
  if (type === 'INT') return 'internal';
  if (type === 'ADJ') return toInternal ? 'in' : 'out';
  return type === 'IN' ? 'in' : 'out';
}

export function isLate(scheduledDate: Date, status: OpStatus, now = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return scheduledDate < startOfToday && status !== 'done' && status !== 'canceled';
}
