"use client";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { playSfx, unlockSfx } from "@/components/sfx";
export default function MicroInteractions({ enabled }: { enabled: boolean }) {
  const ring = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!enabled) return;
    const context = gsap.context(() => {});
    const fine = matchMedia("(hover:hover) and (pointer:fine)");
    let lastLetter: Element | null = null;
    const enter = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const letter = target.closest<HTMLElement>(".name-char");
      if (letter && letter !== lastLetter && fine.matches) {
        lastLetter = letter;
        unlockSfx();
        playSfx("hover");
        context.add(() => {
          gsap.killTweensOf(letter);
          gsap
            .timeline()
            .to(letter, {
              y: -24,
              scale: 1.15,
              rotation: gsap.utils.random(-8, 8),
              color: "var(--blue)",
              duration: 0.18,
              ease: "power2.out",
            })
            .to(letter, {
              y: 0,
              scale: 1,
              rotation: 0,
              color: "var(--ink)",
              duration: 0.85,
              ease: "elastic.out(1.2, 0.4)",
            });

          // Wave propagation to immediate siblings
          const prev = letter.previousElementSibling as HTMLElement | null;
          const next = letter.nextElementSibling as HTMLElement | null;
          if (prev && prev.classList.contains("name-char")) {
            gsap.killTweensOf(prev);
            gsap
              .timeline()
              .to(prev, {
                y: -10,
                scale: 1.05,
                rotation: gsap.utils.random(-4, 4),
                duration: 0.15,
                ease: "power2.out",
              })
              .to(prev, {
                y: 0,
                scale: 1,
                rotation: 0,
                duration: 0.65,
                ease: "elastic.out(1.1, 0.5)",
              });
          }
          if (next && next.classList.contains("name-char")) {
            gsap.killTweensOf(next);
            gsap
              .timeline()
              .to(next, {
                y: -10,
                scale: 1.05,
                rotation: gsap.utils.random(-4, 4),
                duration: 0.15,
                ease: "power2.out",
              })
              .to(next, {
                y: 0,
                scale: 1,
                rotation: 0,
                duration: 0.65,
                ease: "elastic.out(1.1, 0.5)",
              });
          }
        });
      }
      const helloTitle = target.closest<HTMLElement>(".hello-title");
      if (helloTitle && fine.matches && !helloTitle.contains(e.relatedTarget as Node)) {
        const arrow = helloTitle.querySelector<HTMLElement>("i");
        if (arrow) {
          context.add(() => {
            gsap.killTweensOf(arrow);
            gsap
              .timeline()
              .to(arrow, {
                scaleX: 1.4,
                scaleY: 0.6,
                x: -6,
                y: 6,
                rotate: -10,
                duration: 0.12,
                ease: "power2.in",
              })
              .to(arrow, {
                scaleX: 0.78,
                scaleY: 1.35,
                x: 28,
                y: -28,
                rotate: 8,
                duration: 0.3,
                ease: "back.out(2)",
              })
              .to(arrow, {
                scaleX: 1,
                scaleY: 1,
                x: 18,
                y: -18,
                rotate: 0,
                duration: 0.75,
                ease: "elastic.out(1.2, 0.4)",
              });
          });
        }
      }

      const link = target.closest<HTMLElement>(
        ".personal-links a,.personal-socials a,.editorial-text-link,.round-link,.personal-logo",
      );
      if (link && fine.matches && !link.contains(e.relatedTarget as Node)) {
        context.add(() =>
          gsap.to(link, { y: -2, duration: 0.3, ease: "power3.out" }),
        );
      }
    };
    const leave = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const helloTitle = target.closest<HTMLElement>(".hello-title");
      if (helloTitle && fine.matches && !helloTitle.contains(e.relatedTarget as Node)) {
        const arrow = helloTitle.querySelector<HTMLElement>("i");
        if (arrow) {
          context.add(() => {
            gsap.killTweensOf(arrow);
            gsap.to(arrow, {
              scaleX: 1,
              scaleY: 1,
              x: 0,
              y: 0,
              rotate: 0,
              duration: 0.6,
              ease: "elastic.out(1.1, 0.45)",
            });
          });
        }
      }
      const link = target.closest<HTMLElement>(
        ".personal-links a,.personal-socials a,.editorial-text-link,.round-link,.personal-logo",
      );
      if (link && fine.matches && !link.contains(e.relatedTarget as Node)) {
        context.add(() =>
          gsap.to(link, {
            x: 0,
            y: 0,
            duration: 0.65,
            ease: "elastic.out(1,.65)",
          }),
        );
      }
    };
    const move = (e: PointerEvent) => {
      if (!fine.matches) return;
      const target = e.target as HTMLElement,
        magnet = target.closest<HTMLElement>(".round-link i,.personal-logo");
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        context.add(() =>
          gsap.to(magnet, {
            x: (e.clientX - r.left - r.width / 2) * 0.14,
            y: (e.clientY - r.top - r.height / 2) * 0.14,
            duration: 0.45,
            ease: "power3.out",
            overwrite: "auto",
          }),
        );
      }
      const poster = target.closest<HTMLElement>(".poster-link");
      if (poster) {
        const r = poster.getBoundingClientRect();
        poster.style.setProperty(
          "--shine-x",
          `${((e.clientX - r.left) / r.width) * 100}%`,
        );
        poster.style.setProperty(
          "--shine-y",
          `${((e.clientY - r.top) / r.height) * 100}%`,
        );
      }
    };
    const press = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const letter = target.closest<HTMLElement>(".name-char");
      if (letter) {
        unlockSfx();
        playSfx("click");
        context.add(() => {
          gsap.killTweensOf(letter);
          gsap
            .timeline()
            .to(letter, {
              scaleY: 0.55,
              scaleX: 1.35,
              duration: 0.08,
              ease: "power1.in",
            })
            .to(letter, {
              y: -36,
              rotateY: "+=360",
              rotateZ: gsap.utils.random(-15, 15),
              scaleY: 1.25,
              scaleX: 0.88,
              color: "var(--blue)",
              duration: 0.38,
              ease: "back.out(2.2)",
            })
            .to(letter, {
              y: 0,
              rotateZ: 0,
              scaleY: 1,
              scaleX: 1,
              color: "var(--ink)",
              duration: 0.75,
              ease: "elastic.out(1.2, 0.4)",
            });
        });
      }

      const dot = target.closest<HTMLElement>(".name-dot");
      if (dot) {
        unlockSfx();
        playSfx("accent");
        const allChars = Array.from(
          document.querySelectorAll<HTMLElement>(".identity-name .name-char"),
        );
        allChars.reverse().forEach((char, idx) => {
          gsap.to(char, {
            y: -20,
            scale: 1.1,
            color: "var(--blue)",
            duration: 0.22,
            delay: idx * 0.035,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          });
        });
      }

      const clickable = target.closest<HTMLElement>("a,button");
      if (!clickable || !ring.current) return;
      context.add(() => {
        gsap.killTweensOf(ring.current);
        gsap.fromTo(
          ring.current,
          { x: e.clientX, y: e.clientY, scale: 0.1, opacity: 0.7 },
          { scale: 1.3, opacity: 0, duration: 0.65, ease: "power3.out" },
        );
      });
      if (clickable.matches(".spark-button"))
        context.add(() =>
          gsap.fromTo(
            clickable,
            { rotation: 0 },
            { rotation: 360, duration: 1.4, ease: "power3.out" },
          ),
        );
    };
    document.addEventListener("pointerover", enter);
    document.addEventListener("pointerout", leave);
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", press, { passive: true });
    return () => {
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", press);
      context.revert();
    };
  }, [enabled]);
  return <div ref={ring} className="touch-ring" aria-hidden="true" />;
}
