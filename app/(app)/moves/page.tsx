'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'motion/react';
import * as Button from '@/components/ui/button';
import { DataTable, type Column } from '@/components/lists/DataTable';
import { KanbanBoard } from '@/components/lists/KanbanBoard';
import { NewOperationMenu } from '@/components/lists/NewOperationMenu';
import { SearchBar } from '@/components/lists/SearchBar';
import { StatusBadge } from '@/components/lists/StatusBadge';
import { ViewToggle, type ListView } from '@/components/lists/ViewToggle';
import { formatDate } from '@/components/lists/format';
import { EmptyState } from '@/components/motion/EmptyState';
import { fetcher } from '@/lib/fetcher';
import type { MoveRow } from '@/lib/types';
import { cn } from '@/utils/cn';

// mockup: "In event should be displayed in green, Out moves in red"
const DIRECTION_COLOR: Record<MoveRow['direction'], string> = {
  in: 'text-success-base',
  out: 'text-error-base',
  internal: '',
};

const signed = (m: MoveRow) =>
  `${m.direction === 'in' ? '+' : m.direction === 'out' ? '−' : ''}${m.quantity}`;

// every ledger line is done, so the kanban groups by document type instead
const TYPE_COLUMNS = [
  { key: 'IN', label: 'Receipts' },
  { key: 'OUT', label: 'Deliveries' },
  { key: 'INT', label: 'Internal Transfers' },
  { key: 'ADJ', label: 'Adjustments' },
];

const columns: Column<MoveRow>[] = [
  {
    key: 'reference',
    header: 'Reference',
    cell: (m) => (
      <span className='flex flex-col leading-[18px]'>
        <span className='font-medium'>{m.reference}</span>
        <span className='text-[13px] opacity-80'>
          [{m.sku}] {m.product}
        </span>
      </span>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    cell: (m) => formatDate(m.date),
    hideOnMobile: true,
  },
  {
    key: 'contact',
    header: 'Contact',
    cell: (m) => m.contact,
    hideOnMobile: true,
  },
  { key: 'from', header: 'From', cell: (m) => m.from, hideOnMobile: true },
  { key: 'to', header: 'To', cell: (m) => m.to, hideOnMobile: true },
  {
    key: 'quantity',
    header: 'Quantity',
    cell: signed,
    className: 'text-right',
  },
  {
    key: 'status',
    header: 'Status',
    cell: (m) => <StatusBadge status={m.status} />,
  },
];

function MoveCard({ move }: { move: MoveRow }) {
  return (
    <div className={cn('flex flex-col gap-1', DIRECTION_COLOR[move.direction])}>
      <span className='flex justify-between text-[15px] font-medium tabular-nums'>
        {move.reference}
        <span>{signed(move)}</span>
      </span>
      <span>
        [{move.sku}] {move.product}
      </span>
      <span className='text-text-sub-600'>
        {move.from} → {move.to}
      </span>
      <span className='text-text-sub-600 tabular-nums'>
        {formatDate(move.date)}
      </span>
    </div>
  );
}

export default function MoveHistoryPage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ListView>('list'); // mockup: "By default land on List View"
  const { data, error, isLoading, mutate } = useSWR<MoveRow[]>(
    `/api/moves?${new URLSearchParams({ q: query })}`,
    fetcher,
    { keepPreviousData: true },
  );

  const empty = (
    <EmptyState
      title={query ? `No moves match "${query}"` : 'No moves yet'}
      description={
        query
          ? 'Search looks at the reference and the contact.'
          : 'Validated receipts, deliveries, transfers and adjustments show up here.'
      }
    />
  );

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <NewOperationMenu />
        <h1 className='text-[28px] leading-[34px] font-semibold'>
          Move History
        </h1>
        <div className='ml-auto flex w-full items-center gap-2 sm:w-auto'>
          <SearchBar
            onSearch={setQuery}
            placeholder='Search reference or contact'
          />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

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
                rowKey={(m) => m.id}
                rowClassName={(m) => DIRECTION_COLOR[m.direction]}
                empty={empty}
              />
            ) : data.length === 0 ? (
              empty
            ) : (
              <KanbanBoard
                columns={TYPE_COLUMNS}
                rows={data}
                groupOf={(m) => m.type}
                rowKey={(m) => m.id}
                renderCard={(m) => <MoveCard move={m} />}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
