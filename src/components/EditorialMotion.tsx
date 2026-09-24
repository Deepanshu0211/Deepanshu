"use client";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MicroInteractions from "@/components/MicroInteractions";
import { playSfx } from "@/components/sfx";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
gsap.registerPlugin(
  ScrollTrigger,
  SplitText,
  CustomEase,
  ScrambleTextPlugin,
);
function subscribe(fn: () => void) {
  const q = matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", fn);
  return () => q.removeEventListener("change", fn);
}
export default function EditorialMotion({ enabled }: { enabled: boolean }) {
  const cursor = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(
    subscribe,
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  useLayoutEffect(() => {
    const cleanups: (() => void)[] = [];
    const media = gsap.matchMedia();
    let live = true;
    const ctx = gsap.context(() => {
      CustomEase.create("personal", "0.16, 1, 0.3, 1");
      document.documentElement.classList.add("is-smooth");
      const introDelay = location.hash ? 0 : 0;
      const siteStartDelay = location.hash ? 0 : 0;

      const nameChars = document.querySelectorAll<HTMLElement>(
        ".identity-name .name-char",
      );
      if (nameChars.length > 0) {
        gsap.from(nameChars, {
          yPercent: 120,
          rotation: (i) => (i % 2 === 0 ? 8 : -8),
          scale: 0.8,
          opacity: 0,
          stagger: 0.04,
          duration: 1.5,
          delay: siteStartDelay + 0.1,
          ease: "personal",
        });
      }
      gsap.from(".identity-object-visual", {
        scale: 0.55,
        x: 170,
        rotation: 35,
        opacity: 0,
        duration: 2.6,
        delay: siteStartDelay + 0.2,
        ease: "personal",
      });
      gsap.from(".identity-topline,.hero-personal-note,.identity-bottom", {
        y: 30,
        opacity: 0,
        duration: 1.8,
        stagger: 0.13,
        delay: siteStartDelay + 0.35,
        ease: "personal",
      });
      SplitText.create(".manifesto-text", {
        type: "words",
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.22, y: 12, filter: "blur(3px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              stagger: 0.08,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".manifesto",
                start: "top 80%",
                end: "center 42%",
                scrub: 0.8,
              },
            },
          );
        },
      });
      document
        .querySelectorAll<HTMLElement>(
          ".gallery-heading h2,.person-title h2,.journey-heading h2,.hello-title>span",
        )
        .forEach((h) =>
          SplitText.create(h, {
            type: "lines,words",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.words, {
                yPercent: 115,
                rotation: 5,
                duration: 1.8,
                stagger: 0.09,
                ease: "personal",
                scrollTrigger: { trigger: h, start: "top 92%", once: true },
              });
            },
          }),
        );
      gsap.from(".personal-card-3d-wrapper", {
        rotation: 8,
        y: 60,
        opacity: 0,
        duration: 1.8,
        ease: "personal",
        scrollTrigger: {
          trigger: ".person-section",
          start: "top 85%",
          once: true,
        },
      });
      gsap.from(".person-copy>*", {
        y: 35,
        opacity: 0,
        duration: 1.5,
        stagger: 0.13,
        ease: "personal",
        scrollTrigger: {
          trigger: ".person-copy",
          start: "top 88%",
          once: true,
        },
      });
      document.querySelectorAll(".story-chapter").forEach((chapter, i) => {
        gsap.from(chapter, {
          y: 35,
          opacity: 0,
          duration: 1.5,
          delay: i * 0.12,
          ease: "personal",
          scrollTrigger: { trigger: chapter, start: "top 88%", once: true },
        });
      });

      gsap.to(".note-asterisk", {
        rotation: 220,
        ease: "none",
        scrollTrigger: {
          trigger: ".identity-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      media.add("(min-width: 900px)", () => {
        const gallery = document.querySelector<HTMLElement>(".work-gallery")!,
          rail = document.querySelector<HTMLElement>(".project-rail")!;
        gallery.classList.add("horizontal-ready");
        const travel = () => Math.max(0, rail.scrollWidth - window.innerWidth);
        const galleryTween = gsap.to(rail, {
          x: () => -travel(),
          ease: "none",
          scrollTrigger: {
            trigger: gallery,
            start: "top top",
            end: () => `+=${travel() + 350}`,
            pin: ".gallery-pin",
            scrub: 0.65,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate(self) {
              const counter = document.querySelector(".gallery-count");
              if (counter)
                counter.textContent = `0${Math.min(4, Math.floor(self.progress * 4) + 1)}`;
              gsap.set(".gallery-meter i", {
                scaleX: 0.25 + self.progress * 0.75,
              });
            },
          },
        });
        const revealFocusedProject = (event: FocusEvent) => {
          const target = event.target;
          if (
            !(target instanceof HTMLElement) ||
            !target.matches(":focus-visible")
          )
            return;
          const card = target.closest<HTMLElement>(".editorial-project");
          const trigger = galleryTween.scrollTrigger;
          if (!card || !trigger || !travel()) return;
          const progress = Math.min(
            1,
            Math.max(
              0,
              (card.offsetLeft - window.innerWidth * 0.06) / travel(),
            ),
          );
          trigger.scroll(
            trigger.start + progress * (trigger.end - trigger.start),
          );
        };
        rail.addEventListener("focusin", revealFocusedProject);
        gsap.fromTo(
          ".gallery-pin",
          { clipPath: "inset(0 4% 0 4% round 50px)" },
          {
            clipPath: "inset(0 0% 0 0% round 0px)",
            ease: "none",
            scrollTrigger: {
              trigger: gallery,
              start: "top bottom",
              end: "top top",
              scrub: 1,
            },
          },
        );
        gsap.to(".name-first", {
          xPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: ".identity-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
        gsap.to(".name-last", {
          xPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: ".identity-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
        gsap.to(".identity-object", {
          y: 130,
          rotation: 18,
          ease: "none",
          scrollTrigger: {
            trigger: ".identity-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
          },
        });
        return () => {
          rail.removeEventListener("focusin", revealFocusedProject);
          gallery.classList.remove("horizontal-ready");
          const counter = document.querySelector(".gallery-count");
          if (counter) counter.textContent = "01";
        };
      });
      media.add("(max-width: 899px)", () => {
        document.querySelectorAll(".editorial-project").forEach((card) =>
          gsap.from(card, {
            y: 70,
            opacity: 0,
            duration: 1.9,
            ease: "personal",
            scrollTrigger: { trigger: card, start: "top 90%", once: true },
          }),
        );
      });
      gsap.to(".impact-globe", {
        rotation: 15,
        duration: 7,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        scrollTrigger: {
          trigger: ".work-gallery",
          toggleActions: "play pause resume pause",
        },
      });
      gsap.to(".paper-stack", {
        rotation: 10,
        y: -10,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        scrollTrigger: {
          trigger: ".work-gallery",
          toggleActions: "play pause resume pause",
        },
      });
      gsap.to(".campus-flower", {
        rotation: 180,
        duration: 16,
        ease: "none",
        repeat: -1,
        scrollTrigger: {
          trigger: ".work-gallery",
          toggleActions: "play pause resume pause",
        },
      });
      gsap.to(".demox-type", {
        y: -70,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        scrollTrigger: {
          trigger: ".work-gallery",
          toggleActions: "play pause resume pause",
        },
      });
      media.add("(hover: hover) and (pointer: fine)", () => {
        const x = gsap.quickTo(cursor.current, "x", {
            duration: 0.25,
            ease: "power3",
          }),
          y = gsap.quickTo(cursor.current, "y", {
            duration: 0.25,
            ease: "power3",
          });
        const pointer = (e: PointerEvent) => {
          x(e.clientX);
          y(e.clientY);
        };
        window.addEventListener("pointermove", pointer);
        const localCleanups: (() => void)[] = [];
        document
          .querySelectorAll<HTMLElement>(".poster-link")
          .forEach((card) => {
            const enter = () => {
              gsap.to(cursor.current, { opacity: 1, scale: 1, duration: 0.4 });
              gsap.to(card.querySelector(".poster"), {
                scale: 1.025,
                duration: 1.2,
                ease: "personal",
              });
            };
            const leave = () => {
              gsap.to(cursor.current, {
                opacity: 0,
                scale: 0.3,
                duration: 0.4,
              });
              gsap.to(card.querySelector(".poster"), {
                scale: 1,
                duration: 1.2,
                ease: "personal",
              });
            };
            card.addEventListener("pointerenter", enter);
            card.addEventListener("pointerleave", leave);
            localCleanups.push(() => {
              card.removeEventListener("pointerenter", enter);
              card.removeEventListener("pointerleave", leave);
              gsap.killTweensOf(card.querySelector(".poster"));
              gsap.set(card.querySelector(".poster"), {
                clearProps: "transform",
              });
            });
          });
        const cleanup = () => {
          window.removeEventListener("pointermove", pointer);
          localCleanups.forEach((fn) => fn());
          gsap.killTweensOf(cursor.current);
          gsap.set(cursor.current, { opacity: 0 });
        };
        cleanups.push(cleanup);
        return cleanup;
      });
      ScrollTrigger.refresh();
    });
    document.fonts.ready.then(() => {
      if (live) ScrollTrigger.refresh();
    });
    return () => {
      live = false;
      cleanups.forEach((fn) => fn());
      media.revert();
      ctx.revert();
    };
  }, [enabled, reduced]);
  return (
    <>
      <MicroInteractions enabled={enabled && !reduced} />
      <div className="editorial-cursor" ref={cursor} aria-hidden="true">
        LET’S
        <br />
        LOOK ↗
      </div>
    </>
  );
}
