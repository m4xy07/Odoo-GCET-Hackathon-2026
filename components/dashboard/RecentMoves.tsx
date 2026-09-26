import Link from 'next/link';
import { formatDate } from '@/components/lists/format';
import type { MoveRow } from '@/lib/types';
import { cn } from '@/utils/cn';

// The last few ledger lines, same colors as Move History: in green, out red
export function RecentMoves({ moves }: { moves: MoveRow[] }) {
  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-[17px] leading-[22px] font-semibold'>
          Recent moves
        </h2>
        <Link
          href='/moves'
          className='text-primary-base text-[13px] hover:underline'
        >
          View all
        </Link>
      </div>
      {moves.length === 0 ? (
        <p className='text-text-sub-600 text-[13px]'>
          Validated operations show up here.
        </p>
      ) : (
        <ul className='divide-stroke-soft-200 rounded-16 border-stroke-soft-200 divide-y border'>
          {moves.map((m) => (
            <li
              key={m.id}
              className='flex items-center gap-3 px-4 py-3 text-[15px]'
            >
              <span className='min-w-0 flex-1'>
                <span className='block font-medium'>{m.reference}</span>
                <span className='text-text-sub-600 block truncate text-[13px]'>
                  [{m.sku}] {m.product} · {m.from} → {m.to}
                </span>
              </span>
              <span className='text-text-sub-600 hidden text-[13px] tabular-nums sm:block'>
                {formatDate(m.date)}
              </span>
              <span
                className={cn(
                  'w-16 text-right font-medium tabular-nums',
                  m.direction === 'in' && 'text-success-base',
                  m.direction === 'out' && 'text-error-base',
                )}
              >
                {m.direction === 'in' ? '+' : m.direction === 'out' ? '−' : ''}
                {m.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
