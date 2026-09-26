import { PrintView } from '@/components/operations/PrintView';

// Lives outside the (app) group so the top bar never ends up on paper
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  return <PrintView id={(await params).id} />;
}
