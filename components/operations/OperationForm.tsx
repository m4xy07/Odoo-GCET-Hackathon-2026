'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiPrinterLine } from '@remixicon/react';
import { Controller, FormProvider, useForm, useWatch, type Path } from 'react-hook-form';
import { mutate } from 'swr';
import type { z } from 'zod';
import { Field } from '@/components/auth/field';
import { ValidateSuccess } from '@/components/motion/ValidateSuccess';
import { LateTag } from '@/components/lists/StatusBadge';
import * as Button from '@/components/ui/button';
import * as Modal from '@/components/ui/modal';
import { notification } from '@/hooks/use-notification';
import type { OperationDetail, OpType } from '@/lib/types';
import { operationSchema, type OperationInput } from '@/lib/validators';
import { useProducts, useStockLocations } from './hooks';
import { TYPE_SLUG, TYPE_TITLE } from './labels';
import { LinesTable } from './LinesTable';
import { ApiError, request } from './request';
import { SelectField } from './SelectField';
import { StatusStepper } from './StatusStepper';

export type FormValues = z.input<typeof operationSchema>;
type StockAction = Exclude<OperationDetail['actions'][number], 'print'>;

const ACTION_LABEL = { confirm: 'To Do', check: 'Check Availability', validate: 'Validate' } as const;

// Shown in the success check after Validate, which replaces the toast for that moment
const DONE_TEXT: Record<OpType, string> = {
  IN: 'Stock added',
  OUT: 'Stock removed',
  INT: 'Stock moved',
  ADJ: 'Adjusted',
};

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the user's time zone

function toValues(op: OperationDetail, isNew: boolean): FormValues {
  return {
    type: op.type,
    contact: op.contact,
    sourceLocation: op.sourceLocationId,
    destLocation: op.destLocationId,
    scheduledDate: isNew ? today() : op.scheduledDate.slice(0, 10),
    lines: op.lines.map((l) => ({ product: l.productId, quantity: l.quantity })),
  };
}

function announce(op: OperationDetail, action?: StockAction) {
  const short = op.lines.filter((l) => !l.available).length;
  if (op.status === 'waiting') {
    return notification({
      status: 'warning',
      variant: 'stroke',
      title: `Not enough stock for ${short} product${short === 1 ? '' : 's'}`,
      description: 'The delivery waits until stock comes in.',
    });
  }
  if (action === 'validate') return; // the success check says it
  const title = action === 'cancel' ? `${op.reference} canceled` : action ? `${op.reference} is ready` : 'Saved';
  notification({ status: 'success', variant: 'stroke', title });
}

type Props = {
  op: OperationDetail;
  isNew: boolean;
  onTypeChange?: (type: OpType) => void; // a new delivery can become an internal transfer
  prefill?: { product: string; quantity: number }; // one starting line, e.g. from a low stock suggestion
  onDone: (op: OperationDetail) => void;
};

