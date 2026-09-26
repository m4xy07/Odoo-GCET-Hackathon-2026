'use client';

import * as React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RiSearchLine } from '@remixicon/react';
import * as Input from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import * as Table from '@/components/ui/table';
import { EmptyState } from '@/components/motion/EmptyState';
import { formatCost } from '@/components/products/format';
import { OnHandCell } from '@/components/products/on-hand-cell';
import { StockBadge } from '@/components/products/stock-badge';
import { ErrorBox, Subtitle, TableSkeleton } from '@/components/settings/list-states';
import { fetcher } from '@/components/settings/request';
import { PageHeader } from '@/components/shell/page-header';
import type { CategoryRow, LocationRow } from '@/lib/services/catalog';
import type { StockRow } from '@/lib/types';

const ALL = 'all';

export default function StockPage() {
  const [search, setSearch] = React.useState('');
  const [q, setQ] = React.useState('');
  const [picked, setPicked] = React.useState<string>();
  const [category, setCategory] = React.useState(ALL);

  React.useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: locations } = useSWR<LocationRow[]>('/api/locations?type=internal', fetcher);
  const { data: categories = [] } = useSWR<CategoryRow[]>('/api/categories', fetcher);
  // open on the main stock location so On hand can be edited right away
  const defaultLocation = locations?.find((l) => /stock/i.test(l.name)) ?? locations?.[0];
  const locationId = picked ?? defaultLocation?.id ?? ALL;
  const location = locations?.find((l) => l.id === locationId) ?? null;

  const params = new URLSearchParams();
  if (location) params.set('location', location.id);
  if (category !== ALL) params.set('category', category);
  if (q) params.set('q', q);
  // wait for locations, otherwise the first request would load totals and then jump to Stock1
  const { data, error, isLoading, mutate } = useSWR<StockRow[]>(locations ? `/api/stock?${params}` : null, fetcher, {
    keepPreviousData: true,
  });

  return (
    <>
      <PageHeader title='Stock'>
        <Input.Root size='small' className='min-w-0 flex-1 sm:w-56 sm:flex-none'>
          <Input.Wrapper>
            <Input.Icon as={RiSearchLine} />
            <Input.Input placeholder='Search product or SKU' aria-label='Search product or SKU' value={search} onChange={(e) => setSearch(e.target.value)} />
          </Input.Wrapper>
        </Input.Root>
        <Select.Root size='small' value={locationId} onValueChange={setPicked}>
          <Select.Trigger aria-label='Location' className='w-auto min-w-28'>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL}>All locations</Select.Item>
            {locations?.map((l) => (
              <Select.Item key={l.id} value={l.id}>
                {l.fullName}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Select.Root size='small' value={category} onValueChange={setCategory}>
          <Select.Trigger aria-label='Category' className='hidden w-auto min-w-28 sm:flex'>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL}>All categories</Select.Item>
            {categories.map((c) => (
              <Select.Item key={c.id} value={c.id}>
                {c.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </PageHeader>

      <Subtitle>
        {location ? `Showing ${location.fullName}. Click On hand to record a new count.` : 'Totals across every location. Pick a location to update On hand.'}
      </Subtitle>

      {(isLoading || !locations) && !error && <TableSkeleton rows={4} />}
      {error && <ErrorBox message={error.message} onRetry={() => mutate()} />}
      {locations?.length === 0 && (
        <EmptyState
          title='No stock locations yet'
          description='Stock lives in locations like WH/Stock1.'
          action={
            <Link href='/settings/locations' className='text-label-sm text-primary-base hover:underline'>
              Add a location
            </Link>
          }
        />
      )}
      {data?.length === 0 && <EmptyState title={q || category !== ALL ? 'No products match' : 'No products yet'} description='Products appear here once they are created.' />}

      {!!data?.length && (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Product</Table.Head>
              <Table.Head className='text-right'>per unit cost</Table.Head>
              <Table.Head className='text-right'>On hand</Table.Head>
              <Table.Head className='hidden text-right sm:table-cell'>free to Use</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((row, i) => (
              <React.Fragment key={row.productId}>
                {i > 0 && <Table.RowDivider />}
                <Table.Row>
                  <Table.Cell className='h-[52px]'>
                    <span className='inline-flex flex-wrap items-center gap-2'>
                      <Link href={`/products/${row.productId}`} className='font-medium hover:underline'>
                        {row.name}
                      </Link>
                      <StockBadge state={row.stockState} />
                    </span>
                    <span className='block text-paragraph-xs text-text-sub-600'>{row.sku}</span>
                  </Table.Cell>
                  <Table.Cell className='h-[52px] text-right tabular-nums'>{formatCost(row.unitCost)}</Table.Cell>
                  <Table.Cell className='h-[52px] text-right'>
                    <OnHandCell row={row} location={location} onAdjusted={() => mutate()} />
                  </Table.Cell>
                  <Table.Cell className='hidden h-[52px] text-right tabular-nums sm:table-cell'>{row.freeToUse}</Table.Cell>
                </Table.Row>
              </React.Fragment>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </>
  );
}
