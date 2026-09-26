import { notFound } from 'next/navigation';
import { SLUG_TYPE } from '@/components/operations/labels';
import { ExistingOperation } from '@/components/operations/OperationScreen';

export default async function OperationPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!(type in SLUG_TYPE)) notFound();
  return <ExistingOperation id={id} />;
}
