"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { projects } from "@/data/portfolio";
import { useMotionPreference } from "@/components/motionPreference";
import EditorialMotion from "@/components/EditorialMotion";
import Loader from "@/components/Loader";
// import Playground from "@/components/Playground";
import PersonalCard from "@/components/PersonalCard";
import SmoothScroll from "@/components/SmoothScroll";
import FloatingDock from "@/components/FloatingDock";
import { discover } from "@/components/discoveries";
import { playSfx } from "@/components/sfx";

const Monogram = dynamic(() => import("@/components/Monogram"), {
  ssr: false,
  loading: () => <span className="monogram-loading">dy.</span>,
});

function ProjectArt({ type }: { type: string }) {
  if (type === "impact")
    return (
      <div className="poster poster-impact">
        <div className="poster-eyebrow">PEOPLE. PLACES. POSSIBILITIES.</div>
        <div className="impact-globe">
          <i />
          <i />
          <i />
          <i />
          <span>+</span>
          <span>+</span>
          <span>+</span>
        </div>
        <strong>
          GOOD
          <br />
          IN ACTION.
        </strong>
        <div className="poster-caption">
          <span>ImpactHub</span>
          <span>CONNECTED FOR A REASON ↗</span>
        </div>
      </div>
    );
  if (type === "neatify")
    return (
      <div className="poster poster-neatify">
        <div className="poster-eyebrow">A LITTLE LESS DIGITAL CHAOS.</div>
        <div className="paper-stack">
          <div>
            01 <span>DOCUMENTS</span>
          </div>
          <div>
            02 <span>IDEAS</span>
          </div>
          <div>
            03 <span>EVERYTHING ELSE</span>
          </div>
        </div>
        <strong>
          A place for
          <br />
          <em>everything.</em>
        </strong>
        <div className="poster-caption">
          <span>Neatify</span>
          <span>MAKE ROOM FOR WHAT MATTERS ↗</span>
        </div>
      </div>
    );
  if (type === "gurukul")
    return (
      <div className="poster poster-gurukul">
        <div className="poster-eyebrow">A MORE CONNECTED CAMPUS.</div>
        <div className="campus-flower">✳</div>
        <strong>
          Present.
          <br />
          And protected.
        </strong>
        <div className="poster-caption">
          <span>Gurukul</span>
          <span>ATTENDANCE / STUDENT SAFETY ↗</span>
        </div>
      </div>
    );
  return (
    <div className="poster poster-demox">
      <div className="poster-eyebrow">AN IDENTITY THAT DOESN’T SIT STILL.</div>
      <div className="demox-type" aria-hidden="true">
        M<br />
        <span>O</span>
        <br />V<br />E
      </div>
      <strong>
        Made
        <br />
        to move.
      </strong>
      <div className="poster-caption">
        <span>Demox</span>
        <span>DESIGN, IN ANOTHER DIMENSION ↗</span>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [menu, setMenu] = useState(false);
  const [motion, toggleMotion] = useMotionPreference();
  const [copied, setCopied] = useState(false);
  const [palette, setPalette] = useState(0);
  const [iteration, setIteration] = useState(0);
  const [loaderComplete, setLoaderComplete] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dy-accent-color");
      if (stored) {
        document.documentElement.style.setProperty("--blue", stored);
        window.dispatchEvent(new CustomEvent("dy-palette", { detail: stored }));
      }
    } catch {}
  }, []);

  function changePalette(element?: HTMLElement) {
    playSfx("accent");
    window.dispatchEvent(new CustomEvent("dy-open-color-picker"));
    if (element) discover("palette", element);
  }

  async function copy() {
    playSfx("click");
    try {
      await navigator.clipboard.writeText("dy3239073@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      location.href = "mailto:dy3239073@gmail.com";
    }
  }

  return (
    <div className="editorial-site">
      {!loaderComplete && <Loader onComplete={() => setLoaderComplete(true)} />}
      <SmoothScroll enabled={motion} />
      <EditorialMotion enabled={motion} />
      {/* <Playground motion={motion} /> */}
      <FloatingDock onPaletteChange={(e) => changePalette(e.currentTarget)} />

      <a className="skip-link" href="#work">
        Skip to work
      </a>

      <div id="smooth-wrapper">
        <div id="smooth-content">
          <header className="personal-nav">
            <a
              href="#top"
              className="personal-logo"
              aria-label="Deepanshu Yadav home"
            >
              dy<span>↗</span>
            </a>
            {/* <span className="nav-caption">
              A DEVELOPER’S PERSONAL CORNER OF THE INTERNET.
            </span> */}
            <nav
              aria-label="Main navigation"
              className={menu ? "personal-links is-open" : "personal-links"}
            >
              <a
                href="#work"
                onClick={() => {
                  setMenu(false);
                  playSfx("nav");
                }}
              >
                Work <sup>04</sup>
              </a>
              <a
                href="#person"
                onClick={() => {
                  setMenu(false);
                  playSfx("nav");
                }}
              >
                The person
              </a>
              <a
                href="#experience"
                onClick={() => {
                  setMenu(false);
                  playSfx("nav");
                }}
              >
                Journey
              </a>
              <a
                href="#hello"
                onClick={() => {
                  setMenu(false);
                  playSfx("nav");
                }}
              >
                Say hello ↗
              </a>
            </nav>
            <button
              className="personal-menu"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              onClick={() => {
                setMenu(!menu);
                playSfx("nav");
              }}
            >
              {menu ? "Close −" : "Menu +"}
            </button>
          </header>

          <main>
            <section id="top" className="identity-hero">
              {/* <div className="identity-topline">
                <span>FRONTEND & FULL-STACK DEVELOPER</span>
                <span>BASED IN INDIA / BUILDING EVERYWHERE</span>
              </div> */}
              <h1 className="identity-name" aria-label="DEEPANSHU YADAV.">
                <span className="name-first" aria-hidden="true">
                  {"DEEPANSHU".split("").map((char, i) => (
                    <span
                      key={i}
                      className="name-char"
                      data-char={char}
                      style={{ "--char-i": i } as React.CSSProperties}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="name-last" aria-hidden="true">
                  {"YADAV".split("").map((char, i) => (
                    <span
                      key={i}
                      className="name-char"
                      data-char={char}
                      style={{ "--char-i": 9 + i } as React.CSSProperties}
                    >
                      {char}
                    </span>
                  ))}
                  <button
                    className="name-dot"
                    aria-label="Change the accent color"
                    
                  >
                    .
                  </button>
                </span>
              </h1>
              <div className="identity-object">
                <div className="identity-object-visual">
                  <Monogram motion={motion} />
                </div>
                {/* <span className="object-caption">
                  A LITTLE PLAY. A LOT OF INTENT.
                </span> */}
                {/* <span className="object-coordinate">
                  FIG. 01 — PERSONAL EXPERIMENT
                </span> */}
              </div>
              <div className="hero-personal-note">
                <button
                  className="spark-button"
                  aria-label="Find a little spark"
                  onClick={(e) => discover("spark", e.currentTarget)}
                >
                  <span className="note-asterisk">✳</span>
                </button>
                {/* <p>
                  Not a studio.
                  <br />
                  Not a team of twenty.
                  <br />
                  <b>Just me, making things.</b>
                </p> */}
              </div>
              <div className="identity-bottom">
                {/* <p>
                  I turn curious ideas into things
                  <br />
                  you can click, use, and feel.
                </p> */}
                {/* <a className="round-link" href="#work">
                  <span>TAKE A LOOK AROUND</span>
                  <i>↓</i>
                </a> */}
                {/* <span className="current-note">
                  <i /> CURRENTLY: FRONTEND @ IIT MANDI
                </span> */}
              </div>
              <span className="hero-side-note">
                SCROLL. THERE’S MORE TO ME.
              </span>
            </section>

            <section className="manifesto" aria-label="My approach">
              <div className="manifesto-glow" aria-hidden="true" />
              <div className="manifesto-label">A SMALL INTRODUCTION</div>
              <p className="manifesto-text">
                The internet has enough
                <br />
                ordinary.{" "}
                <span>
                  I’d rather make
                  <br />
                  something you <em>feel.</em>
                </span>
              </p>
              <div className="manifesto-bottom">
                <span>THOUGHTFULLY ENGINEERED.</span>
                <span>SLIGHTLY OBSESSED WITH THE DETAILS. ↘</span>
              </div>
            </section>

            <section id="work" className="work-gallery">
              <div className="gallery-pin">
                <div className="gallery-heading">
                  <div>
                    <span className="section-id">
                      01 / THINGS I’VE PUT INTO THE WORLD
                    </span>
                    <h2>
                      Proof of <em>curiosity.</em>
                    </h2>
                  </div>
                  <div className="gallery-index">
                    <span className="gallery-count">01</span>
                    <span>/ 04</span>
                    <i>↗</i>
                  </div>
                </div>
                <div className="project-rail">
                  {projects.map((p, i) => (
                    <article
                      className={`editorial-project project-${p.type}`}
                      key={p.type}
                    >
                      <Link
                        className="poster-link"
                        href={`/work/${p.type}`}
                        aria-label={`Explore ${p.name}`}
                      >
                        <ProjectArt type={p.type} />
                        <span className="poster-open">VIEW PROJECT ↗</span>
                      </Link>
                      <div className="editorial-project-info">
                        <span className="project-index">0{i + 1}</span>
                        <div>
                          <h3>
                            <Link href={`/work/${p.type}`}>{p.name}</Link>
                          </h3>
                          <p>{p.description}</p>
                          <div className="project-tech">
                            {p.stack.join(" / ")}
                          </div>
                        </div>
                        <span className="project-category">{p.category}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="gallery-bottom">
                  <span>SELECTED WORK / WEB · MOBILE · DESKTOP · 3D</span>
                  <div className="gallery-meter">
                    <i />
                  </div>
                  <a
                    href="https://github.com/Deepanshu0211"
                    target="_blank"
                    rel="noreferrer"
                  >
                    THE REST LIVES ON GITHUB ↗
                  </a>
                </div>
              </div>
            </section>

            <section id="person" className="person-section">
              <div className="person-title">
                <span className="section-id">
                  02 / THERE’S A PERSON IN HERE
                </span>
                <h2>
                  Code is what I do.
                  <br />
                  <em>Curiosity</em> is who I am.
                </h2>
              </div>
              <div className="person-layout">
                <div className="sticky-card-col">
                  <PersonalCard />
                </div>
                <div className="person-copy">
                  <h3>
                    Hey, I’m Deepanshu Yadav.
                    <br />I like figuring things out.
                    <br />
                    Then making them feel right.
                  </h3>
                  <p>
                    I’m studying Information Technology at Chandigarh
                    University, while building real products across web, mobile,
                    and desktop.
                  </p>
                  <p>
                    Right now, I’m contributing to IIT Mandi’s AcadLMS. Before
                    that, I worked across full-stack development at Ethixweb and
                    an AI-driven investment platform at QSentia.
                  </p>
                  <p>
                    I’m drawn to the space where engineering meets expression. A
                    useful tool. An unexpected interaction. That tiny detail you
                    might not notice, but would miss if it wasn’t there.
                  </p>
                  <a
                    className="editorial-text-link"
                    href="/Deepanshu-Yadav-Resume.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    A more formal introduction <span>Résumé ↗</span>
                  </a>
                  <div className="personal-details">
                    <span>INDIA</span>
                    <span>B.TECH · IT</span>
                    <span>CLASS OF 2030</span>
                  </div>
                </div>
              </div>
              {/* <div className="obsession-line">
                <span>THINGS I COME BACK TO</span>
                <p>
                  Clean code. <em>Good motion.</em> Useful ideas.{" "}
                  <span>One more iteration.</span>
                </p>
              </div> */}
            </section>

            <section className="journey-section" id="experience">
              <div className="journey-heading">
                <span className="section-id">03 / EXPERIENCE</span>
                <h2>
                  The path <em>so far.</em>
                </h2>
                <p>
                  Not a straight line. Every place taught me something different
                  about engineering, design, and what it actually takes to ship.
                </p>
              </div>
              <div className="journey-list">
                {[
                  {
                    num: "01",
                    company: "IIT Mandi",
                    period: "Jul 2026 — Present",
                    role: "Frontend Developer · AcadLMS",
                    desc: "Contributing to the frontend development of AcadLMS, an enterprise academic management platform actively serving 1,000+ students and faculty.",
                  },
                  {
                    num: "02",
                    company: "Ethixweb",
                    period: "Aug 2026 — Sep 2026",
                    role: "Full Stack Developer Intern",
                    desc: "Built scalable web apps with React, Node.js, and MongoDB. Optimized databases, streamlined REST APIs, and improved application load times by 25%.",
                  },
                  {
                    num: "03",
                    company: "QSentia",
                    period: "May 2026 — Jul 2026",
                    role: "Software Development Intern",
                    desc: "Developed an AI-powered financial research platform using TypeScript and Next.js. Engineered interactive data dashboards and real-time visualization interfaces.",
                  },
                ].map((item) => (
                  <article key={item.num} className="journey-item">
                    <span>{item.num}</span>
                    <div>
                      <small>{item.period}</small>
                      <h4>{item.role}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="toolbelt" aria-label="Tools and technologies">
              <span className="section-id">
                MY TOOLBELT, NOT MY PERSONALITY.
              </span>
              <div className="toolbelt-marquee-wrapper">
                <div className="toolbelt-marquee-track">
                  {["React", "Next.js", "TypeScript", "Three.js", "Rust", "Tailwind", "Node.js", "GSAP"].map((tool, i) => (
                    <span key={i} className="toolbelt-item">
                      <span className="toolbelt-word">{tool}</span>
                      <i className="toolbelt-asterisk" aria-hidden="true">✳</i>
                    </span>
                  ))}
                </div>
                <div className="toolbelt-marquee-track" aria-hidden="true">
                  {["React", "Next.js", "TypeScript", "Three.js", "Rust", "Tailwind", "Node.js", "GSAP"].map((tool, i) => (
                    <span key={`dup-${i}`} className="toolbelt-item">
                      <span className="toolbelt-word">{tool}</span>
                      <i className="toolbelt-asterisk" aria-hidden="true">✳</i>
                    </span>
                  ))}
                </div>
              </div>
              <div className="toolbelt-detail">
                <span>ALSO IN THE MIX</span>
                <p>
                  React Native · Node.js · Firebase · Supabase · PostgreSQL ·
                  Tauri · GSAP
                </p>
              </div>
            </section>

            <section id="hello" className="hello-section">
              <div className="hello-top">
                <span className="section-id">
                  04 / NO CONTACT FORM. JUST A CONVERSATION.
                </span>
                <span>YOUR NEXT IDEA STARTS HERE ↙</span>
              </div>
              <a className="hello-title" href="mailto:dy3239073@gmail.com">
                <span>LET’S MAKE</span>
                <span>
                  <em>SOMETHING.</em>
                  <i>↗</i>
                </span>
              </a>
              <div className="hello-bottom">
                <div>
                  <p>A project, a question, or a very good idea.</p>
                  <a href="mailto:dy3239073@gmail.com">dy3239073@gmail.com</a>
                  <button onClick={copy} aria-label="Copy email address">
                    {copied ? "COPIED ✓" : "COPY ↗"}
                  </button>
                  <span role="status" className="sr-only">
                    {copied ? "Email address copied" : ""}
                  </span>
                </div>
                <div className="personal-socials">
                  <a
                    href="https://github.com/Deepanshu0211"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub ↗
                  </a>
                  <a
                    href="https://www.linkedin.com/in/deepanshuyad/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn ↗
                  </a>
                  <a href="/Deepanshu-Yadav-Resume.pdf" download>
                    Résumé ↗
                  </a>
                </div>
              </div>
            </section>
          </main>

       
        </div>
      </div>

      {/* <button
        className="editorial-motion-toggle"
        onClick={toggleMotion}
        aria-pressed={motion}
        aria-label="Enable animated motion"
      >
        {motion ? "◌ MOTION ON" : "○ MOTION OFF"}
      </button> */}
    </div>
  );
}
