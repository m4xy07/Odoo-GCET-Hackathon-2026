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

// One line under the page title saying what the page holds
export function Subtitle({ children }: { children: React.ReactNode }) {
  return <p className='-mt-3 mb-5 text-paragraph-sm text-text-sub-600 md:-mt-5 md:mb-6'>{children}</p>;
}
