'use client';

import * as React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RiAddLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Table from '@/components/ui/table';
import { DeleteConfirm } from '@/components/settings/delete-confirm';
import { EmptyState } from '@/components/motion/EmptyState';
import { ErrorBox, RowActions, Subtitle, TableSkeleton } from '@/components/settings/list-states';
import { PageHeader } from '@/components/shell/page-header';
import { LocationFormModal } from '@/components/settings/location-form';
import { fetcher, send } from '@/components/settings/request';
import type { LocationRow, WarehouseRow } from '@/lib/services/catalog';

export default function LocationsPage() {
  // only internal locations are editable, the virtual partner and adjustment ones stay hidden
  const locations = useSWR<LocationRow[]>('/api/locations?type=internal', fetcher);
  const warehouses = useSWR<WarehouseRow[]>('/api/warehouses', fetcher);
  const [editing, setEditing] = React.useState<LocationRow | undefined>();
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<LocationRow | null>(null);

  const { data, error, isLoading, mutate } = locations;
  const noWarehouse = warehouses.data?.length === 0;
  const warehouseName = (id: string | null) => warehouses.data?.find((w) => w.id === id)?.name ?? '';

  const openForm = (location?: LocationRow) => {
    setEditing(location);
    setFormOpen(true);
  };

  const newButton = (
    <Button.Root size='small' onClick={() => openForm()} disabled={!warehouses.data?.length}>
      <Button.Icon as={RiAddLine} />
      New
    </Button.Root>
  );

  return (
    <>
      <PageHeader title='Location' action={newButton} />
      <Subtitle>The rooms, racks and areas inside each warehouse.</Subtitle>

      {(isLoading || warehouses.isLoading) && <TableSkeleton />}
      {(error || warehouses.error) && (
        <ErrorBox
          message={(error ?? warehouses.error).message}
          onRetry={() => {
            mutate();
            warehouses.mutate();
          }}
        />
      )}
      {noWarehouse && (
        <EmptyState
          title='Add a warehouse first'
          description='Every location belongs to a warehouse, and its short code starts the location name.'
          action={
            <Button.Root size='small' asChild>
              <Link href='/settings/warehouses'>Go to Warehouse</Link>
            </Button.Root>
          }
        />
      )}
      {!noWarehouse && data?.length === 0 && (
        <EmptyState title='No locations yet' description='Add places where stock sits, like Stock1, Rack A or Production.' action={newButton} />
      )}

      {!!data?.length && (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Location</Table.Head>
              <Table.Head className='w-28'>Short Code</Table.Head>
              <Table.Head className='hidden sm:table-cell'>Warehouse</Table.Head>
              <Table.Head className='w-24'>
                <span className='sr-only'>Actions</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((l, i) => (
              <React.Fragment key={l.id}>
                {i > 0 && <Table.RowDivider />}
                <Table.Row>
                  <Table.Cell className='h-[52px] font-medium'>{l.fullName}</Table.Cell>
                  <Table.Cell className='h-[52px] text-text-sub-600'>{l.shortCode}</Table.Cell>
                  <Table.Cell className='hidden h-[52px] text-text-sub-600 sm:table-cell'>{warehouseName(l.warehouseId)}</Table.Cell>
                  <Table.Cell className='h-[52px] text-right'>
                    <RowActions label={l.fullName} onEdit={() => openForm(l)} onDelete={() => setDeleting(l)} />
                  </Table.Cell>
                </Table.Row>
              </React.Fragment>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      <LocationFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        location={editing}
        warehouses={warehouses.data ?? []}
        onSaved={() => mutate()}
      />
      <DeleteConfirm
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete location ${deleting?.fullName ?? ''}?`}
        onConfirm={async () => {
          await send('DELETE', `/api/locations/${deleting!.id}`);
          await mutate();
        }}
      />
    </>
  );
}
