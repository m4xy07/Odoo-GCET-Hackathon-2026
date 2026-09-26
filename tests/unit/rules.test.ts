import { describe, expect, it } from 'vitest';
import {
  adjustmentDiff,
  allowedActions,
  canEdit,
  isLate,
  lineAvailability,
  moveDirection,
  nextStatus,
} from '@/lib/services/rules';

describe('nextStatus', () => {
  it('moves a receipt draft to ready on To Do, then done on Validate', () => {
    expect(nextStatus('IN', 'draft', 'confirm')).toBe('ready');
    expect(nextStatus('IN', 'ready', 'validate')).toBe('done');
  });

  it('does not let a receipt skip To Do', () => {
    expect(nextStatus('IN', 'draft', 'validate')).toBeNull();
  });

  it('follows the same path for an internal transfer', () => {
    expect(nextStatus('INT', 'draft', 'confirm')).toBe('ready');
    expect(nextStatus('INT', 'ready', 'validate')).toBe('done');
  });

  it('sends a delivery to waiting when stock is short, ready when it is not', () => {
    expect(nextStatus('OUT', 'draft', 'confirm', false)).toBe('waiting');
    expect(nextStatus('OUT', 'draft', 'confirm', true)).toBe('ready');
  });

  it('keeps a waiting delivery waiting until stock arrives', () => {
    expect(nextStatus('OUT', 'waiting', 'check', false)).toBe('waiting');
    expect(nextStatus('OUT', 'waiting', 'check', true)).toBe('ready');
    expect(nextStatus('OUT', 'waiting', 'validate')).toBeNull();
  });

  it('validates an adjustment straight from draft', () => {
    expect(nextStatus('ADJ', 'draft', 'validate')).toBe('done');
    expect(nextStatus('ADJ', 'draft', 'confirm')).toBeNull();
  });

  it('cancels anything that is not done or already canceled', () => {
    for (const status of ['draft', 'waiting', 'ready'] as const) {
      expect(nextStatus('OUT', status, 'cancel')).toBe('canceled');
    }
    expect(nextStatus('OUT', 'done', 'cancel')).toBeNull();
    expect(nextStatus('OUT', 'canceled', 'cancel')).toBeNull();
  });

  it('never moves a done operation', () => {
    for (const action of ['confirm', 'check', 'validate', 'cancel'] as const) {
      expect(nextStatus('IN', 'done', action)).toBeNull();
    }
  });
});

describe('allowedActions', () => {
  it('matches the buttons on the receipt and delivery forms', () => {
    expect(allowedActions('IN', 'draft')).toEqual(['confirm', 'cancel']);
    expect(allowedActions('IN', 'ready')).toEqual(['validate', 'cancel']);
    expect(allowedActions('OUT', 'waiting')).toEqual(['check', 'cancel']);
    expect(allowedActions('ADJ', 'draft')).toEqual(['validate', 'cancel']);
  });

  it('only offers Print once done, and nothing once canceled', () => {
    expect(allowedActions('IN', 'done')).toEqual(['print']);
    expect(allowedActions('IN', 'canceled')).toEqual([]);
  });
});

describe('canEdit', () => {
  it('locks done and canceled operations', () => {
    expect(canEdit('draft')).toBe(true);
    expect(canEdit('waiting')).toBe(true);
    expect(canEdit('ready')).toBe(true);
    expect(canEdit('done')).toBe(false);
    expect(canEdit('canceled')).toBe(false);
  });
});

describe('lineAvailability', () => {
  it('marks a line red when free stock is below the quantity', () => {
    expect(lineAvailability([{ product: 'desk', quantity: 6 }], { desk: 5 })).toEqual([false]);
    expect(lineAvailability([{ product: 'desk', quantity: 6 }], { desk: 6 })).toEqual([true]);
  });

  it('treats a product with no stock record as zero', () => {
    expect(lineAvailability([{ product: 'chair', quantity: 1 }], {})).toEqual([false]);
  });

  it('adds up two lines of the same product', () => {
    const lines = [
      { product: 'desk', quantity: 4 },
      { product: 'desk', quantity: 4 },
    ];
    expect(lineAvailability(lines, { desk: 6 })).toEqual([true, false]);
  });

  it('handles decimal quantities without float drift', () => {
    const lines = [
      { product: 'steel', quantity: 0.1 },
      { product: 'steel', quantity: 0.2 },
    ];
    expect(lineAvailability(lines, { steel: 0.3 })).toEqual([true, true]);
  });
});

describe('adjustmentDiff', () => {
  it('logs damaged stock as an outgoing move', () => {
    expect(adjustmentDiff(80, 77)).toEqual({ quantity: 3, direction: 'out' });
  });

  it('logs found stock as an incoming move', () => {
    expect(adjustmentDiff(10, 12.5)).toEqual({ quantity: 2.5, direction: 'in' });
  });

  it('reports nothing to move when the count matches', () => {
    expect(adjustmentDiff(50, 50)).toEqual({ quantity: 0, direction: 'none' });
  });

  it('rounds decimal differences', () => {
    expect(adjustmentDiff(10.1, 10.3)).toEqual({ quantity: 0.2, direction: 'in' });
  });
});

describe('moveDirection', () => {
  it('colors receipts in, deliveries out, transfers neutral', () => {
    expect(moveDirection('IN', true)).toBe('in');
    expect(moveDirection('OUT', false)).toBe('out');
    expect(moveDirection('INT', true)).toBe('internal');
  });

  it('colors an adjustment by where the stock went', () => {
    expect(moveDirection('ADJ', true)).toBe('in');
    expect(moveDirection('ADJ', false)).toBe('out');
  });
});

describe('isLate', () => {
  const now = new Date(2026, 8, 26, 14, 0);

  it('is late when scheduled before today and still open', () => {
    expect(isLate(new Date(2026, 8, 25, 18, 0), 'ready', now)).toBe(true);
  });

  it('is not late when scheduled earlier today', () => {
    expect(isLate(new Date(2026, 8, 26, 9, 0), 'ready', now)).toBe(false);
  });

  it('is never late once done or canceled', () => {
    expect(isLate(new Date(2026, 8, 1), 'done', now)).toBe(false);
    expect(isLate(new Date(2026, 8, 1), 'canceled', now)).toBe(false);
  });
});
