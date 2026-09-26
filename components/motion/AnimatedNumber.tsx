'use client';

import { useEffect } from 'react';
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

// Counts up to the value and glides to new values when filters change
export function AnimatedNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const spring = useSpring(0, { stiffness: 120, damping: 20 });
  const text = useTransform(spring, (v) =>
    Math.round(v).toLocaleString('en-IN'),
  );

  useEffect(() => {
    if (reduceMotion) spring.jump(value);
    else spring.set(value);
  }, [spring, value, reduceMotion]);

  return <motion.span className='tabular-nums'>{text}</motion.span>;
}
