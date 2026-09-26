'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { Controller, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Hint from '@/components/ui/hint';
import * as Label from '@/components/ui/label';
import * as Modal from '@/components/ui/modal';
import * as Select from '@/components/ui/select';
import { LOW_STOCK_KEY } from '@/components/alerts/LowStockBell';
import { Field } from '@/components/auth/field';
import { ApiError, fetcher, send } from '@/components/settings/request';
import { notification } from '@/hooks/use-notification';
import type { LocationRow } from '@/lib/services/catalog';
import type { ProductDetail } from '@/lib/types';
import { productSchema, type ProductInput } from '@/lib/validators';
import { CategoryPicker } from './category-picker';
import { UOM_LABEL } from './format';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductDetail; // set = edit, empty = new
  onSaved: (product: ProductDetail) => void;
};

export function ProductFormModal({ open, onOpenChange, product, onSaved }: Props) {
  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content className='max-h-[92dvh] max-w-[560px] overflow-y-auto'>
        <Modal.Header title={product ? `Edit ${product.name}` : 'New product'} />
        <ProductForm
          product={product}
          onDone={(saved) => {
            onSaved(saved);
            onOpenChange(false);
          }}
        />
      </Modal.Content>
    </Modal.Root>
  );
}

// An empty number box parses to NaN, and zod's default text for that is not friendly
const numberError = (message?: string) => (message?.startsWith('Invalid input') ? 'Enter a number' : message);

function ProductForm({ product, onDone }: { product?: ProductDetail; onDone: (product: ProductDetail) => void }) {
  const [withStock, setWithStock] = React.useState(false);
  const { register, control, handleSubmit, setError, formState } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    // opening stock fields drop out of the values when they are hidden
    shouldUnregister: true,
    defaultValues: {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      category: product?.categoryId ?? '',
      uom: (product?.uom as ProductInput['uom']) ?? 'unit',
      unitCost: product?.unitCost,
      reorderMin: product?.reorderMin ?? 0,
      reorderQty: product?.reorderQty ?? 0,
    },
  });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: ProductInput) {
    try {
      const saved = product
        ? await send<ProductDetail>('PATCH', `/api/products/${product.id}`, values)
        : await send<ProductDetail>('POST', '/api/products', values);
      notification({ status: 'success', title: product ? 'Product updated' : 'Product created' });
      mutate(LOW_STOCK_KEY); // a new reorder min or opening stock can change the bell
      onDone(saved);
    } catch (err) {
      const fields = err instanceof ApiError ? err.fields : {};
      Object.entries(fields).forEach(([name, message]) => setError(name as keyof ProductInput, { message }));
      if (!Object.keys(fields).length) setError('root', { message: (err as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Modal.Body className='grid gap-4 sm:grid-cols-2'>
        <Field id='p-name' label='Name' placeholder='Desk' autoFocus error={errors.name?.message} {...register('name')} />
        <Field id='p-sku' label='SKU/Code' placeholder='DESK001' className='uppercase' error={errors.sku?.message} {...register('sku')} />

        <div className='flex flex-col gap-1'>
          <Label.Root htmlFor='p-category'>Category</Label.Root>
          <Controller
            control={control}
            name='category'
            render={({ field }) => (
              <CategoryPicker id='p-category' value={field.value} onChange={field.onChange} hasError={!!errors.category} />
            )}
          />
          <FieldError message={errors.category?.message} />
        </div>

        <div className='flex flex-col gap-1'>
          <Label.Root htmlFor='p-uom'>Unit of Measure</Label.Root>
          <Controller
            control={control}
            name='uom'
            render={({ field }) => (
              <Select.Root value={field.value} onValueChange={field.onChange}>
                <Select.Trigger id='p-uom'>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {Object.entries(UOM_LABEL).map(([value, label]) => (
                    <Select.Item key={value} value={value}>
                      {label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          />
        </div>

        <div className='grid grid-cols-3 gap-3 sm:col-span-2'>
          <Field
            id='p-cost'
            label='Unit cost (Rs)'
            type='number'
            min={0}
            step='any'
            inputMode='decimal'
            error={numberError(errors.unitCost?.message)}
            {...register('unitCost', { valueAsNumber: true })}
          />
          <Field
            id='p-min'
            label='Reorder min'
            type='number'
            min={0}
            inputMode='numeric'
            error={numberError(errors.reorderMin?.message)}
            {...register('reorderMin', { valueAsNumber: true })}
          />
          <Field
            id='p-qty'
            label='Reorder qty'
            type='number'
            min={0}
            inputMode='numeric'
            error={numberError(errors.reorderQty?.message)}
            {...register('reorderQty', { valueAsNumber: true })}
          />
        </div>

        {/* opening stock is a create-time shortcut, after that stock moves through adjustments */}
        {!product && (
          <div className='sm:col-span-2'>
            {withStock ? (
              <OpeningStock control={control} register={register} errors={errors} onRemove={() => setWithStock(false)} />
            ) : (
              <Button.Root type='button' variant='primary' mode='ghost' size='xsmall' onClick={() => setWithStock(true)}>
                Add initial stock
              </Button.Root>
            )}
          </div>
        )}

        {errors.root && <p className='text-paragraph-sm text-error-base sm:col-span-2'>{errors.root.message}</p>}
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

type OpeningStockProps = {
  control: Control<ProductInput>;
  register: ReturnType<typeof useForm<ProductInput>>['register'];
  errors: ReturnType<typeof useForm<ProductInput>>['formState']['errors'];
  onRemove: () => void;
};

function OpeningStock({ control, register, errors, onRemove }: OpeningStockProps) {
  const { data: locations = [] } = useSWR<LocationRow[]>('/api/locations?type=internal', fetcher);
  return (
    <div className='flex flex-col gap-3 rounded-16 border border-stroke-soft-200 p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-label-sm'>Initial stock</p>
        <Button.Root type='button' variant='neutral' mode='ghost' size='xxsmall' onClick={onRemove}>
          Remove
        </Button.Root>
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='flex flex-col gap-1'>
          <Label.Root htmlFor='p-loc'>Location</Label.Root>
          <Controller
            control={control}
            name='initialStock.locationId'
            defaultValue={locations.length === 1 ? locations[0].id : ''}
            render={({ field }) => (
              <Select.Root value={field.value} onValueChange={field.onChange} hasError={!!errors.initialStock?.locationId}>
                <Select.Trigger id='p-loc'>
                  <Select.Value placeholder='Pick a location' />
                </Select.Trigger>
                <Select.Content>
                  {locations.map((l) => (
                    <Select.Item key={l.id} value={l.id}>
                      {l.fullName}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          />
          <FieldError message={errors.initialStock?.locationId?.message} />
        </div>
        <Field
          id='p-initial'
          label='Quantity'
          type='number'
          min={0}
          step='any'
          inputMode='decimal'
          error={numberError(errors.initialStock?.quantity?.message)}
          {...register('initialStock.quantity', { valueAsNumber: true })}
        />
      </div>
      <p className='text-paragraph-xs text-text-sub-600'>Logged as an adjustment, so it shows in Move History.</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Hint.Root hasError>
      <Hint.Icon as={RiErrorWarningFill} />
      {message}
    </Hint.Root>
  );
}
