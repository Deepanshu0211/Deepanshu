import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import AboutScene, { AboutSceneHandle } from './AboutScene';

const stats = [
  { val: '50+', label: 'Projects Built' },
  { val: '440+', label: 'Contributions' },
  { val: '65+', label: 'Followers' },
  { val: '∞', label: 'Curiosity' },
];

const philosophies = [
  { num: '01', title: 'Design is not decoration', desc: 'Every visual decision solves a problem. If it doesn\'t serve the user, it doesn\'t belong.' },
  { num: '02', title: 'Code is craft', desc: 'Clean architecture isn\'t optional. The best code reads like well-written prose.' },
  { num: '03', title: 'Ship, learn, iterate', desc: 'Perfection is the enemy. Launch early, gather feedback, and evolve ruthlessly.' },
];

const experiences = [
  { role: 'Full-Stack Developer', org: 'Freelance', period: '2024 — Present', desc: 'Building production-grade applications for startups and businesses worldwide.' },
  { role: 'Open Source Contributor', org: 'GitHub', period: '2023 — Present', desc: 'Contributing to React ecosystem tools, created Neatify, DivCopy, and more.' },
  { role: 'CS & AI Student', org: 'University', period: '2022 — Present', desc: 'Deep focus on systems programming, AI/ML, and algorithm design.' },
];

const skills = [
  { name: 'React / Next.js', level: 92 },
  { name: 'TypeScript', level: 88 },
  { name: 'Python & AI', level: 85 },
  { name: 'Node.js / MongoDB', level: 78 },
  { name: 'Three.js / WebGL', level: 65 },
  { name: 'DevOps & Cloud', level: 70 },
];

const AboutSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<AboutSceneHandle>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    if (isMobile) return;
    const unsub = scrollYProgress.on('change', (v) => {
      sceneRef.current?.setScrollProgress(v);
    });
    return unsub;
  }, [scrollYProgress, isMobile]);

  const introOpacity = useTransform(scrollYProgress, [0, 0.06, 0.18], [0, 1, 1]);
  const introY = useTransform(scrollYProgress, [0, 0.08], [60, 0]);
  const introExit = useTransform(scrollYProgress, [0.18, 0.24], [1, 0]);

  const statsOpacity = useTransform(scrollYProgress, [0.18, 0.26], [0, 1]);
  const statsY = useTransform(scrollYProgress, [0.18, 0.28], [50, 0]);
  const statsExit = useTransform(scrollYProgress, [0.36, 0.42], [1, 0]);

  const philoOpacity = useTransform(scrollYProgress, [0.36, 0.44], [0, 1]);
  const philoY = useTransform(scrollYProgress, [0.36, 0.46], [50, 0]);
  const philoExit = useTransform(scrollYProgress, [0.54, 0.60], [1, 0]);

  const expOpacity = useTransform(scrollYProgress, [0.55, 0.63], [0, 1]);
  const expY = useTransform(scrollYProgress, [0.55, 0.65], [50, 0]);
  const expExit = useTransform(scrollYProgress, [0.74, 0.80], [1, 0]);

  const skillsOpacity = useTransform(scrollYProgress, [0.76, 0.84], [0, 1]);
  const skillsY = useTransform(scrollYProgress, [0.76, 0.86], [50, 0]);

  // Mobile: vertical layout with simple animations
  if (isMobile) {
    return (
      <section id="about" className="relative px-5 py-20">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-primary/50">02</span>
            <div className="w-10 h-[1px] bg-primary/30" />
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-primary/60">About</span>
          </div>
          <h2 className="text-4xl font-display font-extrabold tracking-[-0.05em] leading-[0.9] mb-6">
            Driven<br />
            <span className="font-serif italic font-normal text-gradient-gold">by curiosity</span>
            <span className="text-primary/10">.</span>
          </h2>
          <p className="text-sm leading-[2] text-foreground/50">
            Web Developer & CS/AI Engineer — teaching machines, reshaping systems, and bridging code to the physical world.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center py-6 px-3 border border-border/10 bg-background/50">
                <p className="font-display text-3xl font-extrabold text-gradient-gold mb-2 leading-none">{stat.val}</p>
                <p className="font-mono text-[7px] tracking-[0.4em] uppercase text-foreground/30">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Philosophy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-[1px] bg-primary/30" />
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-primary/50">Philosophy</span>
          </div>
          <div className="space-y-4">
            {philosophies.map((p) => (
              <div key={p.num} className="border border-border/10 p-6 bg-background/50">
                <span className="font-mono text-[9px] tracking-[0.4em] text-primary/40 mb-4 block">{p.num}</span>
                <h4 className="font-display text-base font-bold text-foreground/70 mb-2">{p.title}</h4>
                <p className="text-xs text-foreground/30 leading-[1.8]">{p.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-[1px] bg-primary/30" />
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-primary/50">Experience</span>
          </div>
          {experiences.map((exp) => (
            <div key={exp.role} className="py-6 border-t border-border/10">
              <span className="font-mono text-[9px] tracking-[0.3em] text-foreground/25 block mb-2">{exp.period}</span>
              <p className="font-display text-lg font-bold text-foreground/60 mb-1">{exp.role}</p>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary/30 mb-3">{exp.org}</p>
              <p className="text-xs text-foreground/30 leading-[1.9]">{exp.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-[1px] bg-primary/30" />
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-primary/50">Skills</span>
          </div>
          <div className="space-y-6">
            {skills.map((skill, i) => (
              <div key={skill.name}>
                <div className="flex justify-between mb-2">
                  <span className="font-mono text-xs text-foreground/45">{skill.name}</span>
                  <span className="font-mono text-[9px] text-foreground/20">{skill.level}%</span>
                </div>
                <div className="h-[2px] bg-border/10 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: skill.level / 100 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
                    className="h-full origin-left"
                    style={{ background: 'linear-gradient(90deg, hsl(42 100% 62% / 0.8) 0%, hsl(42 100% 62% / 0.15) 100%)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quote */}
        <div className="text-center py-8">
          <div className="w-12 h-[1px] bg-primary/20 mx-auto mb-8" />
          <p className="font-serif italic text-xl leading-[1.7] text-foreground/30">
            "The best interfaces feel<span className="text-gradient-gold"> invisible</span> — they just work."
          </p>
          <div className="w-12 h-[1px] bg-primary/20 mx-auto mt-8" />
        </div>
      </section>
    );
  }

  // Desktop: scroll-driven sticky layout
  return (
    <section id="about" ref={containerRef} className="relative" style={{ height: '500vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full opacity-60">
            <AboutScene ref={sceneRef} />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, hsl(42 100% 62% / 0.06) 0%, transparent 60%)' }}
          />
        </div>

        <div className="absolute inset-0 z-[1] bg-background/40" />

        <div className="absolute inset-0 z-10">
          <div className="h-full w-full px-16 lg:px-24 flex items-center justify-center">
            <div className="max-w-6xl w-full">

              <motion.div style={{ opacity: introOpacity, y: introY }} className="absolute inset-0 flex items-center px-16 lg:px-24">
                <motion.div style={{ opacity: introExit }} className="max-w-3xl">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="font-mono text-[9px] tracking-[0.5em] uppercase text-primary/50">02</span>
                    <div className="w-16 h-[1px] bg-primary/30" />
                    <span className="font-mono text-[10px] tracking-[0.5em] uppercase text-primary/60">About</span>
                  </div>
                  <h2 className="text-7xl lg:text-8xl font-display font-extrabold tracking-[-0.05em] leading-[0.9] mb-8">
                    Driven<br />
                    <span className="font-serif italic font-normal text-gradient-gold">by curiosity</span>
                    <span className="text-primary/10">.</span>
                  </h2>
                  <p className="text-lg leading-[2] text-foreground/50 max-w-lg">
                    Web Developer & CS/AI Engineer — teaching machines, reshaping systems, and bridging code to the physical world.
                  </p>
                </motion.div>
              </motion.div>

              <motion.div style={{ opacity: statsOpacity, y: statsY }} className="absolute inset-0 flex items-center justify-center px-16 lg:px-24">
                <motion.div style={{ opacity: statsExit }} className="w-full max-w-4xl">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-8 h-[1px] bg-primary/30" />
                    <span className="font-mono text-[10px] tracking-[0.5em] uppercase text-primary/50">Numbers</span>
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {stats.map((stat) => (
                      <div key={stat.label} className="text-center py-8 px-4 border border-border/10 backdrop-blur-md bg-background/50 hover:border-primary/20 transition-all duration-700">
                        <p className="font-display text-6xl font-extrabold text-gradient-gold mb-3 leading-none">{stat.val}</p>
                        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-foreground/30">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div style={{ opacity: philoOpacity, y: philoY }} className="absolute inset-0 flex items-center px-16 lg:px-24">
                <motion.div style={{ opacity: philoExit }} className="w-full max-w-5xl">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-8 h-[1px] bg-primary/30" />
                    <span className="font-mono text-[10px] tracking-[0.5em] uppercase text-primary/50">Philosophy</span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {philosophies.map((p) => (
                      <div key={p.num} className="border border-border/10 p-8 backdrop-blur-md bg-background/50 group hover:border-primary/25 transition-all duration-700">
                        <span className="font-mono text-[10px] tracking-[0.5em] text-primary/40 mb-6 block">{p.num}</span>
                        <h4 className="font-display text-lg font-bold tracking-[-0.02em] text-foreground/70 group-hover:text-foreground mb-3 transition-colors duration-500">{p.title}</h4>
                        <p className="text-sm text-foreground/30 leading-[1.9] group-hover:text-foreground/55 transition-colors duration-500">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div style={{ opacity: expOpacity, y: expY }} className="absolute inset-0 flex items-center px-16 lg:px-24">
                <motion.div style={{ opacity: expExit }} className="w-full max-w-5xl">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-8 h-[1px] bg-primary/30" />
                    <span className="font-mono text-[10px] tracking-[0.5em] uppercase text-primary/50">Experience</span>
                  </div>
                  {experiences.map((exp) => (
                    <div key={exp.role} className="group grid grid-cols-12 gap-4 py-8 border-t border-border/10 hover:border-primary/15 transition-all duration-700">
                      <span className="col-span-3 font-mono text-[10px] tracking-[0.3em] text-foreground/25 pt-1">{exp.period}</span>
                      <div className="col-span-4">
                        <p className="font-display text-xl font-bold text-foreground/60 group-hover:text-foreground transition-colors duration-500">{exp.role}</p>
                        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary/30 mt-1">{exp.org}</p>
                      </div>
                      <p className="col-span-5 text-sm text-foreground/30 leading-[2] group-hover:text-foreground/60 transition-colors duration-500">{exp.desc}</p>
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div style={{ opacity: skillsOpacity, y: skillsY }} className="absolute inset-0 flex items-center px-16 lg:px-24">
                <div className="w-full max-w-5xl">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-8 h-[1px] bg-primary/30" />
                    <span className="font-mono text-[10px] tracking-[0.5em] uppercase text-primary/50">Technical Skills</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-16 gap-y-8 mb-20">
                    {skills.map((skill, i) => (
                      <div key={skill.name} className="group">
                        <div className="flex justify-between mb-3">
                          <span className="font-mono text-sm text-foreground/45 group-hover:text-foreground/70 transition-colors duration-500">{skill.name}</span>
                          <span className="font-mono text-[10px] text-foreground/20 group-hover:text-foreground/40 transition-colors duration-500">{skill.level}%</span>
                        </div>
                        <div className="h-[2px] bg-border/10 overflow-hidden">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: skill.level / 100 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 1.8, ease: [0.76, 0, 0.24, 1] }}
                            className="h-full origin-left"
                            style={{ background: 'linear-gradient(90deg, hsl(42 100% 62% / 0.8) 0%, hsl(42 100% 62% / 0.15) 100%)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="max-w-xl mx-auto text-center">
                    <div className="w-16 h-[1px] bg-primary/20 mx-auto mb-10" />
                    <p className="font-serif italic text-3xl leading-[1.7] text-foreground/30">
                      "The best interfaces feel<span className="text-gradient-gold"> invisible</span> — they just work."
                    </p>
                    <div className="w-16 h-[1px] bg-primary/20 mx-auto mt-10" />
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
