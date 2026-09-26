'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Hint from '@/components/ui/hint';
import * as Label from '@/components/ui/label';
import * as Modal from '@/components/ui/modal';
import * as Select from '@/components/ui/select';
import { Field } from '@/components/auth/field';
import { notification } from '@/hooks/use-notification';
import type { LocationRow, WarehouseRow } from '@/lib/services/catalog';
import { locationSchema, type LocationInput } from '@/lib/validators';
import { ApiError, send } from './request';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: LocationRow; // set = edit, empty = new
  warehouses: WarehouseRow[];
  onSaved: () => void;
};

export function LocationFormModal({ open, onOpenChange, location, warehouses, onSaved }: Props) {
  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content className='max-w-[440px]'>
        <Modal.Header
          title={location ? `Edit ${location.fullName}` : 'New location'}
          description='A room, rack or area inside a warehouse.'
        />
        <LocationForm
          location={location}
          warehouses={warehouses}
          onDone={() => {
            onSaved();
            onOpenChange(false);
          }}
        />
      </Modal.Content>
    </Modal.Root>
  );
}

type FormProps = { location?: LocationRow; warehouses: WarehouseRow[]; onDone: () => void };

function LocationForm({ location, warehouses, onDone }: FormProps) {
  const { register, control, handleSubmit, setError, formState } = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name ?? '',
      shortCode: location?.shortCode ?? '',
      // one warehouse is the common case, so preselect it
      warehouse: location?.warehouseId ?? (warehouses.length === 1 ? warehouses[0].id : ''),
    },
  });
  const { errors, isSubmitting } = formState;
  const [name, warehouseId] = useWatch({ control, name: ['name', 'warehouse'] });
  const code = warehouses.find((w) => w.id === warehouseId)?.shortCode;

  async function onSubmit(values: LocationInput) {
    try {
      if (location) await send('PATCH', `/api/locations/${location.id}`, values);
      else await send('POST', '/api/locations', values);
      notification({ status: 'success', title: location ? 'Location updated' : 'Location created' });
      onDone();
    } catch (err) {
      const fields = err instanceof ApiError ? err.fields : {};
      Object.entries(fields).forEach(([name, message]) => setError(name as keyof LocationInput, { message }));
      if (!Object.keys(fields).length) setError('root', { message: (err as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Modal.Body className='flex flex-col gap-4'>
        <Field id='loc-name' label='Name' placeholder='Stock1' autoFocus error={errors.name?.message} {...register('name')} />
        <Field id='loc-code' label='Short Code' placeholder='S1' maxLength={10} error={errors.shortCode?.message} {...register('shortCode')} />
        <div className='flex flex-col gap-1'>
          <Label.Root htmlFor='loc-warehouse'>Warehouse</Label.Root>
          <Controller
            control={control}
            name='warehouse'
            render={({ field }) => (
              <Select.Root value={field.value} onValueChange={field.onChange} hasError={!!errors.warehouse}>
                <Select.Trigger id='loc-warehouse' onBlur={field.onBlur}>
                  <Select.Value placeholder='Pick a warehouse' />
                </Select.Trigger>
                <Select.Content>
                  {warehouses.map((w) => (
                    <Select.Item key={w.id} value={w.id}>
                      {w.shortCode} <span className='text-text-sub-600'>{w.name}</span>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          />
          {errors.warehouse && (
            <Hint.Root hasError>
              <Hint.Icon as={RiErrorWarningFill} />
              {errors.warehouse.message}
            </Hint.Root>
          )}
        </div>
        {/* preview of the name used everywhere else in the app */}
        {code && name.trim() && (
          <p className='text-paragraph-sm text-text-sub-600'>
            Shown as <span className='font-medium text-text-strong-950'>{`${code}/${name.trim()}`}</span>
          </p>
        )}
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
