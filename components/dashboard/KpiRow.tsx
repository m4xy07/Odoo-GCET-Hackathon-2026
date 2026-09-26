import Link from 'next/link';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import type { DashboardData } from '@/lib/types';

// The five KPIs from the problem statement. Low and out of stock share a tile, as the PDF lists them together.
export function KpiRow({ kpis }: { kpis: DashboardData['kpis'] }) {
  const tiles = [
    {
      label: 'Products in stock',
      href: '/stock',
      value: <AnimatedNumber value={kpis.productsInStock} />,
    },
    {
      label: 'Low / out of stock',
      href: '/products',
      value: (
        <>
          <span className={kpis.lowStock > 0 ? 'text-warning-base' : undefined}>
            <AnimatedNumber value={kpis.lowStock} />
          </span>
          <span className='text-text-soft-400'> / </span>
          <span className={kpis.outOfStock > 0 ? 'text-error-base' : undefined}>
            <AnimatedNumber value={kpis.outOfStock} />
          </span>
        </>
      ),
    },
    {
      label: 'Pending receipts',
      href: '/operations/receipts',
      value: <AnimatedNumber value={kpis.pendingReceipts} />,
    },
    {
      label: 'Pending deliveries',
      href: '/operations/deliveries',
      value: <AnimatedNumber value={kpis.pendingDeliveries} />,
    },
    {
      label: 'Transfers scheduled',
      href: '/operations/transfers',
      value: <AnimatedNumber value={kpis.transfersScheduled} />,
    },
  ];

  return (
    <div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
      {tiles.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          className='rounded-16 bg-bg-weak-50 hover:bg-bg-soft-200 flex flex-col gap-1 p-4 transition-colors'
        >
          <span className='text-text-sub-600 text-[13px] leading-[18px]'>
            {t.label}
          </span>
          <span className='text-[28px] leading-[34px] font-semibold'>
            {t.value}
          </span>
        </Link>
      ))}
    </div>
  );
}
