import type { OpStatus, OpType } from '@/lib/types';

// URL segment under /operations for each type, the same ones the lists use
export const SLUG_TYPE = { receipts: 'IN', deliveries: 'OUT', transfers: 'INT', adjustments: 'ADJ' } as const;
export type OpSlug = keyof typeof SLUG_TYPE;

export const TYPE_SLUG: Record<OpType, OpSlug> = { IN: 'receipts', OUT: 'deliveries', INT: 'transfers', ADJ: 'adjustments' };

export const TYPE_TITLE: Record<OpType, string> = {
  IN: 'Receipt',
  OUT: 'Delivery',
  INT: 'Internal Transfer',
  ADJ: 'Adjustment',
};

// The status pill on the form, straight from the mockup: Draft > Ready > Done
export const STEPS: Record<OpType, OpStatus[]> = {
  IN: ['draft', 'ready', 'done'],
  OUT: ['draft', 'waiting', 'ready', 'done'],
  INT: ['draft', 'ready', 'done'],
  ADJ: ['draft', 'done'],
};
