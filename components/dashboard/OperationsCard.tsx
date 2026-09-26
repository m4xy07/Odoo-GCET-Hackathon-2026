import Link from 'next/link';
import * as Button from '@/components/ui/button';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { cn } from '@/utils/cn';

type Stat = { value: number; label: string; href: string; alert?: boolean };

// The Receipt and Delivery cards from the mockup: one button with the work to do now, counts beside it
export function OperationsCard({
  title,
  primary,
  stats,
}: {
  title: string;
  primary: Stat;
  stats: Stat[];
}) {
  return (
    <section className='rounded-16 border-stroke-soft-200 flex flex-col gap-4 border p-6'>
      <h2 className='text-[17px] leading-[22px] font-semibold'>{title}</h2>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <Button.Root asChild variant='primary' mode='lighter' size='medium'>
          <Link href={primary.href}>
            <AnimatedNumber value={primary.value} /> {primary.label}
          </Link>
        </Button.Root>
        <ul className='flex flex-col gap-1 text-[15px] leading-[22px]'>
          {stats.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                className={cn(
                  'hover:underline',
                  s.alert && s.value > 0
                    ? 'text-error-base'
                    : 'text-text-sub-600',
                )}
              >
                <AnimatedNumber value={s.value} /> {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
