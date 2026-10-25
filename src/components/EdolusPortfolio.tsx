"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useMotionPreference } from "@/components/motionPreference";
import { projects } from "@/data/portfolio";
import ImmersiveWork from "@/components/ImmersiveWork";
import styles from "./EdolusPortfolio.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const experience = [
  { company: "IIT Mandi", role: "Frontend Developer · AcadLMS", dates: "JUL 2026 — PRESENT", detail: "Contributing to an academic management platform for students and faculty. Building interfaces that make everyday academic work easier to navigate." },
  { company: "Ethixweb", role: "Full Stack Developer Intern", dates: "AUG — SEP 2026", detail: "Built web applications with React, Node.js, and MongoDB, working across database optimization, REST APIs, and frontend performance." },
  { company: "QSentia", role: "Software Development Intern", dates: "MAY — JUL 2026", detail: "Worked on an AI-powered financial research platform with TypeScript and Next.js, including interactive dashboards and real-time data visualization." },
];

const instruments = ["React", "Next.js", "TypeScript", "Three.js", "React Native", "Rust", "Tauri", "GSAP"];

export default function EdolusPortfolio() {
  const root = useRef<HTMLDivElement>(null);
  const [motion, toggleMotion] = useMotionPreference();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  useLayoutEffect(() => {
    if (!motion || !root.current) return;
    const context = gsap.context(() => {
      const ease = "power4.out";
      gsap.timeline({ defaults: { ease } })
        .from("[data-enter]", { yPercent: 115, opacity: 0, stagger: .12, duration: 1.3 })
        .from("[data-artifact]", { scale: .72, rotation: -14, opacity: 0, duration: 1.8 }, .05);

      gsap.to("[data-artifact-float]", {
        y: -16, rotation: 1.5, duration: 4.2, ease: "sine.inOut", yoyo: true, repeat: -1,
        scrollTrigger: { trigger: "[data-intro-scene]", start: "top bottom", end: "bottom top", toggleActions: "play pause resume pause" },
      });
      gsap.to("[data-orbit-lines]", {
        rotation: 16, ease: "none",
        scrollTrigger: { trigger: "[data-intro-scene]", start: "top top", end: "bottom top", scrub: 1.2 },
      });
      root.current?.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 42, opacity: 0, duration: 1.1, ease,
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });
      const chapterHeadings = root.current?.querySelectorAll<HTMLElement>("[data-split]");
      chapterHeadings?.forEach((heading) => SplitText.create(heading, {
        type: "lines,words", mask: "lines", autoSplit: true,
        onSplit(self) {
          return gsap.from(self.words, {
            yPercent: 108, opacity: 0, stagger: .055, duration: 1, ease,
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
          });
        },
      }));
    }, root);

    return () => context.revert();
  }, [motion]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("dy3239073@gmail.com");
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = "mailto:dy3239073@gmail.com";
    }
  }

  return (
    <div ref={root} className={styles.site} data-motion={motion ? "on" : "off"}>
      <a className={styles.skip} href="#work">Skip to selected work</a>
      <header className={styles.header} id="top">
        <nav className={styles.navigation} aria-label="Main navigation">
          <a href="#work"><span>02</span> Work</a>
          <a href="#about"><span>03</span> About</a>
          <a href="#experience"><span>04</span> Experience</a>
        </nav>
        <a className={styles.wordmark} href="#top" aria-label="Deepanshu Yadav, home">D<span>/</span>Y</a>
        <button className={styles.motionToggle} type="button" onClick={toggleMotion} aria-pressed={motion}>
          <i aria-hidden="true" /> MOTION {motion ? "ON" : "OFF"}
        </button>
      </header>

      <main>
        <section className={styles.hero} data-intro-scene aria-labelledby="hero-title">
          <div className={styles.starfield} aria-hidden="true" />
          <svg className={styles.orbitLines} data-orbit-lines viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth=".7">
              <ellipse cx="790" cy="440" rx="520" ry="245" transform="rotate(-23 790 440)" />
              <ellipse cx="790" cy="440" rx="580" ry="285" transform="rotate(-23 790 440)" strokeDasharray="2 9" />
              <ellipse cx="790" cy="440" rx="420" ry="335" transform="rotate(29 790 440)" strokeDasharray="1 8" />
              <path d="M110 440h1220M790 92v700M160 700l1100-510" strokeDasharray="3 10" />
              <path d="M300 270h24m-12-12v24M1175 610h24m-12-12v24M910 164h20m-10-10v20" />
            </g>
            <g fill="currentColor"><circle cx="300" cy="270" r="3"/><circle cx="1175" cy="610" r="3"/><circle cx="910" cy="164" r="3"/></g>
          </svg>
          <div className={styles.heroTopline}><span>INDEPENDENT DEVELOPER · INDIA</span><span>PERSONAL SYSTEMS / 2026</span></div>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow} data-enter>DESIGN-LED ENGINEERING / 01</span>
            <h1 id="hero-title"><span data-enter>Technical depth.</span><em data-enter>Human instincts.</em></h1>
            <p data-enter>I’m Deepanshu Yadav — a developer shaping useful products with a little more care, clarity, and character.</p>
            <a className={styles.discoverLink} data-enter href="#work"><span>EXPLORE SELECTED WORK</span><i>↓</i></a>
          </div>
          <div className={styles.artifact} data-artifact-float>
            <div className={styles.artifactLight} aria-hidden="true" />
            <Image
              src="/images/digital-relic.webp"
              alt="A limestone ring threaded with chrome, a small study in natural and digital forms"
              width={1280}
              height={1280}
              priority
              sizes="(max-width: 700px) 90vw, 50vw"
              data-artifact
            />
            <span className={styles.artifactTag}>FIG 001 — MATTER / MEMORY</span>
          </div>
          <div className={styles.heroFoot}><span>BUILDING AT THE EDGE OF DESIGN & ENGINEERING</span><span><i /> ONLINE / INDIA</span></div>
          <span className={styles.sideCode}>INDIA / WEB · PRODUCT · INTERACTION · SYSTEMS</span>
        </section>

        <ImmersiveWork enabled={motion} />

        <section className={styles.about} id="about" aria-labelledby="about-title">
          <div className={styles.aboutVisual} data-reveal>
            <span className={styles.sectionId}>03 / A LITTLE CONTEXT</span>
            <div className={styles.signalFrame}>
              <span className={styles.signalTop}>DEVELOPER IDENTIFICATION / 001</span>
              <div className={styles.signalCore} aria-hidden="true"><i /><i /><i /><b>D/Y</b></div>
              <div className={styles.signalBottom}><span>INDIA / EARTH<br />ALWAYS IN PROGRESS</span><span>CREATIVE<br />ENGINEERING</span></div>
            </div>
            <span className={styles.visualCaption}>A USEFUL IDEA, WITH ROOM TO BREATHE.</span>
          </div>
          <div className={styles.aboutCopy} data-reveal>
            <span className={styles.sectionId}>THE PERSON BEHIND THE PIXELS</span>
            <h2 id="about-title" data-split>Making technology<br />feel <em>thoughtful.</em></h2>
            <p>I’m an Information Technology student at Chandigarh University, building across web, mobile, and desktop.</p>
            <p>Right now, I’m contributing to IIT Mandi’s AcadLMS. Before that, I worked on full-stack products at Ethixweb and an AI-driven research platform at QSentia.</p>
            <p>I care about the moment a useful idea becomes something people enjoy using — the rhythm of a page, the response of a button, the details that make it feel considered.</p>
            <a className={styles.textLink} href="/Deepanshu-Yadav-Resume.pdf" target="_blank" rel="noreferrer">VIEW RÉSUMÉ <span>↗</span></a>
          </div>
        </section>

        <section className={styles.experience} id="experience" aria-labelledby="experience-title">
          <div className={styles.experienceIntro} data-reveal>
            <span className={styles.sectionId}>04 / FIELD EXPERIENCE</span>
            <h2 id="experience-title" data-split>Learning in<br /><em>the real world.</em></h2>
            <p>Different teams and challenges. A growing sense for what it takes to make software useful.</p>
          </div>
          <div className={styles.timeline}>
            {experience.map((item, index) => (
              <details className={styles.timelineItem} key={item.company} data-reveal>
                <summary>
                  <span className={styles.timelineIndex}>0{index + 1}</span>
                  <span className={styles.timelineMain}><strong>{item.company}</strong><small>{item.role}</small></span>
                  <span className={styles.timelineDates}>{item.dates}</span>
                  <span className={styles.timelinePlus} aria-hidden="true">+</span>
                </summary>
                <p>{item.detail}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.toolset} aria-label="Technologies and tools">
          <div className={styles.toolsetTop}><span className={styles.sectionId}>05 / INSTRUMENTS</span><span>WHAT I REACH FOR</span></div>
          <div className={styles.tools}>
            {instruments.map((tool, index) => <span key={tool} data-reveal><i>0{index + 1}</i>{tool}</span>)}
          </div>
          <p>Tools are the medium. The experience is the point.</p>
        </section>

        <section className={styles.contact} id="contact" aria-labelledby="contact-title">
          <div className={styles.contactGlow} aria-hidden="true" />
          <div className={styles.contactMeta}><span>06 / OPEN CHANNEL</span><span>GOOD THINGS START WITH A CONVERSATION</span></div>
          <h2 id="contact-title" data-split>Have an idea<br />for <em>what’s next?</em></h2>
          <a className={styles.contactLink} href="mailto:dy3239073@gmail.com">LET’S BUILD SOMETHING <span>↗</span></a>
          <div className={styles.contactBottom}>
            <div><a href="mailto:dy3239073@gmail.com">dy3239073@gmail.com</a><button type="button" onClick={copyEmail}>{copied ? "COPIED ✓" : "COPY EMAIL +"}</button><span className={styles.srOnly} role="status">{copied ? "Email address copied" : ""}</span></div>
            <div className={styles.socials}><a href="https://github.com/Deepanshu0211" target="_blank" rel="noreferrer">GITHUB ↗</a><a href="https://www.linkedin.com/in/deepanshuyad/" target="_blank" rel="noreferrer">LINKEDIN ↗</a></div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <a className={styles.wordmark} href="#top">D<span>/</span>Y</a>
        <span>© {new Date().getFullYear()} DEEPANSHU YADAV</span>
        <span>BUILT WITH INTENT / INDIA</span>
        <a href="#top">BACK TO ORBIT ↑</a>
      </footer>
    </div>
  );
}
