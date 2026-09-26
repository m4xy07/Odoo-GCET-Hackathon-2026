'use client';

import { useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
// bundled instead of fetched: nothing to wait for when it opens, and no aborted request on unmount
import successAnimation from '@/public/lottie/success.json';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { RiCheckboxCircleLine } from '@remixicon/react';

const PLAY_MS = 1000; // success.json is 60 frames at 60fps
const HOLD_MS = 800; // keep the finished check on screen before fading out

// Confirmation after a receipt, delivery or adjustment is validated.
// idle -> plays the check once -> holds the last frame -> fades, then calls onDone.
//
//   const [done, setDone] = useState(false)
//   ...after validate succeeds: setDone(true)
//   <ValidateSuccess open={done} onDone={() => setDone(false)} />
export function ValidateSuccess({
  open,
  onDone,
  label = 'Validated',
}: {
  open: boolean;
  onDone: () => void;
  label?: string;
}) {
  return (
    <AnimatePresence>
      {open && <SuccessMark key='success' label={label} onDone={onDone} />}
    </AnimatePresence>
  );
}

function SuccessMark({ label, onDone }: { label: string; onDone: () => void }) {
  const reduceMotion = useReducedMotion();

  // A fixed timer instead of the player's complete event, so it always closes even if the file loads slowly
  // latest onDone without restarting the timer when the parent re-renders
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  useEffect(() => {
    const timer = setTimeout(
      () => doneRef.current(),
      (reduceMotion ? 0 : PLAY_MS) + HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <motion.div
      role='status'
      aria-live='polite'
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className='pointer-events-none fixed inset-0 z-50 grid place-items-center'
    >
      <div className='rounded-16 bg-bg-white-0 shadow-regular-md ring-stroke-soft-200 flex flex-col items-center gap-1 px-8 pt-4 pb-5 ring-1'>
        {reduceMotion ? (
          <RiCheckboxCircleLine className='text-success-base size-24' />
        ) : (
          <DotLottieReact
            data={successAnimation}
            autoplay
            className='size-24'
          />
        )}
        <p className='text-[15px] font-medium'>{label}</p>
      </div>
    </motion.div>
  );
}
