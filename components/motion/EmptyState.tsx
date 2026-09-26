'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
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
        src='/lottie/empty.json'
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
