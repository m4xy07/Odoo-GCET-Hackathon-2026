'use client';

import * as React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import * as Popover from '@/components/ui/popover';
import { AlertBell as BellButton } from '@/components/motion/AlertBell';
import { StockBadge } from '@/components/products/stock-badge';
import { fetcher } from '@/components/settings/request';
import { notification } from '@/hooks/use-notification';
import type { LowStockItem } from '@/lib/types';

export const LOW_STOCK_KEY = '/api/alerts/low-stock';
const TOASTED = 'stocksense.lowStockToast';

// Top bar bell: count of products that are low or out, a list on click and one warning toast
// per browser session. The bell itself (Lottie, ring when the count goes up) is Om's BellButton.
// No props, it loads its own data: <AlertBell /> is all the top bar needs.
export function AlertBell() {
  const { data: items } = useSWR<LowStockItem[]>(LOW_STOCK_KEY, fetcher, { refreshInterval: 60_000 });
  const [open, setOpen] = React.useState(false);
  const count = items?.length ?? 0;

  // storage can be blocked in private windows, then the toast simply shows again next load
  React.useEffect(() => {
    if (!count) return;
    try {
      if (sessionStorage.getItem(TOASTED)) return;
      sessionStorage.setItem(TOASTED, '1');
    } catch {}
    notification({
      status: 'warning',
      title: `${count} ${count === 1 ? 'product is' : 'products are'} low or out of stock`,
    });
  }, [count]);

  // nothing until the first answer, so the top bar never flashes an empty bell
  if (!items) return null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <BellButton count={count} />
      </Popover.Trigger>

      <Popover.Content align='end' sideOffset={8} className='w-80 max-w-[calc(100vw-32px)] p-0'>
        <div className='flex items-center justify-between border-b border-stroke-soft-200 px-4 py-3'>
          <p className='text-label-sm'>Low stock</p>
          <Link href='/stock' onClick={() => setOpen(false)} className='text-paragraph-xs text-primary-base hover:underline'>
            Open Stock
          </Link>
        </div>
        {items.length === 0 && <p className='px-4 py-6 text-center text-paragraph-sm text-text-sub-600'>All stocked up.</p>}
        {!!items.length && (
          <ul className='max-h-80 overflow-y-auto py-1'>
            {items.map((item) => (
              <li key={item.productId}>
                <Link
                  href={`/products/${item.productId}`}
                  onClick={() => setOpen(false)}
                  className='flex items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-bg-weak-50'
                >
                  <span className='min-w-0'>
                    <span className='block truncate text-label-sm'>{item.name}</span>
                    <span className='block text-paragraph-xs text-text-sub-600 tabular-nums'>
                      {item.sku} · {item.onHand} on hand, min {item.reorderMin}
                    </span>
                  </span>
                  <StockBadge state={item.state} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
