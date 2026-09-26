import * as Badge from '@/components/ui/badge';
import type { ProductRow } from '@/lib/types';

// Nothing for healthy stock, so the eye only lands on rows that need attention
export function StockBadge({ state }: { state: ProductRow['stockState'] }) {
  if (state === 'ok') return null;
  return (
    <Badge.Root variant='lighter' size='medium' color={state === 'out' ? 'red' : 'orange'}>
      {state === 'out' ? 'Out' : 'Low'}
    </Badge.Root>
  );
}
