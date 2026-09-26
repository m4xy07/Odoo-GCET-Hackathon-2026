'use client';

import { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const DELAY_MS = 600;

// Skeletons cover a normal load. Only a load slower than 600ms gets the spinner, so fast pages never flash it.
export function SlowLoading() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!slow) return null;
  return (
    <div
      role='status'
      className='text-text-sub-600 flex items-center justify-center gap-2 py-4 text-[13px]'
    >
      <DotLottieReact
        src='/lottie/loading.json'
        autoplay
        loop
        className='size-6'
      />
      Still loading…
    </div>
  );
}
