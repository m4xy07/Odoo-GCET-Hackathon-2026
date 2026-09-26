'use client';

import { useEffect, useRef, useState } from 'react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
// bundled instead of fetched: nothing to wait for when it opens, and no aborted request on unmount
import bellAnimation from '@/public/lottie/bell.json';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

const MAX_SHOWN = 9;

// The low stock bell for the top bar. It rests on its first frame and rings once when count goes up,
// or on hover. Forwards ref and button props so it can sit inside a Dropdown.Trigger asChild.
//
//   <Dropdown.Trigger asChild><AlertBell count={items.length} /></Dropdown.Trigger>
export function AlertBell({
  count,
  className,
  onMouseEnter,
  ...rest
}: React.ComponentPropsWithRef<'button'> & { count: number }) {
  const reduceMotion = useReducedMotion();
  const [player, setPlayer] = useState<DotLottie | null>(null);
  const previous = useRef(count);

  const ring = () => {
    if (reduceMotion || !player) return;
    player.stop();
    player.play();
  };

  useEffect(() => {
    if (count > previous.current && !reduceMotion && player) {
      player.stop();
      player.play();
    }
    previous.current = count;
  }, [count, player, reduceMotion]);

  const label =
    count > 0
      ? `Low stock alerts, ${count} ${count === 1 ? 'item' : 'items'}`
      : 'Low stock alerts, none';

  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      onMouseEnter={(e) => {
        ring();
        onMouseEnter?.(e);
      }}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-full outline-none',
        'hover:bg-bg-weak-50 focus-visible:ring-primary-base focus-visible:ring-2',
        className,
      )}
      {...rest}
    >
      <DotLottieReact
        data={bellAnimation}
        className='size-7'
        dotLottieRefCallback={setPlayer}
      />
      {count > 0 && (
        <span className='bg-error-base text-static-white absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] leading-none font-semibold tabular-nums'>
          {count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}
        </span>
      )}
    </button>
  );
}
