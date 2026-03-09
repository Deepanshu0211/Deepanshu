import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorLabel, setCursorLabel] = useState('');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  const fast = { damping: 30, stiffness: 500, mass: 0.3 };
  const slow = { damping: 15, stiffness: 100, mass: 1.5 };

  const x = useSpring(cursorX, fast);
  const y = useSpring(cursorY, fast);
  const outerX = useSpring(cursorX, slow);
  const outerY = useSpring(cursorY, slow);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    if (!isVisible) setIsVisible(true);
  }, [cursorX, cursorY, isVisible]);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;
    window.addEventListener('mousemove', handleMouseMove);

    const onEnter = (e: Event) => {
      setIsHovering(true);
      const el = e.currentTarget as HTMLElement;
      const label = el.getAttribute('data-cursor-label');
      if (label) setCursorLabel(label);
    };
    const onLeave = () => {
      setIsHovering(false);
      setCursorLabel('');
    };

    const attach = () => {
      document.querySelectorAll('a, button, [data-cursor-hover]').forEach((el) => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };
    attach();
    const obs = new MutationObserver(attach);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      obs.disconnect();
    };
  }, [handleMouseMove]);

  if (!isVisible || isTouchDevice) return null;

  return (
    <>
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 z-[10000] pointer-events-none mix-blend-difference rounded-full flex items-center justify-center"
        style={{
          x, y,
          backgroundColor: 'hsl(42 100% 65%)',
        }}
        animate={{
          width: isHovering ? 64 : 8,
          height: isHovering ? 64 : 8,
          marginLeft: isHovering ? -32 : -4,
          marginTop: isHovering ? -32 : -4,
        }}
        transition={{ type: 'spring', ...fast }}
      >
        {cursorLabel && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="font-mono text-[7px] tracking-[0.2em] uppercase text-background font-bold whitespace-nowrap"
          >
            {cursorLabel}
          </motion.span>
        )}
      </motion.div>

      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full"
        style={{
          x: outerX, y: outerY,
          border: `1px solid ${isHovering ? 'hsl(42 100% 62% / 0.2)' : 'hsl(var(--foreground) / 0.04)'}`,
        }}
        animate={{
          width: isHovering ? 80 : 40,
          height: isHovering ? 80 : 40,
          marginLeft: isHovering ? -40 : -20,
          marginTop: isHovering ? -40 : -20,
        }}
        transition={{ type: 'spring', ...slow }}
      />
    </>
  );
};

export default CustomCursor;
