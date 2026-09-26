'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  // low value columns (Contact, Date) drop out under 640px so the table fits a phone
  hideOnMobile?: boolean;
  className?: string;
};

const SKELETON_ROWS = 5;
const ANIMATED_ROWS = 10;

// One table for every list in the app: receipts, deliveries, transfers, adjustments and move history
export function DataTable<T>({
  columns,
  rows,
  isLoading,
  rowKey,
  onRowClick,
  rowClassName,
  empty,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading: boolean;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  empty: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const hide = (c: Column<T>) => c.hideOnMobile && 'hidden sm:table-cell';

  if (!isLoading && rows?.length === 0) return <>{empty}</>;

  return (
    <div className='rounded-16 border-stroke-soft-200 overflow-x-auto border'>
      <table className='w-full text-left'>
        <thead>
          <tr className='bg-bg-weak-50'>
            {columns.map((c) => (
              <th
                key={c.key}
                scope='col'
                className={cn(
                  'text-text-sub-600 h-10 px-4 text-[13px] font-medium whitespace-nowrap',
                  hide(c),
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && !rows
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <tr
                  key={i}
                  className='border-stroke-soft-200 h-[52px] border-t'
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4', hide(c))}>
                      <div className='bg-bg-soft-200 h-3 w-20 animate-pulse rounded-full' />
                    </td>
                  ))}
                </tr>
              ))
            : rows?.map((row, i) => (
                <motion.tr
                  key={rowKey(row)}
                  initial={
                    reduceMotion || i >= ANIMATED_ROWS
                      ? false
                      : { opacity: 0, y: 4 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: i * 0.02,
                    ease: [0.2, 0, 0, 1],
                  }}
                  onClick={onRowClick && (() => onRowClick(row))}
                  onKeyDown={
                    onRowClick && ((e) => e.key === 'Enter' && onRowClick(row))
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    'border-stroke-soft-200 h-[52px] border-t text-[15px] tabular-nums',
                    onRowClick &&
                      'hover:bg-bg-weak-50 focus-visible:bg-bg-weak-50 cursor-pointer outline-none',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-4 whitespace-nowrap',
                        hide(c),
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </motion.tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
