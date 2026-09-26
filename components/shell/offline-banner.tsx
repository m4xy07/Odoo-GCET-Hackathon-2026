'use client';

import { useSyncExternalStore } from 'react';
import { RiWifiOffLine } from '@remixicon/react';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

// Shows only while the browser has no connection, so nobody thinks a validate or save went through.
// The server render assumes online, so the banner never flashes on page load.
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;

  return (
    <div
      role='status'
      className='border-stroke-soft-200 bg-warning-lighter text-warning-base border-t'
    >
      <div className='mx-auto flex w-full max-w-[1200px] items-center gap-2 px-4 py-2 text-[13px] leading-[18px] md:px-8'>
        <RiWifiOffLine className='size-4 shrink-0' aria-hidden />
        You are offline. Changes will not save until you reconnect.
      </div>
    </div>
  );
}
