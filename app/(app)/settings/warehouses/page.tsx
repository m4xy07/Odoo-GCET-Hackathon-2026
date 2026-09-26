'use client';

import * as React from 'react';
import useSWR from 'swr';
import { RiAddLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Table from '@/components/ui/table';
import { DeleteConfirm } from '@/components/settings/delete-confirm';
import { EmptyBox, ErrorBox, PageHeader, RowActions, TableSkeleton } from '@/components/settings/list-states';
import { fetcher, send } from '@/components/settings/request';
import { WarehouseFormModal } from '@/components/settings/warehouse-form';
import type { WarehouseRow } from '@/lib/services/catalog';

export default function WarehousesPage() {
  const { data, error, isLoading, mutate } = useSWR<WarehouseRow[]>('/api/warehouses', fetcher);
  const [editing, setEditing] = React.useState<WarehouseRow | undefined>();
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<WarehouseRow | null>(null);

  const openForm = (warehouse?: WarehouseRow) => {
    setEditing(warehouse);
    setFormOpen(true);
  };

  const newButton = (
    <Button.Root size='small' onClick={() => openForm()}>
      <Button.Icon as={RiAddLine} />
      New
    </Button.Root>
  );

  return (
    <>
      <PageHeader title='Warehouse' subtitle='Warehouse details and the short code used in every reference.' action={newButton} />

      {isLoading && <TableSkeleton />}
      {error && <ErrorBox message={error.message} onRetry={() => mutate()} />}
      {data?.length === 0 && (
        <EmptyBox title='No warehouses yet' text='Add your first warehouse, then give it locations like Stock1 or Rack A.' action={newButton} />
      )}

      {!!data?.length && (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head className='w-28'>Short Code</Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head className='hidden sm:table-cell'>Address</Table.Head>
              <Table.Head className='w-24'>
                <span className='sr-only'>Actions</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((w, i) => (
              <React.Fragment key={w.id}>
                {i > 0 && <Table.RowDivider />}
                <Table.Row>
                  <Table.Cell className='h-[52px] font-medium'>{w.shortCode}</Table.Cell>
                  <Table.Cell className='h-[52px]'>
                    {w.name}
                    {/* the address column is hidden on phones, so show it under the name */}
                    <span className='block text-paragraph-xs text-text-sub-600 sm:hidden'>{w.address}</span>
                  </Table.Cell>
                  <Table.Cell className='hidden h-[52px] text-text-sub-600 sm:table-cell'>{w.address}</Table.Cell>
                  <Table.Cell className='h-[52px] text-right'>
                    <RowActions label={w.shortCode} onEdit={() => openForm(w)} onDelete={() => setDeleting(w)} />
                  </Table.Cell>
                </Table.Row>
              </React.Fragment>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      <WarehouseFormModal open={formOpen} onOpenChange={setFormOpen} warehouse={editing} onSaved={() => mutate()} />
      <DeleteConfirm
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete warehouse ${deleting?.shortCode ?? ''}?`}
        onConfirm={async () => {
          await send('DELETE', `/api/warehouses/${deleting!.id}`);
          await mutate();
        }}
      />
    </>
  );
}
