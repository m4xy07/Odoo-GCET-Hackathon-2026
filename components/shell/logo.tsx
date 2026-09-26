import { RiStackLine } from '@remixicon/react';

// The "App Logo" box from the mockup: a small mark plus the wordmark
export function Logo() {
  return (
    <span className='inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight text-text-strong-950'>
      <span className='flex size-8 items-center justify-center rounded-10 bg-primary-base text-static-white'>
        <RiStackLine className='size-[18px]' aria-hidden />
      </span>
      StockSense
    </span>
  );
}
