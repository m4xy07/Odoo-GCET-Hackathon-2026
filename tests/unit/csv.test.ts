import { describe, expect, it } from 'vitest';
import { toCsv } from '@/components/products/csv';

describe('toCsv', () => {
  it('writes plain rows with commas and CRLF line ends', () => {
    expect(toCsv([['Product', 'On hand'], ['Desk', 41]])).toBe('Product,On hand\r\nDesk,41');
  });

  it('quotes cells with commas or quotes', () => {
    expect(toCsv([['Desk, large', 'The "big" one']])).toBe('"Desk, large","The ""big"" one"');
  });

  it('stops text from running as a spreadsheet formula', () => {
    expect(toCsv([['=HYPERLINK("x")', '+1', '@SUM(A1)']])).toBe(`"'=HYPERLINK(""x"")",'+1,'@SUM(A1)`);
  });

  it('keeps negative numbers as numbers', () => {
    expect(toCsv([[-3, 0.5]])).toBe('-3,0.5');
  });
});
