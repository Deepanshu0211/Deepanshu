import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '@/data/projects';

// Mobile vertical card
const MobileCard = ({ project }: { project: typeof projects[0] }) => {
  return (
    <a href={project.github} target="_blank" rel="noopener noreferrer" className="block">
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="relative w-full aspect-[3/4] overflow-hidden border border-border/10 bg-card/20"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${project.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />

      <div className="absolute top-4 right-4">
        <span className="font-display text-6xl font-extrabold leading-none text-foreground/[0.03] select-none">
          {project.num}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-[1px]" style={{ backgroundColor: project.color + '80' }} />
          <span className="font-mono text-[7px] tracking-[0.4em] uppercase" style={{ color: project.color + '99' }}>
            {project.subtitle}
          </span>
          <span className="font-mono text-[7px] tracking-[0.3em] text-muted-foreground/20">{project.year}</span>
        </div>

        <h3 className="text-4xl font-display font-extrabold tracking-[-0.05em] leading-[0.85] mb-4"
          style={{ color: project.color }}
        >
          {project.title}
        </h3>

        <p className="font-sans text-xs text-muted-foreground/40 leading-[1.8] mb-5 max-w-[280px]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span key={t} className="font-mono text-[6px] tracking-[0.2em] uppercase px-3 py-1.5 border border-border/15 text-muted-foreground/30">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: project.color + '40' }} />
    </motion.div>
    </a>
  );
};

// Desktop horizontal scroll card
const HorizontalCard = ({ project, index, progress }: { project: typeof projects[0]; index: number; progress: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const cardStart = index / projects.length;
  const cardEnd = (index + 1) / projects.length;
  const cardMid = (cardStart + cardEnd) / 2;
  
  const imgScale = useTransform(progress, [cardStart, cardMid, cardEnd], [1.2, 1, 1.1]);
  const contentOpacity = useTransform(progress, 
    [cardStart, cardStart + 0.05, cardMid, cardEnd - 0.05, cardEnd], 
    [0, 1, 1, 1, 0]
  );

  return (
    <div
      className="flex-shrink-0 w-[75vw] h-full px-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-cursor-hover
      data-cursor-label="View"
    >
      <div className="relative w-full h-full overflow-hidden border border-border/10 bg-card/20 group">
        <motion.div style={{ scale: imgScale }} className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2.5s] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              backgroundImage: `url(${project.image})`,
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <motion.div
            animate={{ opacity: isHovered ? 0.08 : 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: project.color }}
          />
        </motion.div>

        <div className="absolute top-10 right-12">
          <span className="font-display text-[14rem] font-extrabold leading-none text-foreground/[0.025] select-none">
            {project.num}
          </span>
        </div>

        <motion.div style={{ opacity: contentOpacity }} className="absolute bottom-0 left-0 right-0 p-14 lg:p-20">
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              animate={{ width: isHovered ? 32 : 16 }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
              className="h-[1px]"
              style={{ backgroundColor: project.color + '80' }}
            />
            <span className="font-mono text-[8px] tracking-[0.5em] uppercase" style={{ color: project.color + '99' }}>
              {project.subtitle}
            </span>
            <span className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/20">{project.year}</span>
          </div>

          <h3 className="text-7xl lg:text-9xl font-display font-extrabold tracking-[-0.05em] leading-[0.85] mb-6 transition-all duration-1000">
            <span
              style={{
                color: isHovered ? project.color : undefined,
                WebkitTextStroke: isHovered ? '0px' : `1.5px ${project.color}50`,
                WebkitTextFillColor: isHovered ? undefined : 'transparent',
              }}
              className="transition-all duration-1000"
            >
              {project.title}
            </span>
          </h3>

          <motion.p
            animate={{ opacity: isHovered ? 0.9 : 0.4, y: isHovered ? 0 : 5 }}
            transition={{ duration: 0.8 }}
            className="font-sans text-base text-muted-foreground max-w-lg leading-[2] mb-8"
          >
            {project.description}
          </motion.p>

          <div className="flex flex-wrap gap-3 mb-6">
            {project.tech.map((t) => (
              <span
                key={t}
                className="font-mono text-[7px] tracking-[0.25em] uppercase px-4 py-2 border text-muted-foreground/30 transition-all duration-700"
                style={{
                  borderColor: isHovered ? project.color + '30' : 'hsl(var(--border) / 0.15)',
                  color: isHovered ? project.color + '90' : undefined,
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <motion.a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-[1px]" style={{ backgroundColor: project.color }} />
            <span className="font-mono text-[8px] tracking-[0.3em] uppercase" style={{ color: project.color }}>
              View on GitHub ↗
            </span>
          </motion.a>
        </motion.div>

        <motion.div
          className="absolute top-0 left-0 h-[2px]"
          style={{ backgroundColor: project.color }}
          animate={{ width: isHovered ? '100%' : '0%' }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        />
      </div>
    </div>
  );
};

const ProjectsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 100 });

  const [scrollWidth, setScrollWidth] = useState(0);
  
  useEffect(() => {
    if (isMobile) return;
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        setScrollWidth(containerWidth - viewportWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isMobile]);

  const x = useTransform(smoothProgress, [0.1, 0.9], [0, -scrollWidth]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.08, 0.12], [1, 1, 0]);

  // Mobile: vertical scroll layout
  if (isMobile) {
    return (
      <section id="work" className="relative px-5 py-20">
        <div className="flex items-center gap-4 mb-6">
          <span className="font-mono text-[8px] tracking-[0.5em] uppercase text-primary/50">01</span>
          <div className="w-8 h-[1px] bg-primary/20" />
          <span className="font-mono text-[9px] tracking-[0.5em] uppercase text-primary/60">Selected Work</span>
        </div>
        <h2 className="text-5xl font-display font-extrabold tracking-[-0.06em] leading-[0.82] mb-10">
          Proj<span className="font-serif italic font-normal text-gradient-gold">ects</span>
        </h2>
        <div className="space-y-6">
          {projects.map((project) => (
            <MobileCard key={project.title} project={project} />
          ))}
        </div>
        <Link
          to="/projects"
          className="block mt-10 text-center font-mono text-[9px] tracking-[0.3em] uppercase text-primary/50 hover:text-primary/80 transition-colors duration-500"
        >
          View All Projects ↗
        </Link>
      </section>
    );
  }

  // Desktop: horizontal scroll
  return (
    <section id="work" ref={sectionRef} className="relative" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute top-0 left-0 right-0 z-20 px-12 lg:px-20 pt-32"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[8px] tracking-[0.5em] uppercase text-primary/50">01</span>
            <div className="w-12 h-[1px] bg-primary/20" />
            <span className="font-mono text-[9px] tracking-[0.6em] uppercase text-primary/60">Selected Work</span>
          </div>
          <div className="flex items-end justify-between">
            <h2 className="text-8xl lg:text-[10rem] font-display font-extrabold tracking-[-0.06em] leading-[0.82]">
              Proj<span className="font-serif italic font-normal text-gradient-gold">ects</span>
            </h2>
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-muted-foreground/15 pb-4">
              Scroll horizontally →
            </p>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-12 z-20 flex items-center gap-4">
          <div className="w-20 h-[1px] bg-border/10 overflow-hidden">
            <motion.div style={{ scaleX: scrollYProgress }} className="h-full bg-primary/50 origin-left" />
          </div>
          <span className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/20">
            {projects.length} projects
          </span>
        </div>

        <Link
          to="/projects"
          data-cursor-hover
          data-cursor-label="View All"
          className="absolute bottom-8 right-12 z-20 font-mono text-[8px] tracking-[0.3em] uppercase text-primary/40 hover:text-primary/80 transition-colors duration-500"
        >
          View All Projects ↗
        </Link>

        <motion.div
          ref={scrollContainerRef}
          style={{ x }}
          className="flex items-center h-full pt-8 will-change-transform"
        >
          <div className="flex-shrink-0 w-[15vw]" />
          {projects.map((project, index) => (
            <HorizontalCard key={project.title} project={project} index={index} progress={smoothProgress} />
          ))}
          <div className="flex-shrink-0 w-[15vw]" />
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsSection;
