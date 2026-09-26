'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch, type Path } from 'react-hook-form';
import { mutate } from 'swr';
import type { z } from 'zod';
import { Field } from '@/components/auth/field';
import { LOW_STOCK_KEY } from '@/components/alerts/LowStockBell';
import { ValidateSuccess } from '@/components/motion/ValidateSuccess';
import * as Button from '@/components/ui/button';
import { notification } from '@/hooks/use-notification';
import { adjustmentDiff } from '@/lib/services/rules';
import type { OperationDetail } from '@/lib/types';
import { adjustSchema, type AdjustInput } from '@/lib/validators';
import { cn } from '@/utils/cn';
import { useProductStock, useProducts, useStockLocations } from './hooks';
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
  const { control, register, handleSubmit, setError, formState } = useForm<Values, unknown, AdjustInput>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { productId: '', locationId: '', reason: '' },
  });
  const { errors, isSubmitting } = formState;
  // set once the count is saved: the check plays, then the adjustment opens
  const [done, setDone] = React.useState<{ id: string; change: string } | null>(null);

  const [productId, locationId, countedQty] = useWatch({ control, name: ['productId', 'locationId', 'countedQty'] });
  const { data: stock, error: stockError } = useProductStock(productId);
  const picked = !!productId && !!locationId;
  const onHand = stock?.find((r) => r.locationId === locationId)?.quantity ?? 0;
  const onHandText = !picked ? '' : stockError ? 'Could not load' : !stock ? 'Loading...' : String(onHand);
  const where = locations?.find((l) => l.id === locationId)?.fullName ?? '';
  // same math the server runs, so the preview matches the move that gets logged
  const diff = picked && stock && typeof countedQty === 'number' && countedQty >= 0 ? adjustmentDiff(onHand, countedQty) : null;
  const preview =
    !diff ? null
    : diff.direction === 'none' ? 'Matches on hand, nothing to log'
    : diff.direction === 'in' ? `${diff.quantity} will be added to ${where}`
    : `${diff.quantity} will be removed from ${where}`;

  const onSubmit = handleSubmit(async (input) => {
    try {
      const op = await request<OperationDetail>('/api/stock/adjust', 'POST', input);
      const removed = op.sourceLocationId === input.locationId;
      const change = removed ? `${op.lines[0].quantity} removed from ${op.from}` : `${op.lines[0].quantity} added to ${op.to}`;
      mutate(`/api/operations/${op.id}`, op, { revalidate: false });
      mutate(LOW_STOCK_KEY); // the count may have fixed or caused a low stock alert
      setDone({ id: op.id, change });
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
          <Button.Root type='submit' size='small' disabled={isSubmitting || !!done}>
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
              error={errors.productId && 'Pick a product'}
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
              error={errors.locationId && 'Pick a location'}
            />
          )}
        />
        <Field id='onHand' label='On hand' value={onHandText} placeholder='Pick a product and a location' readOnly className='tabular-nums' />
        <div>
          <Field
            id='countedQty'
            label='Counted Quantity'
            type='number'
            step='any'
            min='0'
            inputMode='decimal'
            className='tabular-nums'
            // an empty box reaches zod as undefined, whose own message is not meant for people
            error={errors.countedQty && (errors.countedQty.type === 'invalid_type' ? 'Enter the quantity you counted' : errors.countedQty.message)}
            {...register('countedQty', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
          />
          {preview && !errors.countedQty && (
            <p
              aria-live='polite'
              className={cn(
                'mt-1 text-[13px] leading-[18px] text-text-sub-600',
                diff?.direction === 'in' && 'text-success-base',
                diff?.direction === 'out' && 'text-error-base',
              )}
            >
              {preview}
            </p>
          )}
        </div>
        <Field id='reason' label='Reason' placeholder='Damaged, found, recount' error={errors.reason?.message} {...register('reason')} />
      </div>
      <ValidateSuccess open={!!done} label={done?.change} onDone={() => done && router.replace(`/operations/adjustments/${done.id}`)} />
    </form>
  );
}
