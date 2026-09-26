import { describe, expect, it } from 'vitest';
import { formatReference } from '@/lib/services/references';

describe('formatReference', () => {
  it('builds <warehouse>/<type>/<4 digit id>', () => {
    expect(formatReference('WH', 'IN', 1)).toBe('WH/IN/0001');
    expect(formatReference('WH', 'OUT', 42)).toBe('WH/OUT/0042');
    expect(formatReference('WH2', 'INT', 7)).toBe('WH2/INT/0007');
    expect(formatReference('WH', 'ADJ', 1234)).toBe('WH/ADJ/1234');
  });

  it('keeps counting past 9999 instead of wrapping', () => {
    expect(formatReference('WH', 'IN', 10000)).toBe('WH/IN/10000');
  });
});
