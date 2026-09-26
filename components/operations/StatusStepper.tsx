'use client';

import { RiArrowRightSLine } from '@remixicon/react';
import { motion, useReducedMotion } from 'motion/react';
import { StatusBadge, STATUS_LABEL } from '@/components/lists/StatusBadge';
import type { OpStatus, OpType } from '@/lib/types';
import { cn } from '@/utils/cn';
import { STEPS } from './labels';

// Draft > Ready > Done, the current step sits on a white pill that slides when the status changes
export function StatusStepper({ type, status }: { type: OpType; status: OpStatus }) {
  const reduceMotion = useReducedMotion();
  if (status === 'canceled') return <StatusBadge status='canceled' />;

  return (
    <ol aria-label='Status' className='flex items-center rounded-full bg-bg-weak-50 p-1 text-[13px] leading-[18px]'>
      {STEPS[type].map((step, i) => (
        <li key={step} className='flex items-center'>
          {i > 0 && <RiArrowRightSLine aria-hidden className='size-4 text-text-soft-400' />}
          <span
            aria-current={step === status ? 'step' : undefined}
            className={cn('relative rounded-full px-3 py-1', step === status ? 'font-medium text-text-strong-950' : 'text-text-sub-600')}
          >
            {step === status && (
              <motion.span
                layoutId='status-step'
                className='absolute inset-0 rounded-full bg-bg-white-0 shadow-regular-xs ring-1 ring-stroke-soft-200'
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className='relative'>{STATUS_LABEL[step]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
