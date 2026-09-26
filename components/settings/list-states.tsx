import { RiDeleteBinLine, RiPencilLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className='flex flex-col gap-2' aria-label='Loading'>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className='h-[52px] animate-pulse rounded-10 bg-bg-weak-50' />
      ))}
    </div>
  );
}

export function EmptyBox({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className='flex flex-col items-center gap-2 rounded-16 border border-stroke-soft-200 px-6 py-12 text-center'>
      <p className='text-label-md text-text-strong-950'>{title}</p>
      <p className='max-w-sm text-paragraph-sm text-text-sub-600'>{text}</p>
      {action && <div className='mt-3'>{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className='flex flex-col items-start gap-3 rounded-16 border border-stroke-soft-200 p-5 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-paragraph-sm text-error-base'>{message}</p>
      <Button.Root variant='neutral' mode='stroke' size='small' onClick={onRetry}>
        Try again
      </Button.Root>
    </div>
  );
}

// Title with the one primary action right beside it, top left like the mockup
export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className='mb-6 flex flex-col gap-1 md:mb-8'>
      <div className='flex items-center gap-4'>
        <h1 className='text-[28px] font-semibold leading-[34px] tracking-tight'>{title}</h1>
        {action}
      </div>
      <p className='text-paragraph-sm text-text-sub-600'>{subtitle}</p>
    </div>
  );
}

export function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className='flex justify-end gap-1'>
      <Button.Root variant='neutral' mode='ghost' size='xxsmall' aria-label={`Edit ${label}`} onClick={onEdit}>
        <Button.Icon as={RiPencilLine} />
      </Button.Root>
      <Button.Root variant='neutral' mode='ghost' size='xxsmall' aria-label={`Delete ${label}`} onClick={onDelete}>
        <Button.Icon as={RiDeleteBinLine} />
      </Button.Root>
    </div>
  );
}
