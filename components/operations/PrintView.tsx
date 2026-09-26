'use client';

import Link from 'next/link';
import { RiArrowLeftLine, RiPrinterLine } from '@remixicon/react';
import { Logo } from '@/components/shell/logo';
import * as Button from '@/components/ui/button';
import { useOperation } from './hooks';
import { TYPE_SLUG, TYPE_TITLE } from './labels';
import { productLabel } from './LinesTable';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// A plain A4 page of a done operation. The buttons hide on paper.
export function PrintView({ id }: { id: string }) {
  const { data: op, error } = useOperation(id);
  const back = op ? `/operations/${TYPE_SLUG[op.type]}/${op.id}` : '/';

  if (error) return <Message text={error.message} back={back} />;
  if (!op) return <div aria-busy='true' className='mx-auto mt-16 h-96 max-w-[720px] animate-pulse rounded-16 bg-bg-weak-50' />;
  if (op.status !== 'done') return <Message text='Printing opens once the operation is done' back={back} />;

  const contactLabel = op.type === 'IN' ? 'Receive From' : 'Delivery Address';
  const details = [
    ...(op.contact ? [[contactLabel, op.contact]] : []),
    ['Schedule Date', formatDate(op.scheduledDate)],
    ['Responsible', op.responsible.name],
    ['From', op.from],
    ['To', op.to],
    ...(op.notes ? [['Notes', op.notes]] : []),
  ];

  return (
    <div className='mx-auto max-w-[720px] px-4 py-8 print:max-w-none print:p-0'>
      <div className='mb-8 flex items-center justify-between print:hidden'>
        <Button.Root asChild variant='neutral' mode='ghost' size='small'>
          <Link href={back}>
            <Button.Icon as={RiArrowLeftLine} />
            Back
          </Link>
        </Button.Root>
        <Button.Root size='small' onClick={() => window.print()}>
          <Button.Icon as={RiPrinterLine} />
          Print
        </Button.Root>
      </div>

      <article className='rounded-16 border border-stroke-soft-200 p-8 print:rounded-none print:border-0 print:p-0'>
        <header className='flex items-start justify-between gap-4 border-b border-stroke-soft-200 pb-6'>
          <Logo />
          <div className='text-right'>
            <p className='text-[13px] leading-[18px] text-text-sub-600'>{TYPE_TITLE[op.type]}</p>
            <h1 className='text-[22px] font-semibold leading-7 tabular-nums'>{op.reference}</h1>
            <p className='mt-1 text-[13px] font-medium leading-[18px] text-success-base'>Done</p>
          </div>
        </header>

        <dl className='grid grid-cols-2 gap-x-8 gap-y-4 py-6'>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className='text-[13px] leading-[18px] text-text-sub-600'>{label}</dt>
              <dd className='mt-0.5'>{value}</dd>
            </div>
          ))}
        </dl>

        <table className='w-full'>
          <thead>
            <tr className='border-b border-stroke-soft-200 text-left text-[13px] leading-[18px] text-text-sub-600'>
              <th className='py-2 font-normal'>Product</th>
              <th className='py-2 text-right font-normal'>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {op.lines.map((line) => (
              <tr key={line.productId} className='border-b border-stroke-soft-200'>
                <td className='py-3'>{productLabel(line)}</td>
                <td className='py-3 text-right tabular-nums'>{line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className='mt-16 grid grid-cols-2 gap-8 text-[13px] leading-[18px] text-text-sub-600'>
          <p className='border-t border-stroke-soft-200 pt-2'>Checked by</p>
          <p className='border-t border-stroke-soft-200 pt-2'>Received by</p>
        </footer>
      </article>
    </div>
  );
}

function Message({ text, back }: { text: string; back: string }) {
  return (
    <div role='alert' className='mx-auto mt-16 flex max-w-sm flex-col items-center gap-4 px-4 text-center'>
      <p className='text-[17px] font-semibold leading-[22px]'>{text}</p>
      <Button.Root asChild variant='neutral' mode='stroke' size='small'>
        <Link href={back}>Back</Link>
      </Button.Root>
    </div>
  );
}
