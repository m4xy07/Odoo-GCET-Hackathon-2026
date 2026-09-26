'use client';

import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

const SPRING = { type: 'spring', stiffness: 400, damping: 32 } as const;

// Columns side by side, cards glide between them when their group changes (layoutId).
// On a phone the columns scroll sideways instead of squeezing.
export function KanbanBoard<T>({
  columns,
  rows,
  groupOf,
  rowKey,
  renderCard,
  onCardClick,
}: {
  columns: { key: string; label: string }[];
  rows: T[];
  groupOf: (row: T) => string;
  rowKey: (row: T) => string;
  renderCard: (row: T) => React.ReactNode;
  onCardClick?: (row: T) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <LayoutGroup>
      <div className='-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0'>
        {columns.map((col) => {
          const cards = rows.filter((row) => groupOf(row) === col.key);
          return (
            <section
              key={col.key}
              aria-label={col.label}
              className='rounded-16 bg-bg-weak-50 flex w-64 shrink-0 snap-start flex-col gap-2 p-2'
            >
              <h2 className='text-text-sub-600 flex items-center justify-between px-2 pt-1 text-[13px] font-medium'>
                {col.label}
                <span className='tabular-nums'>{cards.length}</span>
              </h2>
              {cards.map((row) => (
                <motion.div
                  key={rowKey(row)}
                  layoutId={reduceMotion ? undefined : rowKey(row)}
                  layout={!reduceMotion}
                  transition={SPRING}
                  onClick={onCardClick && (() => onCardClick(row))}
                  onKeyDown={
                    onCardClick &&
                    ((e) => e.key === 'Enter' && onCardClick(row))
                  }
                  tabIndex={onCardClick ? 0 : undefined}
                  className={cn(
                    'rounded-10 border-stroke-soft-200 bg-bg-white-0 border p-3 text-[13px] leading-[18px]',
                    onCardClick &&
                      'hover:border-stroke-sub-300 focus-visible:border-primary-base cursor-pointer outline-none',
                  )}
                >
                  {renderCard(row)}
                </motion.div>
              ))}
            </section>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
