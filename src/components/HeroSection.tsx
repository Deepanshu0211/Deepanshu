import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Scene3D from './Scene3D';

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.85]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -3]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 15,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [isMobile]);

  return (
    <section ref={ref} className="relative h-[100svh] flex items-center overflow-hidden">
      {/* 3D Background — hidden on small mobile for perf */}
      <motion.div className="absolute inset-0 z-0 hidden sm:block" style={{ y, scale }}>
        <Scene3D />
      </motion.div>

      {/* Mobile gradient fallback */}
      <div className="absolute inset-0 z-0 sm:hidden"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, hsl(42 100% 62% / 0.06) 0%, hsl(0 0% 2%) 70%)' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, hsl(0 0% 2%) 75%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-40 md:h-72 z-[1] pointer-events-none bg-gradient-to-t from-background to-transparent" />

      {/* Subtle grid */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.01] hidden md:block"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px',
        }}
      />

      {/* Content */}
      <motion.div className="relative z-10 w-full px-5 md:px-12 lg:px-20" style={{ opacity }}>
        <div className="max-w-[100rem] mx-auto">
          {/* Top row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 2 }}
            className="flex justify-between items-center mb-12 md:mb-28"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary/50 animate-pulse" />
              <span className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] md:tracking-[0.6em] uppercase text-muted-foreground/30">
                Web Developer · CS & AI
              </span>
            </div>
            <span className="font-mono text-[8px] tracking-[0.5em] uppercase text-muted-foreground/15 hidden md:block">
              Deepanshu — 2026
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.div style={isMobile ? {} : { rotate }} className="relative">
            <div className="overflow-hidden mb-[-0.12em]">
              <motion.h1
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 2.6, duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
                className="text-[clamp(2.8rem,14vw,13rem)] font-display font-extrabold tracking-[-0.06em] leading-[0.85]"
                style={isMobile ? {} : { transform: `translate3d(${mousePos.x * 0.2}px, 0, 0)` }}
              >
                I craft
              </motion.h1>
            </div>

            <div className="overflow-hidden mb-[-0.12em] pl-[8vw] md:pl-[12vw]">
              <motion.h1
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 2.8, duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
                className="text-[clamp(2.8rem,14vw,13rem)] font-serif italic font-normal tracking-[-0.03em] leading-[0.85] text-gradient-gold"
                style={isMobile ? {} : { transform: `translate3d(${mousePos.x * 0.4}px, 0, 0)` }}
              >
                digital
              </motion.h1>
            </div>

            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 3, duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
                className="text-[clamp(2.4rem,12vw,13rem)] font-display font-extrabold tracking-[-0.06em] leading-[0.85]"
                style={isMobile ? {} : { transform: `translate3d(${mousePos.x * 0.6}px, 0, 0)` }}
              >
                experiences<span className="text-primary">.</span>
              </motion.h1>
            </div>

            {/* Decorative orbit — desktop only */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 4, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none"
              style={{ transform: `translate3d(${mousePos.x * -1}px, ${mousePos.y * -1}px, 0)` }}
            >
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border border-primary/8 rounded-full animate-[rotate-slow_25s_linear_infinite]" />
                <div className="absolute inset-4 border border-primary/4 rounded-full animate-[rotate-slow_18s_linear_infinite_reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-primary/25 rounded-full" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.8, duration: 1.5 }}
            className="mt-10 md:mt-28 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10"
          >
            <div>
              <p className="max-w-sm font-sans text-xs md:text-base text-muted-foreground/40 leading-[2]">
                Teaching machines, reshaping systems, bridging
                <span className="text-foreground/70"> code</span> to the
                <span className="text-gradient-gold"> physical world</span>.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-4 md:gap-5 mt-4 md:mt-6">
                <a href="https://github.com/Deepanshu0211" target="_blank" rel="noopener noreferrer" data-cursor-hover
                  className="font-mono text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-muted-foreground/25 hover:text-primary transition-colors duration-500">
                  GitHub
                </a>
                <div className="w-[1px] h-3 bg-foreground/8" />
                <a href="https://www.linkedin.com/in/deepanshuyad/" target="_blank" rel="noopener noreferrer" data-cursor-hover
                  className="font-mono text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-muted-foreground/25 hover:text-primary transition-colors duration-500">
                  LinkedIn
                </a>
                <div className="w-[1px] h-3 bg-foreground/8" />
                <a href="https://twitter.com/V3Deepanshu" target="_blank" rel="noopener noreferrer" data-cursor-hover
                  className="font-mono text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-muted-foreground/25 hover:text-primary transition-colors duration-500">
                  Twitter
                </a>
              </div>
            </div>

            {/* Scroll indicator — hidden on mobile */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden md:flex flex-col items-center gap-3"
            >
              <div className="w-5 h-9 border border-foreground/8 rounded-full flex justify-center pt-2">
                <motion.div
                  animate={{ y: [0, 8, 0], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-[1.5px] h-2 bg-primary/40 rounded-full"
                />
              </div>
              <span className="font-mono text-[7px] tracking-[0.5em] uppercase text-muted-foreground/10">
                Scroll
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
