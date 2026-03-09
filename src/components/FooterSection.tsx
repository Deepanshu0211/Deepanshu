import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

const links = [
  { label: 'GitHub', href: 'https://github.com/Deepanshu0211' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/deepanshuyad/' },
  { label: 'Twitter', href: 'https://twitter.com/V3Deepanshu' },
  { label: 'Website', href: 'https://deepanshuyad.in/' },
];

const FooterSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 0.8], [0.85, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [150, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.6], [80, 0]);
  const [year] = useState(new Date().getFullYear());

  const emailRef = useRef<HTMLAnchorElement>(null);
  const [emailHover, setEmailHover] = useState({ x: 0, y: 0, active: false });

  const handleEmailMove = (e: React.MouseEvent) => {
    if (!emailRef.current) return;
    const rect = emailRef.current.getBoundingClientRect();
    setEmailHover({
      x: (e.clientX - rect.left - rect.width / 2) * 0.15,
      y: (e.clientY - rect.top - rect.height / 2) * 0.15,
      active: true,
    });
  };

  return (
    <footer id="contact" ref={ref} className="relative px-5 md:px-12 lg:px-20 pt-20 md:pt-48 pb-8 md:pb-10 overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none hidden md:block">
        <span className="font-display text-[35vw] font-extrabold text-foreground/[0.006] tracking-[-0.06em] leading-none whitespace-nowrap">
          SAY HI
        </span>
      </div>

      <motion.div style={{ scale }} className="max-w-[100rem] mx-auto relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 md:gap-4 mb-8 md:mb-10"
        >
          <span className="font-mono text-[8px] tracking-[0.4em] md:tracking-[0.5em] uppercase text-primary/50">03</span>
          <div className="w-8 md:w-12 h-[1px] bg-primary/20" />
          <span className="font-mono text-[9px] tracking-[0.4em] md:tracking-[0.6em] uppercase text-primary/60">Contact</span>
        </motion.div>

        <motion.div style={{ y: textY }} className="mb-10 md:mb-24">
          <h3 className="text-4xl md:text-7xl lg:text-[8rem] font-display font-extrabold tracking-[-0.05em] leading-[0.88]">
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
                className="block"
              >
                Let's build
              </motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 1, ease: [0.76, 0, 0.24, 1] }}
                className="block font-serif italic font-normal text-gradient-gold"
              >
                something great
              </motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 1, ease: [0.76, 0, 0.24, 1] }}
                className="block text-outline"
              >
                together<span className="text-primary" style={{ WebkitTextFillColor: 'hsl(42 100% 62%)' }}>.</span>
              </motion.span>
            </div>
          </h3>
        </motion.div>

        {/* Email CTA */}
        <motion.div style={{ y }} className="mb-16 md:mb-32">
          <motion.a
            ref={emailRef}
            href="mailto:dy3239073@gmail.com"
            data-cursor-hover
            onMouseMove={handleEmailMove}
            onMouseLeave={() => setEmailHover({ x: 0, y: 0, active: false })}
            animate={{ x: emailHover.x, y: emailHover.y }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group inline-flex items-center gap-4 md:gap-10 border border-border/20 hover:border-primary/20 px-5 md:px-14 py-5 md:py-8 transition-colors duration-1000 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/[0.03] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)]" />
            <span className="font-display text-base md:text-3xl font-bold tracking-[-0.02em] text-foreground/60 group-hover:text-foreground transition-colors duration-700 relative z-10 break-all md:break-normal">
              dy3239073@gmail.com
            </span>
            <span className="text-primary text-lg md:text-xl relative z-10 group-hover:translate-x-2 transition-transform duration-500">↗</span>
          </motion.a>
        </motion.div>

        {/* Bottom grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 mb-12 md:mb-20">
          <div>
            <p className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] uppercase text-muted-foreground/20 mb-4 md:mb-6">Social</p>
            <div className="space-y-2.5 md:space-y-3">
              {links.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor-hover
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="group flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground/30 hover:text-foreground/80 transition-all duration-500"
                >
                  <span className="w-0 group-hover:w-3 md:group-hover:w-4 h-[1px] bg-primary transition-all duration-500" />
                  {link.label}
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] uppercase text-muted-foreground/20 mb-4 md:mb-6">Based</p>
            <p className="text-xs md:text-sm text-muted-foreground/30 leading-[2]">
              Earth 🌍
              <br />working globally.
            </p>
          </div>

          <div>
            <p className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] uppercase text-muted-foreground/20 mb-4 md:mb-6">Status</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 bg-emerald-500/70 rounded-full" />
                <div className="absolute inset-0 bg-emerald-500/40 rounded-full animate-[pulse-ring_2s_ease-out_infinite]" />
              </div>
              <span className="text-xs md:text-sm text-foreground/50">Available</span>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground/20 leading-[1.8]">
              Freelance & collabs
            </p>
          </div>

          <div className="flex items-start md:justify-end">
            <a
              href="#"
              data-cursor-hover
              className="group flex items-center gap-2 font-mono text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-muted-foreground/15 hover:text-primary/50 transition-colors duration-500"
            >
              <span>Back to top</span>
              <span className="group-hover:-translate-y-1 transition-transform duration-300">↑</span>
            </a>
          </div>
        </div>

        <div className="border-t border-border/10 pt-4 md:pt-6 flex flex-col md:flex-row justify-between gap-2">
          <p className="font-mono text-[6px] md:text-[7px] tracking-[0.4em] uppercase text-muted-foreground/10">
            © {year} Deepanshu — Crafted with obsession
          </p>
          <p className="font-mono text-[6px] md:text-[7px] tracking-[0.3em] uppercase text-muted-foreground/10">
            React · Three.js · Framer Motion
          </p>
        </div>
      </motion.div>
    </footer>
  );
};

export default FooterSection;
