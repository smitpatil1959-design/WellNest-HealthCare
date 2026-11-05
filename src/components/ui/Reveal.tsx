import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp } from '../../animations/variants';

export function Reveal({
  children,
  className,
  delay = 0,
  variants = fadeUp,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
