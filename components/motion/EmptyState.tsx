'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
// bundled instead of fetched: nothing to wait for when it opens, and no aborted request on unmount
import emptyAnimation from '@/public/lottie/empty.json';
import { useReducedMotion } from 'motion/react';

// Shown when a list or search has nothing to show. The box sways slowly, and stays still for reduced motion.
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className='flex flex-col items-center gap-2 px-4 py-12 text-center'>
      <DotLottieReact
        data={emptyAnimation}
        autoplay={!reduceMotion}
        loop
        speed={0.6}
        className='size-24'
      />
      <p className='text-[17px] leading-[22px] font-semibold'>{title}</p>
      {description && (
        <p className='text-text-sub-600 max-w-sm text-[13px] leading-[18px]'>
          {description}
        </p>
      )}
      {action && <div className='mt-2'>{action}</div>}
    </div>
  );
}
