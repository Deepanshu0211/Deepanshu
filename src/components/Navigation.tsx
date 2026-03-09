import {
  motion,
  useScroll,
  useMotionValueEvent,
  useSpring,
  AnimatePresence
} from "framer-motion";
import { useState, useEffect, useRef } from "react";

const navItems = ["Work", "About", "Contact"];

const Navigation = () => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  const { scrollY, scrollYProgress } = useScroll();

  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30
  });

  useMotionValueEvent(scrollY, "change", latest => {
    const prev = scrollY.getPrevious() ?? 0;

    if (Math.abs(latest - prev) > 5) {
      setHidden(latest > prev && latest > 300);
    }

    setScrolled(latest > 80);
  });

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMagnet = (e: any) => {
    const el = e.currentTarget;

    const rect = el.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const resetMagnet = (e: any) => {
    e.currentTarget.style.transform = `translate(0px,0px)`;
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: hidden && !mobileOpen ? -100 : 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        className="fixed top-0 left-0 right-0 z-[100]"
      >
        <div className="mx-4 md:mx-8 mt-4">
          <motion.div
            ref={navRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundColor: scrolled
                ? "hsl(0 0% 8% / 0.9)"
                : "hsl(0 0% 8% / 0.6)"
            }}
            transition={{ duration: 0.8 }}
            className="relative rounded-full border border-white/10 backdrop-blur-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-6 md:px-8 py-3 flex items-center justify-between overflow-hidden"
          >
            {/* scroll progress line */}

            <motion.div
              style={{ scaleX: progress }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary origin-left"
            />

            {/* glow */}

            <motion.div
              className="absolute inset-0 rounded-full blur-xl bg-primary/20 opacity-20"
              animate={{ opacity: scrolled ? 0.25 : 0.15 }}
            />

            {/* logo */}

            <motion.a
              href="#"
              className="relative flex items-center gap-3"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-8 h-8 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                <motion.div
                  className="absolute inset-[3px] rounded-full border border-primary/15"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                <span className="text-[11px] font-extrabold text-primary">
                  DY
                </span>
              </div>

              <div className="hidden md:flex flex-col">
                <span className="text-[11px] font-bold uppercase text-foreground/70">
                  Deepanshu
                </span>

                <span className="text-[7px] uppercase tracking-[0.3em] text-foreground/20">
                  Developer & Engineer
                </span>
              </div>
            </motion.a>

            {/* center status */}

            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />

                <span className="text-[8px] uppercase tracking-[0.4em] text-foreground/25">
                  Available
                </span>
              </div>

              <div className="w-[1px] h-3 bg-foreground/10" />

              <span className="text-[9px] text-foreground/15 tabular-nums">
                {time}
              </span>
            </div>

            {/* nav items */}

            <div className="flex items-center gap-1 relative">
              {/* liquid hover blob */}

              <AnimatePresence>
                {hoverIndex !== null && (
                  <motion.div
                    layoutId="liquidBlob"
                    className="absolute top-0 bottom-0 rounded-full bg-white/5"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 40
                    }}
                    style={{
                      width: 80,
                      left: hoverIndex * 80
                    }}
                  />
                )}
              </AnimatePresence>

              {navItems.map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onMouseMove={handleMagnet}
                  onMouseMoveCapture={resetMagnet}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="hidden md:block relative px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/80 transition-all"
                >
                  {item}
                </motion.a>
              ))}

              {/* CTA */}

              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05 }}
                className="hidden md:flex items-center gap-2 ml-3 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all"
              >
                <span className="text-[9px] uppercase text-primary">
                  Let's Talk
                </span>

                <motion.svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path
                    d="M1 5H9M9 5L5.5 1.5M9 5L5.5 8.5"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </motion.svg>
              </motion.a>

              {/* mobile */}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center"
              >
                ☰
              </button>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* mobile menu */}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center z-[99]"
          >
            {navItems.map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-4xl font-bold py-4 text-foreground/60"
              >
                {item}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;