// Receipt, delivery and internal transfer share this form. Buttons come from the server's actions list.
export function OperationForm({ op, isNew, onTypeChange, prefill, onDone }: Props) {
  const router = useRouter();
  const { data: products } = useProducts();
  const { data: locations } = useStockLocations();
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [canceling, setCanceling] = React.useState(false);
  const [validated, setValidated] = React.useState(false);

  const form = useForm<FormValues, unknown, OperationInput>({
    resolver: zodResolver(operationSchema),
    defaultValues: { ...toValues(op, isNew), ...(prefill && { lines: [prefill] }) },
  });
  const { register, handleSubmit, reset, getValues, setError, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;

  // A new server answer replaces the form. On a new form, a type switch keeps what was typed.
  React.useEffect(() => {
    const fresh = toValues(op, isNew);
    if (isNew) Object.assign(fresh, { contact: getValues('contact'), scheduledDate: getValues('scheduledDate'), lines: getValues('lines') });
    reset(fresh);
  }, [op, isNew, reset, getValues]);

  const draft = op.status === 'draft';
  // Layout follows the form's own type, so switching Delivery to Internal Transfer mounts the new
  // fields only after their values are in. A select mounted with a value it does not list clears itself.
  const type = useWatch({ control: form.control, name: 'type' }) as OpType;
  const slug = TYPE_SLUG[type];
  const busy = isSubmitting || canceling;
  const primary = op.actions.find((a): a is keyof typeof ACTION_LABEL => a in ACTION_LABEL);
  const locationOptions = (locations ?? []).map((l) => ({ value: l.id, label: l.fullName }));

  function showError(err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong, try again';
    if (err instanceof ApiError && err.fields) {
      for (const [field, text] of Object.entries(err.fields)) setError(field as Path<FormValues>, { message: text });
    }
    notification({ status: 'error', variant: 'stroke', title: message });
    // 409 means the document moved on, often in another tab: reload it so the buttons match the server again
    if (err instanceof ApiError && err.status === 409 && !isNew) mutate(`/api/operations/${op.id}`);
  }

  async function save(input: OperationInput) {
    if (isNew) return request<OperationDetail>('/api/operations', 'POST', input);
    if (isDirty && op.canEdit) return request<OperationDetail>(`/api/operations/${op.id}`, 'PATCH', input);
    return op;
  }

  // Unsaved edits are stored first, then the action runs on the saved document
  const run = (action?: StockAction) =>
    handleSubmit(async (input) => {
      let saved: OperationDetail;
      try {
        saved = await save(input);
      } catch (err) {
        return showError(err);
      }
      // saving new quantities can already move a delivery between waiting and ready
      const stillAllowed = action && saved.actions.includes(action) ? action : undefined;
      try {
        if (stillAllowed) saved = await request<OperationDetail>(`/api/operations/${saved.id}/${stillAllowed}`, 'POST');
        announce(saved, stillAllowed);
        if (stillAllowed === 'validate') setValidated(true);
      } catch (err) {
        showError(err);
      }
      if (saved !== op) onDone(saved); // a failed action on an unchanged form must not overwrite the reload
    })();

  async function cancel() {
    setCanceling(true);
    try {
      const canceled = await request<OperationDetail>(`/api/operations/${op.id}/cancel`, 'POST');
      announce(canceled, 'cancel');
      onDone(canceled);
    } catch (err) {
      showError(err);
    } finally {
      setCanceling(false);
      setConfirmCancel(false);
    }
  }

  const locationField = (name: 'sourceLocation' | 'destLocation', label: string) => (
    <Controller
      key={name}
      control={form.control}
      name={name}
      render={({ field }) => (
        <SelectField
          id={name}
          label={label}
          value={field.value}
          onChange={field.onChange}
          options={locationOptions}
          placeholder='Pick a location'
          error={errors[name] && 'Pick a location'}
          disabled={!draft}
        />
      )}
    />
  );
  const fields = {
    contact: (
      <Field
        key='contact'
        id='contact'
        label={type === 'IN' ? 'Receive From' : 'Delivery Address'}
        readOnly={!draft}
        error={errors.contact?.message}
        {...register('contact')}
      />
    ),
    date: (
      <Field key='date' id='scheduledDate' type='date' label='Schedule Date' readOnly={!draft} error={errors.scheduledDate?.message} {...register('scheduledDate')} />
    ),
    responsible: <Field key='responsible' id='responsible' label='Responsible' value={op.responsible.name} readOnly />,
    type: (
      <SelectField
        key='type'
        id='operationType'
        label='Operation type'
        value={type}
        onChange={(t) => onTypeChange?.(t as OpType)}
        options={[
          { value: 'OUT', label: 'Delivery' },
          { value: 'INT', label: 'Internal Transfer' },
        ]}
        disabled={!isNew || busy}
      />
    ),
    from: locationField('sourceLocation', 'From'),
    to: locationField('destLocation', 'To'),
    // an adjustment has a virtual end, which is not in the stock location list
    adjFrom: <Field key='adjFrom' id='from' label='From' value={op.from} readOnly />,
    adjTo: <Field key='adjTo' id='to' label='To' value={op.to} readOnly />,
    reason: <Field key='reason' id='reason' label='Reason' value={op.notes ?? ''} readOnly />,
  };
  // mockup order first (left column, then right), locations after
  const layout: Record<OpType, React.ReactNode[]> = {
    IN: [fields.contact, fields.date, fields.responsible, fields.to],
    OUT: [fields.contact, fields.date, fields.responsible, fields.type, fields.from],
    INT: [fields.from, fields.date, fields.to, fields.type, fields.responsible],
    ADJ: [fields.adjFrom, fields.date, fields.adjTo, fields.responsible, ...(op.notes ? [fields.reason] : [])],
  };

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          // Enter only saves: it must never validate and move stock by accident
          if (isNew || isDirty) run();
        }}
      >
        <div className='flex items-center gap-3'>
          {!isNew && (
            <Button.Root asChild variant='neutral' mode='stroke' size='small'>
              <Link href={`/operations/${slug}/new`}>New</Link>
            </Button.Root>
          )}
          <h1 className='text-[28px] font-semibold leading-[34px]'>{TYPE_TITLE[type]}</h1>
        </div>

        <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-stroke-soft-200 pb-5'>
          <div className='flex flex-wrap gap-2'>
            {primary && (
              <Button.Root type='button' size='small' disabled={busy} onClick={() => run(primary)}>
                {ACTION_LABEL[primary]}
              </Button.Root>
            )}
            {(isNew || (isDirty && op.canEdit)) && (
              <Button.Root type='button' variant='neutral' mode='stroke' size='small' disabled={busy} onClick={() => run()}>
                Save
              </Button.Root>
            )}
            {op.actions.includes('print') ? (
              <Button.Root asChild variant='neutral' mode='stroke' size='small'>
                <Link href={`/operations/${slug}/${op.id}/print`}>
                  <Button.Icon as={RiPrinterLine} />
                  Print
                </Link>
              </Button.Root>
            ) : (
              <Button.Root type='button' variant='neutral' mode='stroke' size='small' disabled title='Print once it is done'>
                <Button.Icon as={RiPrinterLine} />
                Print
              </Button.Root>
            )}
            {(isNew || op.actions.includes('cancel')) && (
              <Button.Root
                type='button'
                variant='neutral'
                mode='stroke'
                size='small'
                disabled={busy}
                onClick={() => (isNew ? router.push(`/operations/${slug}`) : setConfirmCancel(true))}
              >
                Cancel
              </Button.Root>
            )}
          </div>
          <StatusStepper type={type} status={op.status} />
        </div>

        <div className='mt-8 flex items-center gap-3 text-[22px] font-semibold leading-7 tabular-nums'>
          {op.reference}
          {isNew && <span className='text-[13px] font-normal leading-[18px] text-text-sub-600'>new</span>}
          {op.isLate && <LateTag />}
        </div>

        <div className='mt-5 grid grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-2'>{layout[type]}</div>

        <LinesTable products={products} savedLines={op.lines} from={op.from} lockProducts={!draft} readOnly={!op.canEdit} />
      </form>

      <Modal.Root open={confirmCancel} onOpenChange={setConfirmCancel}>
        <Modal.Content className='max-w-[400px]'>
          <Modal.Header title={`Cancel ${op.reference}?`} description='It moves to Canceled and can no longer be edited.' />
          <Modal.Footer>
            <Modal.Close asChild>
              <Button.Root variant='neutral' mode='stroke' size='small' className='w-full'>
                Keep it
              </Button.Root>
            </Modal.Close>
            <Button.Root variant='error' size='small' className='w-full' disabled={canceling} onClick={cancel}>
              Cancel operation
            </Button.Root>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
      <ValidateSuccess open={validated} onDone={() => setValidated(false)} label={DONE_TEXT[type]} />
    </FormProvider>
  );
}
