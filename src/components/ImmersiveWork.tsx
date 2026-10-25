"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/data/portfolio";
import ProjectCover from "./ProjectCover";
import styles from "./ImmersiveWork.module.css";

gsap.registerPlugin(ScrollTrigger);

const sceneColors = ["#8f9d7d", "#a99ad2", "#d9824d", "#8b79be"];

export default function ImmersiveWork({ enabled }: { enabled: boolean }) {
  const section = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = section.current;
    if (!root) return;

    const slides = gsap.utils.toArray<HTMLElement>("[data-project-slide]", root);
    const setActive = (index: number) => {
      const counter = root.querySelector<HTMLElement>("[data-project-count]");
      if (counter) counter.textContent = `0${index + 1}`;
      root.querySelectorAll<HTMLElement>("[data-project-dot]").forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle(styles.active, active);
        dot.setAttribute("aria-current", active ? "step" : "false");
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if (root.classList.contains(styles.enhanced)) return;
      const best = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) setActive(slides.indexOf(best.target as HTMLElement));
    }, { threshold: [0.25, 0.5, 0.75] });
    slides.forEach((slide) => observer.observe(slide));

    if (!enabled) return () => {
      observer.disconnect();
    };

    const media = gsap.matchMedia();
    media.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
      const track = root.querySelector<HTMLElement>("[data-project-track]");
      if (!track || slides.length < 2) return;

      root.classList.add(styles.enhanced);
      const travel = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -travel(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${window.innerHeight * (slides.length - 1)}`,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate(self) {
            setActive(Math.min(slides.length - 1, Math.round(self.progress * (slides.length - 1))));
          },
        },
      });

      return () => {
        root.classList.remove(styles.enhanced);
      };
    });

    return () => {
      observer.disconnect();
      media.revert();
    };
  }, [enabled]);

  return (
    <section
      ref={section}
      className={styles.workGallery}
      id="work"
      aria-labelledby="work-title"
      style={{ "--slide-count": projects.length } as CSSProperties}
    >
      <div className={styles.stage}>
        <header className={styles.galleryHeader}>
          <div>
            <span className={styles.kicker}>02 / SELECTED WORK</span>
            <h2 id="work-title" data-motion-static>A few worlds,<br /><em>made real.</em></h2>
          </div>
          <div className={styles.galleryMeta}>
            <span>WEB · DESKTOP · MOBILE · 3D</span>
            <span className={styles.counter}><i data-project-count>01</i> / 0{projects.length}</span>
          </div>
        </header>

        <div className={styles.track} data-project-track>
          {projects.map((project, index) => (
            <article
              className={styles.slide}
              key={project.type}
              data-project-slide
              style={{ "--scene-color": sceneColors[index % sceneColors.length] } as CSSProperties}
            >
              <div className={styles.sceneGlow} aria-hidden="true" />
              <div className={styles.projectIndex}>PROJECT 0{index + 1}<span> / 0{projects.length}</span></div>
              <Link href={`/work/${project.type}`} className={styles.artLink} aria-label={`Open ${project.name} case study`}>
                <div className={styles.artwork} data-project-art>
                  <ProjectCover type={project.type} immersive />
                </div>
                <span className={styles.openProject}>EXPLORE PROJECT <i>↗</i></span>
              </Link>
              <div className={styles.projectTitle}>
                <span>{project.category}</span>
                <h3>{project.name}</h3>
                <p>{project.tagline}</p>
              </div>
              <div className={styles.sceneCoordinates}>INDIA / EARTH<br />{project.stack.slice(0, 3).join(" · ")}</div>
            </article>
          ))}
        </div>

        <footer className={styles.galleryFooter}>
          <span>SCROLL TO EXPLORE <i>↓</i></span>
          <div className={styles.projectNav} aria-hidden="true">
            {projects.map((project, index) => (
              <span
                key={project.type}
                data-project-dot
                data-project-index={index}
                className={index === 0 ? styles.active : ""}
              >
                <span>0{index + 1}</span>
              </span>
            ))}
          </div>
          <a href="https://github.com/Deepanshu0211" target="_blank" rel="noreferrer">MORE ON GITHUB <i>↗</i></a>
        </footer>
      </div>
    </section>
  );
}
