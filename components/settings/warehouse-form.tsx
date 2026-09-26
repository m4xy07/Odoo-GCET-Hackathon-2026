'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Button from '@/components/ui/button';
import * as Modal from '@/components/ui/modal';
import { Field } from '@/components/auth/field';
import { notification } from '@/hooks/use-notification';
import type { WarehouseRow } from '@/lib/services/catalog';
import { warehouseSchema, type WarehouseInput } from '@/lib/validators';
import { ApiError, send } from './request';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: WarehouseRow; // set = edit, empty = new
  onSaved: () => void;
};

export function WarehouseFormModal({ open, onOpenChange, warehouse, onSaved }: Props) {
  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content className='max-w-[440px]'>
        <Modal.Header
          title={warehouse ? `Edit ${warehouse.shortCode}` : 'New warehouse'}
          description='The short code starts every reference, like WH/IN/0001.'
        />
        {/* the form mounts fresh on every open, so it always starts from the row being edited */}
        <WarehouseForm
          warehouse={warehouse}
          onDone={() => {
            onSaved();
            onOpenChange(false);
          }}
        />
      </Modal.Content>
    </Modal.Root>
  );
}

function WarehouseForm({ warehouse, onDone }: { warehouse?: WarehouseRow; onDone: () => void }) {
  const { register, handleSubmit, setError, formState } = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { name: warehouse?.name ?? '', shortCode: warehouse?.shortCode ?? '', address: warehouse?.address ?? '' },
  });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: WarehouseInput) {
    try {
      if (warehouse) await send('PATCH', `/api/warehouses/${warehouse.id}`, values);
      else await send('POST', '/api/warehouses', values);
      notification({ status: 'success', variant: 'stroke', title: warehouse ? 'Warehouse updated' : 'Warehouse created' });
      onDone();
    } catch (err) {
      const fields = err instanceof ApiError ? err.fields : {};
      Object.entries(fields).forEach(([name, message]) => setError(name as keyof WarehouseInput, { message }));
      if (!Object.keys(fields).length) setError('root', { message: (err as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Modal.Body className='flex flex-col gap-4'>
        <Field id='wh-name' label='Name' placeholder='Main Warehouse' autoFocus error={errors.name?.message} {...register('name')} />
        <Field
          id='wh-code'
          label='Short Code'
          placeholder='WH'
          maxLength={5}
          className='uppercase'
          error={errors.shortCode?.message}
          {...register('shortCode')}
        />
        <Field id='wh-address' label='Address' placeholder='Plot 12, Gachibowli, Hyderabad' error={errors.address?.message} {...register('address')} />
        {errors.root && <p className='text-paragraph-sm text-error-base'>{errors.root.message}</p>}
      </Modal.Body>
      <Modal.Footer className='justify-end'>
        <Modal.Close asChild>
          <Button.Root type='button' variant='neutral' mode='stroke' size='small'>
            Cancel
          </Button.Root>
        </Modal.Close>
        <Button.Root type='submit' size='small' disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button.Root>
      </Modal.Footer>
    </form>
  );
}
