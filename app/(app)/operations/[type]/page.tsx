'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  notFound,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'motion/react';
import { RiAddLine, RiCloseLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import { DataTable, type Column } from '@/components/lists/DataTable';
import { KanbanBoard } from '@/components/lists/KanbanBoard';
import { SearchBar } from '@/components/lists/SearchBar';
import { ViewToggle, type ListView } from '@/components/lists/ViewToggle';
import {
  LateTag,
  STATUS_LABEL,
  StatusBadge,
} from '@/components/lists/StatusBadge';
import { formatDate } from '@/components/lists/format';
import { EmptyState } from '@/components/motion/EmptyState';
import { fetcher } from '@/lib/fetcher';
import type { OperationRow, OpStatus, OpType } from '@/lib/types';

// URL segment -> operation type, the words the page uses and the kanban columns its state machine can reach
const PAGES: Record<
  string,
  { type: OpType; title: string; noun: string; statuses: OpStatus[] }
> = {
  receipts: {
    type: 'IN',
    title: 'Receipts',
    noun: 'receipts',
    statuses: ['draft', 'ready', 'done', 'canceled'],
  },
  deliveries: {
    type: 'OUT',
    title: 'Deliveries',
    noun: 'deliveries',
    statuses: ['draft', 'waiting', 'ready', 'done', 'canceled'],
  },
  transfers: {
    type: 'INT',
    title: 'Internal Transfers',
    noun: 'transfers',
    statuses: ['draft', 'ready', 'done', 'canceled'],
  },
  adjustments: {
    type: 'ADJ',
    title: 'Adjustments',
    noun: 'adjustments',
    statuses: ['draft', 'done', 'canceled'],
  },
};

function OperationCard({ op }: { op: OperationRow }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='flex items-center justify-between gap-2 text-[15px] font-medium'>
        {op.reference}
        {op.isLate && <LateTag />}
      </span>
      {op.contact && <span>{op.contact}</span>}
      <span className='text-text-sub-600'>
        {op.from} → {op.to}
      </span>
      <span className='text-text-sub-600 tabular-nums'>
        {formatDate(op.scheduledDate)}
      </span>
    </div>
  );
}

const columns: Column<OperationRow>[] = [
  {
    key: 'reference',
    header: 'Reference',
    cell: (op) => (
      <span className='flex items-center gap-2 font-medium'>
        {op.reference}
        {op.isLate && <LateTag />}
      </span>
    ),
  },
  { key: 'from', header: 'From', cell: (op) => op.from, hideOnMobile: true },
  { key: 'to', header: 'To', cell: (op) => op.to, hideOnMobile: true },
  {
    key: 'contact',
    header: 'Contact',
    cell: (op) => op.contact,
    hideOnMobile: true,
  },
  {
    key: 'date',
    header: 'Schedule date',
    cell: (op) => formatDate(op.scheduledDate),
    hideOnMobile: true,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (op) => <StatusBadge status={op.status} />,
  },
];

export default function OperationsListPage() {
  const { type: slug } = useParams<{ type: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ListView>('list'); // mockup: "By default land on List View"

  const page = PAGES[slug];
  // the dashboard links here with ?status=ready (or late=1) to open a filtered list
  const status = searchParams.get('status') as OpStatus | null;
  const late = searchParams.get('late') === '1';

  const params = new URLSearchParams({ type: page?.type ?? '', q: query });
  if (status) params.set('status', status);
  if (late) params.set('late', '1');
  const { data, error, isLoading, mutate } = useSWR<OperationRow[]>(
    page ? `/api/operations?${params}` : null,
    fetcher,
    { keepPreviousData: true },
  );

  if (!page) notFound();

  const filterLabel = late ? 'Late' : status && STATUS_LABEL[status];
  const openOperation = (op: OperationRow) =>
    router.push(`/operations/${slug}/${op.id}`);
  const empty = (
    <EmptyState
      title={query ? `No ${page.noun} match "${query}"` : `No ${page.noun} yet`}
      description={
        query
          ? 'Search looks at the reference and the contact.'
          : 'Create one with New and it shows up here.'
      }
    />
  );

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <Button.Root asChild size='small'>
          <Link href={`/operations/${slug}/new`}>
            <Button.Icon as={RiAddLine} />
            New
          </Link>
        </Button.Root>
        <h1 className='text-[28px] leading-[34px] font-semibold'>
          {page.title}
        </h1>
        <div className='ml-auto flex w-full items-center gap-2 sm:w-auto'>
          <SearchBar
            onSearch={setQuery}
            placeholder='Search reference or contact'
          />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {filterLabel && (
        <Link
          href={`/operations/${slug}`}
          className='bg-bg-weak-50 text-text-sub-600 hover:text-text-strong-950 flex w-fit items-center gap-1 rounded-full py-1 pr-2 pl-3 text-[13px]'
        >
          Showing {filterLabel.toLowerCase()} only
          <RiCloseLine className='size-4' aria-label='Clear filter' />
        </Link>
      )}

      {error ? (
        <div className='rounded-16 border-stroke-soft-200 flex flex-col items-start gap-3 border p-6'>
          <p className='text-[15px]'>{error.message}</p>
          <Button.Root
            size='xsmall'
            variant='neutral'
            mode='stroke'
            onClick={() => mutate()}
          >
            Try again
          </Button.Root>
        </div>
      ) : (
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
          >
            {view === 'list' || !data ? (
              <DataTable
                columns={columns}
                rows={data}
                isLoading={isLoading}
                rowKey={(op) => op.id}
                onRowClick={openOperation}
                empty={empty}
              />
            ) : data.length === 0 ? (
              empty
            ) : (
              <KanbanBoard
                columns={page.statuses.map((s) => ({
                  key: s,
                  label: STATUS_LABEL[s],
                }))}
                rows={data}
                groupOf={(op) => op.status}
                rowKey={(op) => op.id}
                renderCard={(op) => <OperationCard op={op} />}
                onCardClick={openOperation}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
