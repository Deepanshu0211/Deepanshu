import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface MarqueeProps {
  text: string;
  speed?: number;
  outlined?: boolean;
  reverse?: boolean;
}

const Marquee = ({ text, speed = 25, outlined = false, reverse = false }: MarqueeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], [reverse ? -200 : 200, reverse ? 200 : -200]);

  const repeated = `${text} — `.repeat(12);

  return (
    <div ref={ref} className="overflow-hidden py-6 md:py-16 border-y border-border/10 mask-fade-edges relative">
      <motion.div style={{ x }} className="whitespace-nowrap will-change-transform">
        <div
          style={{ animation: `${reverse ? 'marquee-reverse' : 'marquee'} ${speed}s linear infinite` }}
          className="inline-block"
        >
          <span className={`font-display text-4xl md:text-[9rem] font-extrabold tracking-[-0.04em] uppercase select-none ${
            outlined ? 'text-outline' : 'text-foreground/[0.015]'
          }`}>
            {repeated}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Marquee;
