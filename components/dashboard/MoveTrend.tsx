'use client';

import { useState } from 'react';
import type { MoveTrendDay } from '@/lib/services/dashboard';
import { cn } from '@/utils/cn';

const HALF_PX = 72; // height of the in half and of the out half

const label = (date: string) => {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]}`;
};

// Moves per day for the last 14 days. In grows up from the baseline, out grows down, so direction
// is read from position first and color second (red and green are hard to tell apart for some readers).
export function MoveTrend({ days }: { days: MoveTrendDay[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...days.flatMap((d) => [d.in, d.out]));
  const height = (n: number) =>
    n === 0 ? 0 : Math.max(3, (n / max) * HALF_PX);
  const total = days.reduce((sum, d) => sum + d.in + d.out + d.internal, 0);

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h2 className='text-[17px] leading-[22px] font-semibold'>
          Moves per day
          <span className='text-text-sub-600 ml-2 text-[13px] font-normal'>
            last 14 days
          </span>
        </h2>
        <div
          className='text-text-sub-600 flex gap-4 text-[13px]'
          aria-hidden='true'
        >
          <span className='flex items-center gap-1.5'>
            <span className='bg-success-base size-2.5 rounded-sm' /> In ↑
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='bg-error-base size-2.5 rounded-sm' /> Out ↓
          </span>
        </div>
      </div>

      {total === 0 ? (
        <p className='rounded-16 border-stroke-soft-200 text-text-sub-600 border p-6 text-[13px]'>
          No moves in the last 14 days. Validated operations show up here.
        </p>
      ) : (
        <div className='rounded-16 border-stroke-soft-200 border p-4'>
          <div className='flex'>
            {/* direct labels for the two halves, so the chart reads without color */}
            <div className='text-text-soft-400 flex w-10 shrink-0 flex-col text-[11px] tabular-nums'>
              <span
                className='flex flex-col justify-between'
                style={{ height: HALF_PX }}
              >
                <span>{max}</span>
                <span>In</span>
              </span>
              <span
                className='flex flex-col justify-between'
                style={{ height: HALF_PX }}
              >
                <span>Out</span>
                <span>{max}</span>
              </span>
            </div>
            <div
              className='relative flex flex-1 gap-0.5'
              onMouseLeave={() => setActive(null)}
            >
              <div
                className='border-stroke-sub-300 pointer-events-none absolute inset-x-0 border-t'
                style={{ top: HALF_PX }}
              />
              {days.map((d, i) => (
                <div
                  key={d.date}
                  tabIndex={0}
                  aria-label={`${label(d.date)}: ${d.in} in, ${d.out} out, ${d.internal} internal`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    'relative flex flex-1 flex-col items-center rounded-md outline-none',
                    active === i && 'bg-bg-weak-50',
                  )}
                >
                  <div
                    className='flex w-full items-end justify-center'
                    style={{ height: HALF_PX }}
                  >
                    <div
                      className='bg-success-base w-full max-w-4 rounded-t-[4px] transition-[height] duration-200'
                      style={{ height: height(d.in) }}
                    />
                  </div>
                  <div
                    className='flex w-full items-start justify-center'
                    style={{ height: HALF_PX }}
                  >
                    <div
                      className='bg-error-base w-full max-w-4 rounded-b-[4px] transition-[height] duration-200'
                      style={{ height: height(d.out) }}
                    />
                  </div>
                  {active === i && (
                    <div
                      role='tooltip'
                      className={cn(
                        'rounded-10 bg-bg-strong-950 text-text-white-0 shadow-regular-md absolute top-1 z-10 px-2.5 py-1.5 text-[12px] leading-[16px] whitespace-nowrap',
                        // beside the bar, inside the plot, so it never covers the legend
                        i < days.length / 2
                          ? 'left-full ml-1'
                          : 'right-full mr-1',
                      )}
                    >
                      <div className='font-medium'>{label(d.date)}</div>
                      <div className='tabular-nums'>
                        {d.in} in · {d.out} out · {d.internal} internal
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className='text-text-soft-400 mt-1 flex justify-between pl-10 text-[11px]'>
            <span>{label(days[0].date)}</span>
            <span>{label(days[days.length - 1].date)}</span>
          </div>
          <table className='sr-only'>
            <caption>Moves per day, last 14 days</caption>
            <thead>
              <tr>
                <th scope='col'>Date</th>
                <th scope='col'>In</th>
                <th scope='col'>Out</th>
                <th scope='col'>Internal</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <td>{label(d.date)}</td>
                  <td>{d.in}</td>
                  <td>{d.out}</td>
                  <td>{d.internal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
