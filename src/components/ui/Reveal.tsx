import { motion } from 'framer-motion';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
}

/* Single element: fade + slide up */
export function Reveal({ children, delay = 0, y = 24, x = 0, className, style, duration = 0.55 }: RevealProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/* Stagger container — children use staggerItem variants */
interface StaggerProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Stagger({ children, stagger = 0.09, className, style }: StaggerProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-48px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

/* Item inside a Stagger — use as motion.div replacement */
export const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

/* Slide from a side — for spotlight sections */
export const slideLeft = {
  hidden: { opacity: 0, x: -36 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
};

export const slideRight = {
  hidden: { opacity: 0, x: 36 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
};

/* Side-pair — wraps two children that slide from opposite sides */
export function SlidePair({
  left, right, reverse = false, className, style,
}: {
  left: React.ReactNode; right: React.ReactNode; reverse?: boolean; className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-48px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
    >
      <motion.div variants={reverse ? slideRight : slideLeft}>{left}</motion.div>
      <motion.div variants={reverse ? slideLeft : slideRight}>{right}</motion.div>
    </motion.div>
  );
}
