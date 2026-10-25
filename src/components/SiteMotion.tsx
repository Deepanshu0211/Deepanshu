"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

export default function SiteMotion({ scope, enabled }: { scope: RefObject<HTMLDivElement | null>; enabled: boolean }) {
  useLayoutEffect(() => {
    if (!enabled || !scope.current) return;
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      CustomEase.create("relicReveal", ".22,1,.36,1");
      media.add({ desktop: "(min-width: 900px)", motion: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (!conditions?.motion) return;
        const select = gsap.utils.selector(scope.current);
        const intro = gsap.timeline({ defaults: { ease: "relicReveal" } });
        intro.from(select("[data-world-word]"), { yPercent: 65, opacity: 0, rotation: -4, stagger: .13, duration: 1.5 })
          .from(select("[data-relic-stage]"), { scale: .72, rotation: -18, opacity: 0, duration: 1.8 }, .05);
        gsap.to(select("[data-relic-float]"), { y: -12, rotation: 2, duration: 3.5, yoyo: true, repeat: -1, ease: "sine.inOut",
          scrollTrigger: { trigger: select("[data-world-hero]")[0], start: "top bottom", end: "bottom top", toggleActions: "play pause resume pause" } });
        gsap.to(select("[data-world-word]"), { xPercent: (index) => index ? 14 : -14, ease: "none", scrollTrigger: { trigger: select("[data-world-hero]")[0], start: "top top", end: "bottom top", scrub: 1 } });
        select("[data-reveal]").forEach((element: HTMLElement) => {
          gsap.from(element, { y: 45, opacity: 0, duration: 1.1, ease: "relicReveal", scrollTrigger: { trigger: element, start: "top 93%", once: true } });
        });
        select("h2:not([data-motion-static])").forEach((heading: HTMLElement) => {
          SplitText.create(heading, { type: "lines,words", mask: "lines", autoSplit: true, aria: "auto",
            onSplit(self) {
              return gsap.from(self.words, { yPercent: 105, rotation: 2, stagger: .055, duration: 1.2, ease: "relicReveal", scrollTrigger: { trigger: heading, start: "top 92%", once: true } });
            }
          });
        });
        const assembly = select("[data-assembly]")[0];
        const scene = select("[data-assembly-scene]")[0];
        const pieces = select("[data-fragment]");
        const sequence = gsap.timeline({ scrollTrigger: { trigger: assembly, start: conditions.desktop ? "top top" : "top 70%", end: conditions.desktop ? "+=1000" : "bottom 70%", pin: conditions.desktop ? scene : false, scrub: 1, invalidateOnRefresh: true } });
        sequence.from(pieces, { xPercent: (i) => [-38, 40, -32, 35][i], yPercent: (i) => [-32, -28, 30, 35][i], rotation: (i) => [-24, 22, 18, -20][i], opacity: .3, stagger: .06, duration: 1, ease: "power2.inOut" }, 0)
          .fromTo(select("[data-assembly-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "none" }, 0);
        // Refresh once fonts settle; avoid capturing layout from fallback typography.
        let live = true;
        document.fonts.ready.then(() => { if (live) ScrollTrigger.refresh(); });
        return () => { live = false; };
      });
    }, scope);
    return () => { media.revert(); context.revert(); };
  }, [scope, enabled]);
  return null;
}
