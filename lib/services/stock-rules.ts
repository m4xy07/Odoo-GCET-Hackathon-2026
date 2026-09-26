import type { ProductRow } from '@/lib/types';

// Stock rules with no database, shared by the API, the pages and the unit tests.

// out = nothing on hand, low = at or below the reorder point
export function stockState(onHand: number, reorderMin: number): ProductRow['stockState'] {
  if (onHand <= 0) return 'out';
  return onHand <= reorderMin ? 'low' : 'ok';
}

// How much to order when a product is low or out: the usual reorder quantity,
// or enough to get back to the reorder point if that is more. 0 means no order needed.
export function reorderSuggestion(onHand: number, reorderMin: number, reorderQty: number) {
  if (stockState(onHand, reorderMin) === 'ok') return 0;
  return Math.max(reorderQty, reorderMin - onHand, 0);
}
