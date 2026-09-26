'use client';

import { motion, useReducedMotion } from 'motion/react';

// Page enter from the design system: 8px fade up, once, 200ms
export function FadeUp({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
