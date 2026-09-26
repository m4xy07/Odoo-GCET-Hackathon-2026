'use client';

import { useState } from 'react';
import useSWR from 'swr';
import * as Button from '@/components/ui/button';
import { PageHeader } from '@/components/shell/page-header';
import {
  FilterBar,
  NO_FILTERS,
  toQuery,
  type DashboardFilters,
} from '@/components/dashboard/FilterBar';
import { KpiRow } from '@/components/dashboard/KpiRow';
import { OperationsCard } from '@/components/dashboard/OperationsCard';
import { RecentMoves } from '@/components/dashboard/RecentMoves';
import { FadeUp } from '@/components/motion/FadeUp';
import { SlowLoading } from '@/components/motion/SlowLoading';
import { fetcher } from '@/lib/fetcher';
import type { DashboardData } from '@/lib/types';

function Skeleton() {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='rounded-16 bg-bg-weak-50 h-40 animate-pulse' />
        <div className='rounded-16 bg-bg-weak-50 h-40 animate-pulse' />
      </div>
      <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className='rounded-16 bg-bg-weak-50 h-[88px] animate-pulse'
          />
        ))}
      </div>
      <SlowLoading />
    </div>
  );
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(NO_FILTERS);
  const { data, error, mutate } = useSWR<DashboardData>(
    `/api/dashboard?${toQuery(filters)}`,
    fetcher,
    { keepPreviousData: true },
  );

  return (
    <FadeUp>
      <PageHeader title='Dashboard' />
      <div className='flex flex-col gap-6'>
        <FilterBar filters={filters} onChange={setFilters} />

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
        ) : !data ? (
          <Skeleton />
        ) : (
          <>
            {/* the two mockup cards come first, top left */}
            <div className='grid gap-4 md:grid-cols-2'>
              <OperationsCard
                title='Receipt'
                primary={{
                  value: data.receipts.toReceive,
                  label: 'to receive',
                  href: '/operations/receipts?status=ready',
                }}
                stats={[
                  {
                    value: data.receipts.late,
                    label: 'Late',
                    href: '/operations/receipts?late=1',
                    alert: true,
                  },
                  {
                    value: data.receipts.upcoming,
                    label: 'operations',
                    href: '/operations/receipts',
                  },
                ]}
              />
              <OperationsCard
                title='Delivery'
                primary={{
                  value: data.deliveries.toDeliver,
                  label: 'to Deliver',
                  href: '/operations/deliveries?status=ready',
                }}
                stats={[
                  {
                    value: data.deliveries.late,
                    label: 'Late',
                    href: '/operations/deliveries?late=1',
                    alert: true,
                  },
                  {
                    value: data.deliveries.waiting,
                    label: 'waiting',
                    href: '/operations/deliveries?status=waiting',
                  },
                  {
                    value: data.deliveries.upcoming,
                    label: 'operations',
                    href: '/operations/deliveries',
                  },
                ]}
              />
            </div>
            <KpiRow kpis={data.kpis} />
            <RecentMoves moves={data.recent} />
          </>
        )}
      </div>
    </FadeUp>
  );
}
