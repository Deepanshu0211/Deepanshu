"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMotionPreference } from "@/components/motionPreference";
import styles from "./Portfolio.module.css";
import Relic from "./Relic";
import SiteMotion from "./SiteMotion";
import MascotCompanion from "./MascotCompanion";
import ImmersiveWork from "./ImmersiveWork";

function Star({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 0 57 36 85 15 64 43 100 50 64 57 85 85 57 64 50 100 43 64 15 85 36 57 0 50 36 43 15 15 43 36Z" fill="currentColor" /></svg>;
}

const journey = [
  { company: "IIT Mandi", role: "Frontend Developer · AcadLMS", dates: "JUL 2026 — PRESENT", detail: "Contributing to an academic management platform for students and faculty. Building interfaces that make everyday academic work easier to navigate." },
  { company: "Ethixweb", role: "Full Stack Developer Intern", dates: "AUG — SEP 2026", detail: "Built web applications with React, Node.js, and MongoDB, working across database optimization, REST APIs, and frontend performance." },
  { company: "QSentia", role: "Software Development Intern", dates: "MAY — JUL 2026", detail: "Worked on an AI-powered financial research platform with TypeScript and Next.js, including interactive dashboards and real-time data visualization." },
];

export default function Portfolio() {
  const [menu, setMenu] = useState(false);

  const [copied, setCopied] = useState(false);
  const [motion, toggleMotion] = useMotionPreference();
  const root = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("dy3239073@gmail.com");
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch { window.location.href = "mailto:dy3239073@gmail.com"; }
  }

  return <div ref={root} className={styles.site} data-motion={motion ? "on" : "off"}>
    <SiteMotion scope={root} enabled={motion} />
    <a className={styles.skip} href="#work">Skip to selected work</a>
    <header className={styles.header} id="top">
      <a href="#top" className={styles.wordmark} aria-label="Deepanshu Yadav home">
        d/y<Star />
        <span className={styles.companionMiniBadge} title="Neatify digital companion online">
          <img src="/mascot/expressions/idle.png" alt="Companion" width={22} height={22} />
        </span>
      </a>
      <span className={styles.headerNote}>INDEPENDENT DEVELOPER<br />BASED IN INDIA, ONLINE EVERYWHERE</span>
      <button className={styles.menuButton} aria-expanded={menu} aria-controls="main-navigation" onClick={() => setMenu(!menu)}>{menu ? "CLOSE −" : "MENU +"}</button>
      <nav id="main-navigation" className={`${styles.nav} ${menu ? styles.navOpen : ""}`} aria-label="Main navigation">
        <a href="#work" onClick={() => setMenu(false)}>Work <sup>04</sup></a>
        <a href="#person" onClick={() => setMenu(false)}>About</a>
        <a href="#hello" onClick={() => setMenu(false)}>Let’s talk <span>↗</span></a>
      </nav>
    </header>
    <main>
      <section className={styles.worldHero} aria-labelledby="hero-title" data-world-hero>
        <svg className={styles.orbitDrawing} viewBox="0 0 1400 850" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth=".65">
            <ellipse cx="710" cy="415" rx="490" ry="260" transform="rotate(-28 710 415)" />
            <ellipse cx="710" cy="415" rx="510" ry="277" transform="rotate(-28 710 415)" />
            <ellipse cx="710" cy="415" rx="535" ry="302" transform="rotate(-28 710 415)" strokeDasharray="2 10" />
            <circle cx="710" cy="415" r="335" strokeDasharray="1 8" />
            <path d="M90 415h1220M710 45v740M135 650l1120-470" strokeDasharray="3 8" />
            <path d="M210 280h30m-15-15v30M1140 570h30m-15-15v30M880 115h25m-12-12v25" />
          </g>
        </svg>
        <div className={styles.worldKicker}><span>EXPLORATIONS IN DIGITAL ARCHAEOLOGY</span><span>OBJECT NO. 001 / 2026</span></div>
        <div className={styles.worldTitle} aria-hidden="true"><span data-world-word>Between</span><em data-world-word>worlds.</em></div>
        <Relic key={motion ? "motion" : "still"} enabled={motion} />
        <div className={styles.worldIdentity}><h1 id="hero-title">Deepanshu Yadav</h1><p>Creative developer & full-stack engineer.<br />Turning curious ideas into<br />things that work. And feel.</p></div>
        <div className={styles.specimenNote}><span>STONE / SILICON</span><p>Old textures.<br />New possibilities.</p><span>INDIA / EARTH</span></div>
        <div className={styles.worldBottom}><a href="#work">SELECTED WORK <span>↗</span></a><span>SCROLL TO UNEARTH <i>↓</i></span><a href="#person">THE HUMAN BEHIND IT ↗</a></div>
      </section>

      <section className={styles.assembly} data-assembly aria-labelledby="assembly-title">
        <div className={styles.assemblyScene} data-assembly-scene>
          <div className={styles.assemblyHeading}><span className={styles.tinyLabel}>FIELD NOTES / 001</span><h2 id="assembly-title">Everything begins<br />with <em>a fragment.</em></h2></div>
          <div className={styles.fragments} aria-hidden="true">
            {[0, 1, 2, 3].map((piece) => <div key={piece} data-fragment className={`${styles.fragment} ${styles[`fragment${piece}`]}`}><Image src="/images/digital-relic.webp" alt="" width={1280} height={1280} sizes="(max-width: 700px) 80vw, 42vw" /></div>)}
          </div>
          <div className={styles.assemblyCopy}><span className={styles.tinyLabel}>OBSERVE. EXPERIMENT. ASSEMBLE.</span><p>A rough sketch. A stubborn problem.<br />An idea that won’t leave you alone.</p><p>I connect the pieces — design, code,<br />and a little instinct — until they<br />become something worth using.</p><span className={styles.assemblyProgress} aria-hidden="true"><i data-assembly-progress /></span></div>
          <span className={styles.assemblyCaption}>FIG. 01 — THE SHAPE OF A WORK IN PROGRESS</span>
        </div>
      </section>
      <section className={styles.intro} data-reveal>
        <div className={styles.sectionLabel}><span>01 / THE APPROACH</span><Star /></div>
        <div><h2>Precise in the build.<br /><em>Human in the details.</em></h2><div className={styles.introBottom}><span>( A WORK IN PROGRESS. ALWAYS. )</span><p>Somewhere between a well-written function and a slightly offbeat idea — that’s where I like to work. Thoughtful interfaces, real-world tools, and the occasional happy accident.</p></div></div>
      </section>

      <ImmersiveWork enabled={motion} />

      <section id="person" className={styles.about}>
        <div className={styles.aboutArtifact} data-reveal>
          <span className={styles.tinyLabel}>03 / THE PERSON BEHIND THE PIXELS</span>
          <div className={styles.identityCard}>
            <div><span>DEVELOPER IDENTIFICATION</span><Star /></div>
            <strong>DEEP<br />ANSHU<span>↗</span></strong>
            <div className={styles.cardFoot}>
              <span>INDIA / EARTH<br />PERPETUALLY CURIOUS</span>
              <span className={styles.barcode} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.mascotSectionWrapper}>
            <MascotCompanion />
          </div>
          <p className={styles.artifactNote}>Still figuring things out.<br />Still making things.</p>
        </div>
        <div className={styles.aboutCopy} data-reveal>
          <h2>A person,<br /><em>not a pixel factory.</em></h2>
          <p>I’m Deepanshu. An Information Technology student at Chandigarh University, building across web, mobile, and desktop.</p>
          <p>Right now, I’m contributing to IIT Mandi’s AcadLMS. Before that: full-stack work at Ethixweb and an AI-driven research platform at QSentia.</p>
          <p>I care about the part where a useful idea becomes something you actually enjoy using. The rhythm of a page. The response of a button. The things that make it feel considered. No generic AI templates — just deliberate craftsmanship, code that breathes, and a quietly helpful companion.</p>
          <a href="/Deepanshu-Yadav-Resume.pdf" target="_blank" rel="noreferrer" className={styles.resume}>THE MORE FORMAL VERSION <span>Résumé ↗</span></a>
          <div className={styles.tools}>
            <span>USUALLY REACHING FOR</span>
            <p>React · Next.js · TypeScript · Three.js<br />React Native · Rust · Tauri · GSAP</p>
          </div>
        </div>
      </section>

      <section className={styles.journey} id="experience" data-reveal><div><span className={styles.tinyLabel}>04 / ALONG THE WAY</span><h2>Learning.<br /> <em>By doing.</em></h2></div><div className={styles.journeyList}>{journey.map((item, index) => <details key={item.company}><summary><span className={styles.projectNumber}>0{index + 1}</span><span><strong>{item.company}</strong><small>{item.role}</small></span><span className={styles.dates}>{item.dates}</span><span className={styles.expand}>+</span></summary><p>{item.detail}</p></details>)}</div></section>

      <section id="hello" className={styles.contact}>
        <div className={styles.contactTop}><span>HAVE SOMETHING IN MIND?</span><span>GOOD THINGS START WITH A HELLO.</span></div>
        <a href="mailto:dy3239073@gmail.com" className={styles.contactTitle}>LET’S MAKE<br /><span><em>something</em><span className={styles.contactArrow}>↗</span></span></a>
        <div className={styles.contactBottom}><div><a href="mailto:dy3239073@gmail.com">dy3239073@gmail.com</a><button onClick={copyEmail} aria-label="Copy email address">{copied ? "COPIED ✓" : "COPY ↗"}</button><span role="status" className={styles.accessible}>{copied ? "Email address copied" : ""}</span></div><div className={styles.socials}><a href="https://github.com/Deepanshu0211" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/deepanshuyad/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></div>
      </section>
    </main>
    <footer className={styles.footer}><span>© {new Date().getFullYear()} DEEPANSHU YADAV</span><span>BUILT WITH INTENT. LEFT A LITTLE IMPERFECT.</span><button onClick={toggleMotion} aria-pressed={motion}>MOTION {motion ? "ON ◉" : "OFF ○"}</button><a href="#top">BACK TO TOP ↑</a></footer>
  </div>;
}
