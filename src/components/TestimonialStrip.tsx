import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    quote: "Deepanshu delivers work that feels like it came from a senior team, not one person.",
    name: "Aarav M.",
    role: "Startup Founder",
  },
  {
    quote: "His code is clean, his design sense is sharp, and he ships incredibly fast.",
    name: "Priya S.",
    role: "Product Manager",
  },
  {
    quote: "One of the rare developers who truly understands both engineering and aesthetics.",
    name: "Marcus L.",
    role: "CTO, Stealth Startup",
  },
  {
    quote: "Turned our vague idea into a polished product in weeks. Absolute game-changer.",
    name: "Sara K.",
    role: "Entrepreneur",
  },
];

const TestimonialStrip = () => {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const id = setInterval(next, 12000);
    return () => clearInterval(id);
  }, [next]);

  const t = testimonials[index];

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Large decorative quote mark */}
      <div className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 pointer-events-none select-none">
        <span
          className="font-serif text-[120px] sm:text-[200px] leading-none"
          style={{ color: 'hsl(42 100% 62% / 0.03)' }}
        >
          "
        </span>
      </div>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 40% 60% at 50% 50%, hsl(42 100% 62% / 0.015) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-8 sm:px-16">
        {/* Label */}
        <div className="flex items-center justify-center gap-4 mb-12 sm:mb-16">
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent to-primary/20" />
          <span className="font-mono text-[7px] sm:text-[8px] tracking-[0.6em] uppercase text-primary/30">
            Testimonials
          </span>
          <div className="w-10 h-[1px] bg-gradient-to-l from-transparent to-primary/20" />
        </div>

        {/* Quote area with left/right nav zones */}
        <div className="relative min-h-[140px] sm:min-h-[120px] flex items-center justify-center">
          {/* Left click zone — Prev */}
          <button
            onClick={prev}
            data-cursor-hover
            data-cursor-label="Prev"
            className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-none"
            aria-label="Previous testimonial"
          />
          {/* Right click zone — Next */}
          <button
            onClick={next}
            data-cursor-hover
            data-cursor-label="Next"
            className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-none"
            aria-label="Next testimonial"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{
                duration: 1,
                ease: [0.76, 0, 0.24, 1],
              }}
              className="text-center pointer-events-none"
            >
              <p className="font-serif italic text-lg sm:text-2xl md:text-[1.75rem] text-foreground/50 leading-[1.7] tracking-[-0.005em] max-w-3xl mx-auto">
                {t.quote}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Attribution with staggered entrance */}
        <div className="relative min-h-[50px] flex items-center justify-center mt-8 sm:mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.76, 0, 0.24, 1],
              }}
              className="flex flex-col items-center gap-3"
            >
              {/* Decorative line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.76, 0, 0.24, 1] }}
                className="w-8 h-[1px] origin-center"
                style={{ backgroundColor: 'hsl(42 100% 62% / 0.2)' }}
              />
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-foreground/25 font-medium">
                  {t.name}
                </span>
                <span className="text-foreground/10">·</span>
                <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-muted-foreground/15">
                  {t.role}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimal progress indicator */}
        <div className="flex items-center justify-center gap-3 mt-10 sm:mt-14">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="group relative py-2"
              aria-label={`Testimonial ${i + 1}`}
            >
              <div className="relative h-[1px] overflow-hidden" style={{ width: i === index ? 32 : 12 }}>
                <div
                  className="absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)]"
                  style={{
                    backgroundColor:
                      i === index
                        ? 'hsl(42 100% 62% / 0.4)'
                        : 'hsl(var(--foreground) / 0.06)',
                  }}
                />
                {i === index && (
                  <motion.div
                    className="absolute inset-0 origin-left"
                    style={{ backgroundColor: 'hsl(42 100% 62% / 0.15)' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 12, ease: 'linear' }}
                    key={`progress-${index}`}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialStrip;
