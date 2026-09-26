'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { RiArrowLeftSLine, RiPencilLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Table from '@/components/ui/table';
import { EmptyState } from '@/components/motion/EmptyState';
import { formatCost, formatQty, UOM_LABEL } from '@/components/products/format';
import { ProductFormModal } from '@/components/products/product-form';
import { StockBadge } from '@/components/products/stock-badge';
import { ErrorBox, TableSkeleton } from '@/components/settings/list-states';
import { fetcher } from '@/components/settings/request';
import { PageHeader } from '@/components/shell/page-header';
import type { ProductDetail, ProductStockRow } from '@/lib/types';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const product = useSWR<ProductDetail>(`/api/products/${id}`, fetcher);
  const stock = useSWR<ProductStockRow[]>(`/api/products/${id}/stock`, fetcher);
  const [editOpen, setEditOpen] = React.useState(false);
  const p = product.data;

  return (
    <>
      <Link href='/products' className='mb-3 inline-flex items-center gap-1 text-paragraph-sm text-text-sub-600 hover:text-text-strong-950'>
        <RiArrowLeftSLine className='size-4' />
        Products
      </Link>

      {product.isLoading && <TableSkeleton rows={3} />}
      {product.error && <ErrorBox message={product.error.message} onRetry={() => product.mutate()} />}

      {p && (
        <>
          <PageHeader
            title={p.name}
            action={
              <Button.Root size='small' onClick={() => setEditOpen(true)}>
                <Button.Icon as={RiPencilLine} />
                Edit
              </Button.Root>
            }
          >
            <StockBadge state={p.stockState} />
          </PageHeader>

          <dl className='mb-10 grid grid-cols-2 gap-x-6 gap-y-5 rounded-16 border border-stroke-soft-200 p-5 sm:grid-cols-4'>
            <Fact label='SKU/Code' value={p.sku} />
            <Fact label='Category' value={p.category} />
            <Fact label='Unit of Measure' value={UOM_LABEL[p.uom] ?? p.uom} />
            <Fact label='per unit cost' value={formatCost(p.unitCost)} />
            <Fact label='On hand' value={formatQty(p.onHand, p.uom)} />
            <Fact label='free to Use' value={formatQty(p.freeToUse, p.uom)} />
            <Fact label='Reorder min' value={formatQty(p.reorderMin, p.uom)} />
            <Fact label='Reorder qty' value={formatQty(p.reorderQty, p.uom)} />
          </dl>

          <h2 className='mb-3 text-[17px] font-semibold leading-[22px]'>Stock by location</h2>
          {stock.isLoading && <TableSkeleton rows={2} />}
          {stock.error && <ErrorBox message={stock.error.message} onRetry={() => stock.mutate()} />}
          {stock.data?.length === 0 && (
            <EmptyState title='No stock yet' description='A receipt or an adjustment will put this product into a location.' />
          )}
          {!!stock.data?.length && (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Location</Table.Head>
                  <Table.Head className='text-right'>On hand</Table.Head>
                  <Table.Head className='hidden text-right sm:table-cell'>Reserved</Table.Head>
                  <Table.Head className='text-right'>free to Use</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {stock.data.map((row, i) => (
                  <React.Fragment key={row.locationId}>
                    {i > 0 && <Table.RowDivider />}
                    <Table.Row>
                      <Table.Cell className='h-[52px] font-medium'>{row.location}</Table.Cell>
                      <Table.Cell className='h-[52px] text-right tabular-nums'>{formatQty(row.quantity, p.uom)}</Table.Cell>
                      <Table.Cell className='hidden h-[52px] text-right tabular-nums text-text-sub-600 sm:table-cell'>
                        {formatQty(row.reserved, p.uom)}
                      </Table.Cell>
                      <Table.Cell className='h-[52px] text-right tabular-nums'>{formatQty(row.freeToUse, p.uom)}</Table.Cell>
                    </Table.Row>
                  </React.Fragment>
                ))}
              </Table.Body>
            </Table.Root>
          )}

          <ProductFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            product={p}
            onSaved={(saved) => product.mutate(saved, { revalidate: false })}
          />
        </>
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <dt className='text-paragraph-xs text-text-sub-600'>{label}</dt>
      <dd className='text-label-sm tabular-nums'>{value}</dd>
    </div>
  );
}
