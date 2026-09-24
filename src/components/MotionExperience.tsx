"use client";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(
  ScrollTrigger,
  SplitText,
  DrawSVGPlugin,
  ScrambleTextPlugin,
  CustomEase,
);
function subscribeMotion(callback: () => void) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
export default function MotionExperience({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  const intro = useRef<HTMLDivElement>(null),
    cursor = useRef<HTMLDivElement>(null),
    introTimeline = useRef<gsap.core.Timeline | null>(null),
    played = useRef(false);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  useLayoutEffect(() => {
    if (!enabled || reduced) return;
    const cleanups: (() => void)[] = [];
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      CustomEase.create("race", "0.16, 1, 0.3, 1");
      let returning = played.current;
      try {
        returning ||= sessionStorage.getItem("dy-intro") === "seen";
      } catch {
        /* Storage is optional. */
      }
      const delay = returning ? 0 : 1.1;
      if (!returning && !location.hash) {
        gsap.set(intro.current, { display: "grid", autoAlpha: 1 });
        introTimeline.current = gsap
          .timeline({
            onComplete: () => {
              played.current = true;
              try {
                sessionStorage.setItem("dy-intro", "seen");
              } catch {}
            },
          })
          .fromTo(
            ".start-lights i",
            { backgroundColor: "#343831", scale: 0.6 },
            {
              backgroundColor: "#ed552d",
              scale: 1,
              stagger: 0.12,
              duration: 0.35,
              ease: "back.out(2)",
            },
            0,
          )
          .from(
            ".intro-word",
            { yPercent: 110, duration: 0.85, ease: "race" },
            0.15,
          )
          .to(
            ".intro-rule",
            { scaleX: 1, duration: 1.1, ease: "power2.inOut" },
            0,
          )
          .to(
            ".start-lights i",
            { backgroundColor: "#c9e1a9", duration: 0.12, stagger: 0.03 },
            1.05,
          )
          .to(
            ".intro-inner",
            { y: -70, opacity: 0, duration: 0.55, ease: "power3.in" },
            1.15,
          )
          .to(
            intro.current,
            { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "race" },
            1.35,
          )
          .set(intro.current, { autoAlpha: 0, display: "none" }, 2.5);
      }
      const headline = document.querySelector(".hero-copy h1");
      if (headline)
        SplitText.create(headline, {
          type: "lines,chars",
          mask: "lines",
          autoSplit: true,
          charsClass: "hero-char",
          onSplit(self) {
            return gsap.from(self.chars, {
              yPercent: 115,
              rotationX: -85,
              opacity: 0,
              stagger: 0.025,
              duration: 1.55,
              delay,
              ease: "race",
            });
          },
        });
      gsap.from(".hero-kicker, .hero-copy > p, .hero-copy > .solid-button", {
        y: 24,
        opacity: 0,
        duration: 1.6,
        delay: delay + 0.25,
        stagger: 0.12,
        ease: "race",
      });
      gsap.from(".car-stage", {
        x: 140,
        rotation: -7,
        opacity: 0,
        duration: 2.3,
        delay: delay + 0.1,
        ease: "race",
      });
      gsap.from(".hero-top, .hero-bottom", {
        opacity: 0,
        duration: 1.5,
        delay: delay + 0.4,
      });
      gsap.to(".scroll-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      });
      document
        .querySelectorAll<HTMLElement>(
          ".section-heading h2, .about-copy h2, .contact h2",
        )
        .forEach((heading) => {
          SplitText.create(heading, {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.words, {
                yPercent: 115,
                rotation: 3,
                duration: 1.75,
                stagger: 0.065,
                ease: "race",
                scrollTrigger: {
                  trigger: heading,
                  start: "top 91%",
                  once: true,
                },
              });
            },
          });
        });
      document
        .querySelectorAll<HTMLElement>(".project-card")
        .forEach((card, index) => {
          const image = card.querySelector(".project-image");
          gsap.from(image, {
            clipPath: "inset(18% 0 18% 0)",
            scale: 0.9,
            opacity: 0.25,
            duration: 2.15,
            ease: "race",
            scrollTrigger: { trigger: card, start: "top 93%", once: true },
            delay: (index % 2) * 0.12,
          });
          gsap.from(
            card.querySelectorAll(".project-heading, p, .tags, .case-link"),
            {
              y: 25,
              opacity: 0,
              duration: 1.3,
              stagger: 0.1,
              ease: "race",
              scrollTrigger: { trigger: card, start: "top 85%", once: true },
            },
          );
        });
      gsap.from(".track-art path", {
        drawSVG: "0%",
        duration: 2.8,
        ease: "power2.inOut",
        scrollTrigger: { trigger: ".about-art", start: "top 80%", once: true },
      });
      gsap.from(".track-marker", {
        scale: 0,
        rotation: -35,
        duration: 1.4,
        ease: "elastic.out(1,.5)",
        scrollTrigger: {
          trigger: ".about-art",
          start: "center 80%",
          once: true,
        },
      });
      gsap.to(".scramble-label", {
        duration: 2.2,
        scrambleText: {
          text: "FORM MEETS FUNCTION",
          chars: "01/—",
          revealDelay: 0.3,
          speed: 0.4,
        },
        delay,
      });
      document
        .querySelectorAll(
          ".experience-row, .tool, .credentials > div, .about-facts > div",
        )
        .forEach((el, index) =>
          gsap.from(el, {
            y: 45,
            opacity: 0,
            duration: 1.7,
            delay: (index % 3) * 0.09,
            ease: "race",
            scrollTrigger: { trigger: el, start: "top 94%", once: true },
          }),
        );
      gsap.from(".contact-arrow", {
        scale: 0.15,
        rotation: -120,
        duration: 2.4,
        ease: "elastic.out(1,.7)",
        scrollTrigger: { trigger: ".contact", start: "top 80%", once: true },
      });
      gsap.to(".chrome-orb", {
        rotation: 30,
        borderRadius: "65% 35% 60% 40% / 40% 60% 35% 65%",
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: ".demox",
          toggleActions: "play pause resume pause",
        },
      });
      gsap.to(".map .pin", {
        scale: 1.5,
        opacity: 0.5,
        duration: 1.3,
        stagger: 0.35,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: ".impact",
          toggleActions: "play pause resume pause",
        },
      });
      gsap.to(".phone", {
        y: -12,
        rotation: 4,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        scrollTrigger: {
          trigger: ".gurukul",
          toggleActions: "play pause resume pause",
        },
      });
      mm.add("(min-width: 900px)", () => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".hero-content",
              start: "top 86px",
              end: "+=500",
              pin: true,
              scrub: 1.5,
              anticipatePin: 1,
            },
          })
          .to(
            ".hero-copy",
            { y: -65, opacity: 0.2, duration: 3, ease: "none" },
            0,
          )
          .to(".car-watermark", { x: -80, opacity: 0.3, duration: 3 }, 0)
          .to(".car-callout", { y: -20, duration: 3 }, 0);
        gsap.to(".principles-track", {
          xPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: ".principles",
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        });
        gsap.to(".about-art", {
          y: -22,
          ease: "none",
          scrollTrigger: {
            trigger: ".about",
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        });
      });
      mm.add("(hover: hover) and (pointer: fine)", () => {
        const moveX = gsap.quickTo(cursor.current, "x", {
          duration: 0.35,
          ease: "power3",
        });
        const moveY = gsap.quickTo(cursor.current, "y", {
          duration: 0.35,
          ease: "power3",
        });
        const pointer = (e: PointerEvent) => {
          moveX(e.clientX);
          moveY(e.clientY);
        };
        window.addEventListener("pointermove", pointer);
        cleanups.push(() => window.removeEventListener("pointermove", pointer));
        document
          .querySelectorAll<HTMLElement>(".project-image")
          .forEach((card) => {
            const enter = () =>
              gsap.to(cursor.current, { opacity: 1, scale: 1, duration: 0.4 });
            const leave = () => {
              gsap.to(cursor.current, {
                opacity: 0,
                scale: 0.3,
                duration: 0.4,
              });
              gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                duration: 1.2,
                ease: "elastic.out(1,.7)",
              });
            };
            const tilt = (e: PointerEvent) => {
              const r = card.getBoundingClientRect();
              gsap.to(card, {
                rotationY: ((e.clientX - r.left) / r.width - 0.5) * 8,
                rotationX: -((e.clientY - r.top) / r.height - 0.5) * 8,
                transformPerspective: 1000,
                duration: 0.8,
                ease: "power3.out",
                overwrite: "auto",
              });
            };
            card.addEventListener("pointerenter", enter);
            card.addEventListener("pointerleave", leave);
            card.addEventListener("pointermove", tilt);
            cleanups.push(() => {
              card.removeEventListener("pointerenter", enter);
              card.removeEventListener("pointerleave", leave);
              card.removeEventListener("pointermove", tilt);
              gsap.killTweensOf(card);
              gsap.set(card, { clearProps: "transform" });
            });
          });
        document
          .querySelectorAll<HTMLElement>(
            ".solid-button, .contact-arrow, .header-contact",
          )
          .forEach((button) => {
            const move = (e: PointerEvent) => {
              const r = button.getBoundingClientRect();
              gsap.to(button, {
                x: (e.clientX - r.left - r.width / 2) * 0.15,
                y: (e.clientY - r.top - r.height / 2) * 0.2,
                duration: 0.6,
                ease: "power3.out",
                overwrite: "auto",
              });
            };
            const leave = () =>
              gsap.to(button, {
                x: 0,
                y: 0,
                duration: 1.2,
                ease: "elastic.out(1,.45)",
              });
            button.addEventListener("pointermove", move);
            button.addEventListener("pointerleave", leave);
            cleanups.push(() => {
              button.removeEventListener("pointermove", move);
              button.removeEventListener("pointerleave", leave);
              gsap.killTweensOf(button);
              gsap.set(button, { clearProps: "transform" });
            });
          });
      });
      ScrollTrigger.refresh();
    });
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });
    return () => {
      alive = false;
      cleanups.forEach((cleanup) => cleanup());
      mm.revert();
      ctx.revert();
      introTimeline.current = null;
    };
  }, [enabled, reduced]);
  return (
    <>
      <div ref={intro} className="race-intro">
        <div className="intro-inner">
          <span className="eyebrow">DEEPANSHU YADAV / DIGITAL EXPERIENCES</span>
          <div className="start-lights" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} />
            ))}
          </div>
          <div className="intro-mask">
            <span className="intro-word">LIGHTS OUT.</span>
          </div>
          <p>LET’S MAKE SOMETHING MOVE.</p>
          <div className="intro-rule" />
        </div>
        <button
          className="skip-intro"
          onClick={() => introTimeline.current?.progress(1)}
        >
          Skip intro ↗
        </button>
      </div>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="view-cursor" ref={cursor} aria-hidden="true">
        VIEW
        <br />↗
      </div>
      <button
        className="motion-toggle"
        onClick={onToggle}
        disabled={reduced}
        aria-pressed={enabled && !reduced}
        aria-label="Enable animated motion"
      >
        <span
          className={
            enabled && !reduced ? "motion-bars running" : "motion-bars"
          }
        >
          <i />
          <i />
          <i />
          <i />
        </span>
        {enabled && !reduced ? "MOTION ON" : "MOTION OFF"}
      </button>
    </>
  );
}
