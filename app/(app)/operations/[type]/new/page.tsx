import { notFound } from 'next/navigation';
import { SLUG_TYPE, type OpSlug } from '@/components/operations/labels';
import { NewOperation } from '@/components/operations/OperationScreen';

export default async function NewOperationPage({ params }: { params: Promise<{ type: string }> }) {
  const type = SLUG_TYPE[(await params).type as OpSlug];
  if (!type || type === 'ADJ') notFound();
  return <NewOperation type={type} />;
}
