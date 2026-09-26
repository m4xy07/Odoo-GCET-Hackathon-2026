'use client';

import { RiAddLine, RiCloseLine } from '@remixicon/react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import * as Input from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import type { OperationDetail, ProductRow } from '@/lib/types';
import { cn } from '@/utils/cn';
import type { FormValues } from './OperationForm';

type Props = {
  products?: ProductRow[];
  savedLines: OperationDetail['lines'];
  from: string;
  lockProducts: boolean; // waiting and ready only allow quantity changes
  readOnly: boolean; // done and canceled
};

export const productLabel = (p: { sku: string; name: string }) => `[${p.sku}] ${p.name}`;

const ErrorText = ({ message }: { message?: string }) =>
  message ? <p className='mt-1 text-[13px] leading-[18px] text-error-base'>{message}</p> : null;

// Product · Quantity, with the "New Product" row from the mockup. A red row means not enough free stock.
export function LinesTable({ products, savedLines, from, lockProducts, readOnly }: Props) {
  const { control, register, formState } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = useWatch({ control, name: 'lines' });
  const saved = new Map(savedLines.map((l) => [l.productId, l]));
  const editProducts = !readOnly && !lockProducts;
  const errors = formState.errors.lines;

  const nameOf = (id: string) => {
    const product = products?.find((p) => p.id === id) ?? saved.get(id);
    return product ? productLabel(product) : 'Unknown product';
  };

  return (
    <section aria-labelledby='products-title' className='mt-10'>
      <h2 id='products-title' className='text-[17px] font-semibold leading-[22px]'>
        Products
      </h2>
      <table className='mt-3 w-full'>
        <thead>
          <tr className='border-b border-stroke-soft-200 text-left text-[13px] leading-[18px] text-text-sub-600'>
            <th className='py-2 font-normal'>Product</th>
            <th className='w-28 py-2 text-right font-normal sm:w-36'>Quantity</th>
            {editProducts && (
              <th className='w-10'>
                <span className='sr-only'>Remove</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {fields.map((field, i) => {
            const productId = lines?.[i]?.product ?? '';
            const line = saved.get(productId);
            const short = line && !line.available && !readOnly;
            return (
              <tr key={field.id} className={cn('border-b border-stroke-soft-200 align-top', short && 'bg-error-lighter')}>
                <td className='py-3 pr-3'>
                  {editProducts ? (
                    <Controller
                      control={control}
                      name={`lines.${i}.product`}
                      render={({ field: select }) => (
                        <Select.Root value={select.value} onValueChange={select.onChange} size='small' hasError={!!errors?.[i]?.product}>
                          <Select.Trigger aria-label='Product' className='w-full'>
                            <Select.Value placeholder='Pick a product' />
                          </Select.Trigger>
                          <Select.Content>
                            {products?.map((p) => (
                              <Select.Item key={p.id} value={p.id}>
                                {productLabel(p)}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  ) : (
                    <span className={cn('block py-1.5', short && 'text-error-base')}>{nameOf(productId)}</span>
                  )}
                  {short && (
                    <p className='mt-1 text-[13px] leading-[18px] text-error-base'>
                      Only {line.freeToUse} free in {from}
                    </p>
                  )}
                  <ErrorText message={errors?.[i]?.product?.message} />
                </td>
                <td className='py-3 text-right'>
                  {readOnly ? (
                    <span className='block py-1.5 tabular-nums'>{lines?.[i]?.quantity}</span>
                  ) : (
                    <Input.Root size='small' hasError={!!errors?.[i]?.quantity}>
                      <Input.Wrapper>
                        <Input.Input
                          type='number'
                          step='any'
                          min='0'
                          inputMode='decimal'
                          aria-label='Quantity'
                          className='text-right tabular-nums'
                          {...register(`lines.${i}.quantity`, { setValueAs: (v) => (v === '' ? 0 : Number(v)) })}
                        />
                      </Input.Wrapper>
                    </Input.Root>
                  )}
                  <ErrorText message={errors?.[i]?.quantity?.message} />
                </td>
                {editProducts && (
                  <td className='py-3 pl-2 text-right'>
                    <button
                      type='button'
                      onClick={() => remove(i)}
                      aria-label='Remove line'
                      className='rounded-lg p-2 text-text-soft-400 transition-colors duration-150 hover:bg-bg-weak-50 hover:text-text-strong-950'
                    >
                      <RiCloseLine className='size-4' />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          {fields.length === 0 && (
            <tr className='border-b border-stroke-soft-200'>
              <td colSpan={3} className='py-6 text-center text-[13px] leading-[18px] text-text-sub-600'>
                No products yet{editProducts && ', add one below'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {editProducts && (
        <button
          type='button'
          onClick={() => append({ product: '', quantity: 1 })}
          className='flex w-full items-center gap-2 border-b border-stroke-soft-200 py-3 text-left text-primary-base transition-colors duration-150 hover:text-primary-darker'
        >
          <RiAddLine className='size-4' />
          New Product
        </button>
      )}
      <ErrorText message={errors?.message ?? errors?.root?.message} />
    </section>
  );
}
