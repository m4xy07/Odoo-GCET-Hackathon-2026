import { notFound } from 'next/navigation';
import { z } from 'zod';
import { AdjustmentForm } from '@/components/operations/AdjustmentForm';
import { SLUG_TYPE, type OpSlug } from '@/components/operations/labels';
import { NewOperation } from '@/components/operations/OperationScreen';
import { objectId } from '@/lib/validators';

// ?product=<id>&qty=<n> starts the form with that line, e.g. "Create receipt" on a low stock suggestion.
// A bad product just means an empty form, a bad qty falls back to 1.
const prefillSchema = z.object({ product: objectId, qty: z.coerce.number().positive().catch(1) });

type Props = { params: Promise<{ type: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewOperationPage({ params, searchParams }: Props) {
  const type = SLUG_TYPE[(await params).type as OpSlug];
  if (!type) notFound();
  if (type === 'ADJ') return <AdjustmentForm />;

  const query = prefillSchema.safeParse(await searchParams);
  const prefill = query.success ? { product: query.data.product, quantity: query.data.qty } : undefined;
  return <NewOperation type={type} prefill={prefill} />;
}
