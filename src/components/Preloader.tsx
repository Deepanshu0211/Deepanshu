import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = forwardRef<HTMLDivElement, { onComplete: () => void }>(({ onComplete }, ref) => {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 3000;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 5);
      setProgress(Math.round(eased * 100));

      if (p < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setIsDone(true);
        setTimeout(onComplete, 1200);
      }
    };

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 800);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [onComplete]);

  return (
      <AnimatePresence>
       {!isDone && (
         <motion.div
           ref={ref}
           exit={{ y: '-100%' }}
           transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
           className="fixed inset-0 z-[10001] bg-background flex flex-col"
         >
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.015] hidden md:block"
              style={{
                backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                backgroundSize: '80px 80px',
              }}
            />
            
            <motion.div
              initial={{ scale: 0.6, opacity: 0, filter: 'blur(30px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.4, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="font-display text-[40vw] md:text-[28vw] font-extrabold tracking-[-0.06em] leading-none text-gradient-gold select-none">
                {String(progress).padStart(2, '0')}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-primary/60 animate-pulse" />
              <span className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] uppercase text-muted-foreground/25">Loading</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute top-6 right-6 md:top-10 md:right-10"
            >
              <span className="font-mono text-[7px] md:text-[8px] tracking-[0.3em] text-muted-foreground/15">© 2026</span>
            </motion.div>
          </div>

          <div className="px-6 pb-6 md:px-10 md:pb-10">
            <div className="h-[1px] bg-border/8 overflow-hidden">
              <motion.div
                className="h-full bg-primary/60"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

Preloader.displayName = 'Preloader';

export default Preloader;
