'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Path } from 'react-hook-form';
import { mutate } from 'swr';
import type { z } from 'zod';
import { Field } from '@/components/auth/field';
import * as Button from '@/components/ui/button';
import { notification } from '@/hooks/use-notification';
import type { OperationDetail } from '@/lib/types';
import { adjustSchema, type AdjustInput } from '@/lib/validators';
import { useProducts, useStockLocations } from './hooks';
import { productLabel } from './LinesTable';
import { ApiError, request } from './request';
import { SelectField } from './SelectField';
import { StatusStepper } from './StatusStepper';

type Values = z.input<typeof adjustSchema>;

// Count what is on the shelf, the server logs the difference as one adjustment move
export function AdjustmentForm() {
  const router = useRouter();
  const { data: products } = useProducts();
  const { data: locations } = useStockLocations();
  const { control, register, handleSubmit, setError, setValue, getValues, formState } = useForm<Values, unknown, AdjustInput>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { productId: '', locationId: '', reason: '' },
  });
  const { errors, isSubmitting } = formState;

  // most counts happen in the main stock room, so start there
  React.useEffect(() => {
    if (locations?.[0] && !getValues('locationId')) setValue('locationId', locations[0].id);
  }, [locations, getValues, setValue]);

  const onSubmit = handleSubmit(async (input) => {
    try {
      const op = await request<OperationDetail>('/api/stock/adjust', 'POST', input);
      const removed = op.sourceLocationId === input.locationId;
      const change = removed ? `${op.lines[0].quantity} removed from ${op.from}` : `${op.lines[0].quantity} added to ${op.to}`;
      notification({ status: 'success', variant: 'stroke', title: `${op.reference}: ${change}` });
      mutate(`/api/operations/${op.id}`, op, { revalidate: false });
      router.replace(`/operations/adjustments/${op.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        for (const [field, text] of Object.entries(err.fields)) setError(field as Path<Values>, { message: text });
      }
      notification({ status: 'error', variant: 'stroke', title: err instanceof Error ? err.message : 'Something went wrong, try again' });
    }
  });

  return (
    <form noValidate onSubmit={onSubmit}>
      <h1 className='text-[28px] font-semibold leading-[34px]'>Adjustment</h1>

      <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-stroke-soft-200 pb-5'>
        <div className='flex flex-wrap gap-2'>
          <Button.Root type='submit' size='small' disabled={isSubmitting}>
            Validate
          </Button.Root>
          <Button.Root type='button' variant='neutral' mode='stroke' size='small' onClick={() => router.push('/operations/adjustments')}>
            Cancel
          </Button.Root>
        </div>
        <StatusStepper type='ADJ' status='draft' />
      </div>

      <p className='mt-8 max-w-xl text-text-sub-600'>
        Enter the quantity you counted. The difference from what the system holds is logged in Move History.
      </p>

      <div className='mt-5 grid grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-2'>
        <Controller
          control={control}
          name='productId'
          render={({ field }) => (
            <SelectField
              id='productId'
              label='Product'
              value={field.value}
              onChange={field.onChange}
              options={(products ?? []).map((p) => ({ value: p.id, label: productLabel(p) }))}
              placeholder='Pick a product'
              error={errors.productId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name='locationId'
          render={({ field }) => (
            <SelectField
              id='locationId'
              label='Location'
              value={field.value}
              onChange={field.onChange}
              options={(locations ?? []).map((l) => ({ value: l.id, label: l.fullName }))}
              placeholder='Pick a location'
              error={errors.locationId?.message}
            />
          )}
        />
        <Field
          id='countedQty'
          label='Counted Quantity'
          type='number'
          step='any'
          min='0'
          inputMode='decimal'
          className='tabular-nums'
          error={errors.countedQty?.message}
          {...register('countedQty', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
        />
        <Field id='reason' label='Reason' placeholder='Damaged, found, recount' error={errors.reason?.message} {...register('reason')} />
      </div>
    </form>
  );
}
