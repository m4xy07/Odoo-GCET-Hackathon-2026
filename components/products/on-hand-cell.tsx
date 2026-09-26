'use client';

import * as React from 'react';
import { RiPencilLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Modal from '@/components/ui/modal';
import { Field } from '@/components/auth/field';
import { send } from '@/components/settings/request';
import { notification } from '@/hooks/use-notification';
import type { LocationRow } from '@/lib/services/catalog';
import type { OperationDetail, StockRow } from '@/lib/types';
import { adjustSchema } from '@/lib/validators';

type Props = { row: StockRow; location: LocationRow | null; onAdjusted: () => void };

// On hand is never overwritten: a new count becomes an adjustment, so Move History explains the change.
export function OnHandCell({ row, location, onAdjusted }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [counted, setCounted] = React.useState<number | null>(null); // set = confirm is open

  // totals over several locations have no single place to adjust
  if (!location) return <span className='tabular-nums'>{row.onHand}</span>;

  function start() {
    setValue(String(row.onHand));
    setError(null);
    setEditing(true);
  }

  function review() {
    const parsed = adjustSchema.safeParse({ productId: row.productId, locationId: location!.id, countedQty: value === '' ? NaN : Number(value) });
    if (!parsed.success) {
      const message = parsed.error.issues[0].message;
      return setError(message.startsWith('Invalid input') ? 'Enter a number' : message);
    }
    if (parsed.data.countedQty === row.onHand) return setEditing(false);
    setCounted(parsed.data.countedQty);
  }

  if (!editing) {
    return (
      <button
        type='button'
        onClick={start}
        aria-label={`Update on hand for ${row.name}`}
        className='group/edit inline-flex items-center gap-1.5 rounded-lg px-2 py-1 tabular-nums transition-colors duration-150 hover:bg-bg-weak-50'
      >
        {row.onHand}
        <RiPencilLine className='size-3.5 text-text-soft-400 transition-colors group-hover/edit:text-text-sub-600' />
      </button>
    );
  }

  return (
    <>
      <div className='inline-flex flex-col items-end gap-1'>
        <input
          autoFocus
          type='number'
          min={0}
          step='any'
          inputMode='decimal'
          aria-label={`New on hand for ${row.name}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') review();
            if (e.key === 'Escape') setEditing(false);
          }}
          // leaving an untouched box just closes it, a changed one waits for Enter
          onBlur={() => value === String(row.onHand) && setEditing(false)}
          className='h-8 w-24 rounded-lg px-2 text-right tabular-nums ring-1 ring-inset ring-stroke-soft-200 outline-none focus:ring-primary-base'
        />
        {error ? (
          <span className='text-paragraph-xs text-error-base'>{error}</span>
        ) : (
          <span className='text-paragraph-xs text-text-soft-400'>Enter to save, Esc to cancel</span>
        )}
      </div>
      {counted !== null && (
        <ConfirmAdjust
          row={row}
          location={location}
          counted={counted}
          onClose={(done) => {
            setCounted(null);
            if (done) {
              setEditing(false);
              onAdjusted();
            }
          }}
        />
      )}
    </>
  );
}

type ConfirmProps = { row: StockRow; location: LocationRow; counted: number; onClose: (done: boolean) => void };

function ConfirmAdjust({ row, location, counted, onClose }: ConfirmProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const op = await send<OperationDetail>('POST', '/api/stock/adjust', {
        productId: row.productId,
        locationId: location.id,
        countedQty: counted,
        reason: reason.trim() || undefined,
      });
      notification({ status: 'success', title: `Stock updated, logged as ${op.reference}` });
      onClose(true);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal.Root open onOpenChange={(open) => !open && onClose(false)}>
      <Modal.Content>
        <Modal.Header title='Update stock' />
        <Modal.Body className='flex flex-col gap-4'>
          <p className='text-paragraph-sm'>
            Set <span className='font-medium'>{row.name}</span> at <span className='font-medium'>{location.fullName}</span> from{' '}
            <span className='font-medium tabular-nums'>{row.onHand}</span> to <span className='font-medium tabular-nums'>{counted}</span>? This
            logs an adjustment.
          </p>
          <Field id='adjust-reason' label='Reason (optional)' placeholder='Damaged, recount' maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} />
          {error && <p className='text-paragraph-sm text-error-base'>{error}</p>}
        </Modal.Body>
        <Modal.Footer className='justify-end'>
          <Button.Root variant='neutral' mode='stroke' size='small' onClick={() => onClose(false)}>
            Cancel
          </Button.Root>
          <Button.Root size='small' onClick={confirm} disabled={busy}>
            {busy ? 'Saving...' : 'Confirm'}
          </Button.Root>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
