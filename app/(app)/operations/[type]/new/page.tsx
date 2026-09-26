import { notFound } from 'next/navigation';
import { AdjustmentForm } from '@/components/operations/AdjustmentForm';
import { SLUG_TYPE, type OpSlug } from '@/components/operations/labels';
import { NewOperation } from '@/components/operations/OperationScreen';

export default async function NewOperationPage({ params }: { params: Promise<{ type: string }> }) {
  const type = SLUG_TYPE[(await params).type as OpSlug];
  if (!type) notFound();
  return type === 'ADJ' ? <AdjustmentForm /> : <NewOperation type={type} />;
}
