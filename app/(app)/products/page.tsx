'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { RiAddLine, RiSearchLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import * as Table from '@/components/ui/table';
import { EmptyState } from '@/components/motion/EmptyState';
import { formatCost, formatQty } from '@/components/products/format';
import { ProductFormModal } from '@/components/products/product-form';
import { StockBadge } from '@/components/products/stock-badge';
import { ErrorBox, TableSkeleton } from '@/components/settings/list-states';
import { fetcher } from '@/components/settings/request';
import { PageHeader } from '@/components/shell/page-header';
import type { CategoryRow } from '@/lib/services/catalog';
import type { ProductRow } from '@/lib/types';

const ALL = 'all';

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [q, setQ] = React.useState('');
  const [category, setCategory] = React.useState(ALL);
  const [state, setState] = React.useState(ALL);
  const [formOpen, setFormOpen] = React.useState(false);

  // wait for a pause in typing before asking the server
  React.useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category !== ALL) params.set('category', category);
  if (state !== ALL) params.set('state', state);
  const { data, error, isLoading, mutate } = useSWR<ProductRow[]>(`/api/products?${params}`, fetcher, { keepPreviousData: true });
  const { data: categories = [] } = useSWR<CategoryRow[]>('/api/categories', fetcher);
  const filtered = !!q || category !== ALL || state !== ALL;

  const newButton = (
    <Button.Root size='small' onClick={() => setFormOpen(true)}>
      <Button.Icon as={RiAddLine} />
      New
    </Button.Root>
  );

  return (
    <>
      <PageHeader title='Products' action={newButton}>
        <Input.Root size='small' className='min-w-0 flex-1 sm:w-60 sm:flex-none'>
          <Input.Wrapper>
            <Input.Icon as={RiSearchLine} />
            <Input.Input placeholder='Search name or SKU' aria-label='Search name or SKU' value={search} onChange={(e) => setSearch(e.target.value)} />
          </Input.Wrapper>
        </Input.Root>
        <Select.Root size='small' value={category} onValueChange={setCategory}>
          <Select.Trigger aria-label='Category' className='w-auto min-w-28'>
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
        <Select.Root size='small' value={state} onValueChange={setState}>
          <Select.Trigger aria-label='Stock' className='w-auto min-w-24'>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL}>All stock</Select.Item>
            <Select.Item value='low'>Low stock</Select.Item>
            <Select.Item value='out'>Out of stock</Select.Item>
          </Select.Content>
        </Select.Root>
      </PageHeader>

      {isLoading && <TableSkeleton rows={4} />}
      {error && <ErrorBox message={error.message} onRetry={() => mutate()} />}
      {data?.length === 0 &&
        (filtered ? (
          <EmptyState title='No products match' description='Try another name, SKU or filter.' />
        ) : (
          <EmptyState title='No products yet' description='Add your first product with its SKU, category and unit.' action={newButton} />
        ))}

      {!!data?.length && (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Product</Table.Head>
              <Table.Head className='hidden md:table-cell'>Category</Table.Head>
              <Table.Head className='text-right'>per unit cost</Table.Head>
              <Table.Head className='text-right'>On hand</Table.Head>
              <Table.Head className='hidden text-right sm:table-cell'>free to Use</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && <Table.RowDivider />}
                <Table.Row className='cursor-pointer' onClick={() => router.push(`/products/${p.id}`)}>
                  <Table.Cell className='h-[52px]'>
                    <Link href={`/products/${p.id}`} className='font-medium hover:underline' onClick={(e) => e.stopPropagation()}>
                      <span className='text-text-sub-600'>[{p.sku}]</span> {p.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell className='hidden h-[52px] text-text-sub-600 md:table-cell'>{p.category}</Table.Cell>
                  <Table.Cell className='h-[52px] text-right tabular-nums'>{formatCost(p.unitCost)}</Table.Cell>
                  <Table.Cell className='h-[52px] text-right tabular-nums'>
                    <span className='inline-flex items-center gap-2'>
                      <StockBadge state={p.stockState} />
                      {formatQty(p.onHand, p.uom)}
                    </span>
                  </Table.Cell>
                  <Table.Cell className='hidden h-[52px] text-right tabular-nums sm:table-cell'>{formatQty(p.freeToUse, p.uom)}</Table.Cell>
                </Table.Row>
              </React.Fragment>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      <ProductFormModal open={formOpen} onOpenChange={setFormOpen} onSaved={(p) => router.push(`/products/${p.id}`)} />
    </>
  );
}
