'use client';

import * as React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import * as Dropdown from '@/components/ui/dropdown';
import { AlertBell } from '@/components/motion/AlertBell';
import { StockBadge } from '@/components/products/stock-badge';
import { fetcher } from '@/components/settings/request';
import { notification } from '@/hooks/use-notification';
import type { LowStockItem } from '@/lib/types';

export const LOW_STOCK_KEY = '/api/alerts/low-stock';
const TOASTED = 'stocksense.lowStockToast';

// Top bar low stock alerts: count on the bell, the list on click and one warning toast per browser session.
// No props, it loads its own data, so the top bar only needs <LowStockBell />. The bell drawing and ring live in AlertBell.
export function LowStockBell() {
  const { data: items } = useSWR<LowStockItem[]>(LOW_STOCK_KEY, fetcher, { refreshInterval: 60_000 });
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
      variant: 'stroke',
      title: `${count} ${count === 1 ? 'product is' : 'products are'} low or out of stock`,
    });
  }, [count]);

  // nothing until the first answer, so the top bar never flashes an empty bell
  if (!items) return null;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <AlertBell count={items.length} />
      </Dropdown.Trigger>
      <Dropdown.Content align='end' collisionPadding={16} className='w-80 max-w-[calc(100vw-32px)]'>
        <div className='flex items-center justify-between px-2 pb-1 pt-1'>
          <p className='text-label-sm'>Low stock</p>
          <Dropdown.Item asChild className='w-auto p-1 text-paragraph-xs text-primary-base'>
            <Link href='/stock'>Open Stock</Link>
          </Dropdown.Item>
        </div>
        <Dropdown.Separator className='-mx-2 h-px bg-stroke-soft-200' />
        {items.length === 0 && <p className='px-2 py-5 text-center text-paragraph-sm text-text-sub-600'>All stocked up.</p>}
        <div className='max-h-80 overflow-y-auto'>
          {items.map((item) => (
            <Dropdown.Item key={item.productId} asChild className='justify-between gap-3'>
              <Link href={`/products/${item.productId}`}>
                <span className='min-w-0'>
                  <span className='block truncate text-label-sm'>{item.name}</span>
                  <span className='block text-paragraph-xs text-text-sub-600 tabular-nums'>
                    {item.sku} · {item.onHand} on hand, min {item.reorderMin}
                  </span>
                </span>
                <StockBadge state={item.state} />
              </Link>
            </Dropdown.Item>
          ))}
        </div>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
