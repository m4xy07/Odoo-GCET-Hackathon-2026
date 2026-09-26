'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import * as Button from '@/components/ui/button';
import type { OpType } from '@/lib/types';
import { useBlankOperation, useOperation } from './hooks';
import { TYPE_SLUG } from './labels';
import { OperationForm } from './OperationForm';

type Prefill = { product: string; quantity: number };

export function NewOperation({ type: initialType, prefill }: { type: OpType; prefill?: Prefill }) {
  const router = useRouter();
  const [type, setType] = React.useState(initialType);
  const { data, error, mutate: retry } = useBlankOperation(type);

  if (error) return <LoadError message={error.message} onRetry={() => retry()} />;
  if (!data) return <FormSkeleton />;
  return (
    <OperationForm
      op={data}
      isNew
      onTypeChange={setType}
      prefill={prefill}
      onDone={(saved) => {
        mutate(`/api/operations/${saved.id}`, saved, { revalidate: false }); // the next page opens without a spinner
        router.replace(`/operations/${TYPE_SLUG[saved.type]}/${saved.id}`);
      }}
    />
  );
}

export function ExistingOperation({ id }: { id: string }) {
  const { data, error, mutate: update } = useOperation(id);

  if (error) return <LoadError message={error.message} onRetry={() => update()} />;
  if (!data) return <FormSkeleton />;
  return <OperationForm op={data} isNew={false} onDone={(saved) => update(saved, { revalidate: false })} />;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role='alert' className='mx-auto mt-16 flex max-w-sm flex-col items-center gap-4 text-center'>
      <p className='text-[17px] font-semibold leading-[22px]'>{message}</p>
      <div className='flex gap-2'>
        <Button.Root variant='neutral' mode='stroke' size='small' onClick={onRetry}>
          Try again
        </Button.Root>
        <Button.Root asChild variant='neutral' mode='ghost' size='small'>
          <Link href='/'>Go to dashboard</Link>
        </Button.Root>
      </div>
    </div>
  );
}

function FormSkeleton() {
  const block = 'animate-pulse rounded-10 bg-bg-weak-50';
  return (
    <div aria-busy='true' aria-label='Loading'>
      <div className={`${block} h-9 w-40`} />
      <div className={`${block} mt-5 h-9 w-72`} />
      <div className={`${block} mt-8 h-7 w-36`} />
      <div className='mt-5 grid grid-cols-1 gap-5 md:grid-cols-2'>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-16`} />
        ))}
      </div>
      <div className={`${block} mt-10 h-40`} />
    </div>
  );
}
