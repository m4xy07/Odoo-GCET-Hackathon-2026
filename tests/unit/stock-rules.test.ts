import { describe, expect, it } from 'vitest';
import { reorderSuggestion, stockState } from '@/lib/services/stock-rules';

describe('stockState', () => {
  it('is out when nothing is on hand, whatever the reorder point', () => {
    expect(stockState(0, 20)).toBe('out');
    expect(stockState(0, 0)).toBe('out');
  });

  it('is low at the reorder point and below it', () => {
    expect(stockState(10, 10)).toBe('low');
    expect(stockState(8, 10)).toBe('low');
  });

  it('is ok above the reorder point', () => {
    expect(stockState(11, 10)).toBe('ok');
  });

  it('is never low for a product without a reorder point', () => {
    expect(stockState(1, 0)).toBe('ok');
  });

  it('works for decimal quantities like kg', () => {
    expect(stockState(19.5, 20)).toBe('low');
    expect(stockState(20.5, 20)).toBe('ok');
  });
});

describe('reorderSuggestion', () => {
  it('suggests the reorder quantity when that covers the gap', () => {
    expect(reorderSuggestion(8, 10, 40)).toBe(40);
  });

  it('suggests enough to reach the reorder point when the reorder quantity is smaller', () => {
    expect(reorderSuggestion(0, 20, 5)).toBe(20);
  });

  it('suggests nothing while stock is above the reorder point', () => {
    expect(reorderSuggestion(50, 5, 20)).toBe(0);
  });

  it('suggests nothing for an out of stock product with no reordering rule', () => {
    expect(reorderSuggestion(0, 0, 0)).toBe(0);
  });
});
