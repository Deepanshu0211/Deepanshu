import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects } from '@/data/projects';
import CustomCursor from '@/components/CustomCursor';
import Navigation from '@/components/Navigation';

const ease = [0.76, 0, 0.24, 1];

const SplitText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  return (
    <span className="inline-flex overflow-hidden">
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ y: '110%', rotateX: -80 }}
          animate={{ y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: delay + i * 0.03, ease }}
          className="inline-block"
          style={{ transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

const ProjectCard = ({ project, index }: { project: typeof projects[0]; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-100px' });
  const [isHovered, setIsHovered] = useState(false);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1]);

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2, ease }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: isHovered ? 0.06 : 0 }}
        transition={{ duration: 1.2 }}
        className="absolute -inset-20 blur-[120px] rounded-full pointer-events-none"
        style={{ backgroundColor: project.color }}
      />

      <a
        href={project.github}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor-hover
        data-cursor-label="View"
      >
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-start ${isEven ? '' : 'lg:direction-rtl'}`}>
          
          {/* Image — spans 7 cols */}
          <motion.div
            initial={{ opacity: 0, y: 80, clipPath: 'inset(15% 0% 15% 0%)' }}
            animate={isInView ? { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' } : {}}
            transition={{ duration: 1.4, delay: 0.1, ease }}
            className={`relative overflow-hidden ${isEven ? 'lg:col-span-7' : 'lg:col-span-7 lg:col-start-6'}`}
            style={{ direction: 'ltr' }}
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <motion.div
                ref={imageRef}
                style={{ y: imageY, scale: imageScale }}
                className="absolute inset-0"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    backgroundImage: `url(${project.image})`,
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  }}
                />
              </motion.div>

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />

              {/* Color wash on hover */}
              <motion.div
                animate={{ opacity: isHovered ? 0.12 : 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 mix-blend-color"
                style={{ backgroundColor: project.color }}
              />

              {/* Large number watermark */}
              <motion.span
                initial={{ opacity: 0, x: 40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1.2, delay: 0.5, ease }}
                className="absolute -top-8 -right-4 font-display text-[16rem] lg:text-[22rem] font-extrabold leading-none text-foreground/[0.015] select-none pointer-events-none"
              >
                {project.num}
              </motion.span>

              {/* Accent line top */}
              <motion.div
                className="absolute top-0 left-0 h-[2px]"
                style={{ backgroundColor: project.color }}
                initial={{ width: '0%' }}
                animate={isHovered ? { width: '100%' } : { width: '0%' }}
                transition={{ duration: 1.4, ease }}
              />

              {/* Accent line bottom */}
              <motion.div
                className="absolute bottom-0 right-0 h-[1px]"
                style={{ backgroundColor: project.color + '40' }}
                initial={{ width: '0%' }}
                animate={isHovered ? { width: '60%' } : { width: '0%' }}
                transition={{ duration: 1.6, delay: 0.1, ease }}
              />
            </div>
          </motion.div>

          {/* Content — spans 5 cols */}
          <div
            className={`${isEven ? 'lg:col-span-5 lg:pl-16' : 'lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pr-16'} flex flex-col justify-center`}
            style={{ direction: 'ltr' }}
          >
            {/* Subtitle line */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="flex items-center gap-4 mb-6"
            >
              <motion.div
                animate={{ width: isHovered ? 40 : 20 }}
                transition={{ duration: 1, ease }}
                className="h-[1px]"
                style={{ backgroundColor: project.color + '80' }}
              />
              <span className="font-mono text-[7px] tracking-[0.6em] uppercase" style={{ color: project.color + 'AA' }}>
                {project.subtitle}
              </span>
              <div className="w-[1px] h-3 bg-border/10" />
              <span className="font-mono text-[7px] tracking-[0.4em] text-muted-foreground/15">{project.year}</span>
              {project.stars && (
                <>
                  <div className="w-[1px] h-3 bg-border/10" />
                  <span className="font-mono text-[7px] tracking-[0.2em] text-muted-foreground/25">★ {project.stars}</span>
                </>
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.4, ease }}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold tracking-[-0.06em] leading-[0.82] mb-8"
            >
              <motion.span
                animate={{
                  color: isHovered ? project.color : undefined,
                  WebkitTextStroke: isHovered ? '0px' : `1.5px ${project.color}60`,
                  WebkitTextFillColor: isHovered ? project.color : 'transparent',
                }}
                transition={{ duration: 0.8 }}
                className="transition-all"
              >
                {project.title}
              </motion.span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 0.4, y: 0 } : {}}
              whileHover={{ opacity: 0.7 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="font-sans text-sm lg:text-[15px] text-muted-foreground leading-[2.2] mb-10 max-w-md"
            >
              {project.longDescription}
            </motion.p>

            {/* Tech stack */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6, ease }}
              className="mb-8"
            >
              <span className="font-mono text-[6px] tracking-[0.5em] uppercase text-muted-foreground/15 mb-4 block">
                Technology
              </span>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((t, i) => (
                  <motion.span
                    key={t}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.05, ease }}
                    className="font-mono text-[7px] tracking-[0.25em] uppercase px-4 py-2 border text-muted-foreground/25 transition-all duration-700"
                    style={{
                      borderColor: isHovered ? project.color + '25' : 'hsl(var(--border) / 0.1)',
                      color: isHovered ? project.color + '80' : undefined,
                    }}
                  >
                    {t}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.7, ease }}
              className="mb-10"
            >
              <span className="font-mono text-[6px] tracking-[0.5em] uppercase text-muted-foreground/15 mb-4 block">
                Key Features
              </span>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {project.features.map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.06, ease }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      animate={{ scale: isHovered ? 1.5 : 1 }}
                      transition={{ duration: 0.6 }}
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color + '50' }}
                    />
                    <span className="font-sans text-[11px] text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors duration-700 leading-relaxed">
                      {f}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.9, ease }}
              className="flex items-center gap-8"
            >
              <motion.span
                animate={{ opacity: isHovered ? 1 : 0.3, x: isHovered ? 0 : -10 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 font-mono text-[8px] tracking-[0.3em] uppercase"
                style={{ color: project.color }}
              >
                <motion.div
                  animate={{ width: isHovered ? 32 : 16 }}
                  transition={{ duration: 0.8, ease }}
                  className="h-[1px]"
                  style={{ backgroundColor: project.color }}
                />
                View Source ↗
              </motion.span>
              {project.live && (
                <motion.a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  animate={{ opacity: isHovered ? 0.7 : 0.15 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="font-mono text-[8px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground/70 transition-colors duration-300"
                >
                  Live ↗
                </motion.a>
              )}
            </motion.div>
          </div>
        </div>
      </a>

      {/* Divider */}
      {index < projects.length - 1 && (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.2, ease }}
          className="mt-32 h-[1px] bg-border/5 origin-left"
        />
      )}
    </motion.div>
  );
};

const Projects = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const lineWidth = useTransform(scrollYProgress, [0, 0.5], ['0%', '100%']);

  return (
    <div className="noise min-h-screen bg-background text-foreground">
      <CustomCursor />
      <Navigation />

      {/* Hero */}
      <motion.div
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative px-6 md:px-12 lg:px-20 pt-40 pb-32 min-h-[85vh] flex flex-col justify-end"
      >
        {/* Background decorative number */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease }}
          className="absolute top-20 right-8 lg:right-20 font-display text-[20rem] md:text-[30rem] lg:text-[40rem] font-extrabold leading-none text-foreground/[0.008] select-none pointer-events-none"
        >
          W
        </motion.span>

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="flex items-center gap-4 mb-10"
        >
          <button
            onClick={() => navigate('/')}
            data-cursor-hover
            className="font-mono text-[8px] tracking-[0.5em] uppercase text-primary/40 hover:text-primary/80 transition-colors duration-500"
          >
            Home
          </button>
          <div className="w-6 h-[1px] bg-primary/15" />
          <span className="font-mono text-[8px] tracking-[0.6em] uppercase text-primary/60">Selected Work</span>
          <div className="flex-1 h-[1px] bg-border/5 max-w-[200px]" />
          <span className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/10">
            {projects.length} Projects
          </span>
        </motion.div>

        {/* Title */}
        <div className="overflow-hidden mb-6">
          <h1 className="text-7xl md:text-[9rem] lg:text-[14rem] xl:text-[18rem] font-display font-extrabold tracking-[-0.06em] leading-[0.78]">
            <SplitText text="Proj" delay={0.3} />
            <span className="font-serif italic font-normal text-gradient-gold">
              <SplitText text="ects" delay={0.45} />
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease }}
            className="font-sans text-sm text-muted-foreground/25 leading-[2.2] max-w-md"
          >
            Crafted solutions across desktop, web, and tooling — each project 
            driven by a desire to build things that matter.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
              <span className="font-mono text-[7px] tracking-[0.4em] uppercase text-muted-foreground/15">
                Open Source
              </span>
            </div>
            <div className="w-[1px] h-4 bg-border/8" />
            <span className="font-mono text-[7px] tracking-[0.3em] text-muted-foreground/10">
              2024 — Present
            </span>
          </motion.div>
        </div>

        {/* Animated divider */}
        <motion.div
          style={{ width: lineWidth }}
          className="mt-16 h-[1px] bg-gradient-to-r from-primary/30 via-primary/10 to-transparent"
        />
      </motion.div>

      {/* Projects */}
      <main className="px-6 md:px-12 lg:px-20 pb-32">
        <div className="space-y-40 lg:space-y-52">
          {projects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease }}
          className="mt-52 pt-24 border-t border-border/5 flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="w-16 h-16 rounded-full border border-primary/10 flex items-center justify-center mb-10"
          >
            <span className="font-display text-lg font-bold text-primary/40">↗</span>
          </motion.div>

          <p className="font-mono text-[8px] tracking-[0.6em] uppercase text-muted-foreground/15 mb-8">
            Explore more on GitHub
          </p>

          <a
            href="https://github.com/Deepanshu0211"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor-hover
            data-cursor-label="GitHub"
            className="group inline-flex items-center gap-6"
          >
            <div className="w-16 h-[1px] bg-primary/20 group-hover:w-24 group-hover:bg-primary/40 transition-all duration-700" />
            <span className="font-display text-2xl md:text-4xl font-bold tracking-[-0.03em] text-foreground/20 group-hover:text-foreground/60 transition-colors duration-700">
              @Deepanshu0211
            </span>
            <div className="w-16 h-[1px] bg-primary/20 group-hover:w-24 group-hover:bg-primary/40 transition-all duration-700" />
          </a>

          <motion.button
            onClick={() => navigate('/')}
            data-cursor-hover
            whileHover={{ y: -2 }}
            className="mt-16 font-mono text-[8px] tracking-[0.4em] uppercase text-muted-foreground/20 hover:text-primary/60 transition-colors duration-500"
          >
            ← Back to Home
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};

export default Projects;
