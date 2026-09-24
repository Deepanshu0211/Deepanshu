"use client";
import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { getMotionPreference } from "@/components/motionPreference";
export default function Template({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    if (
      !getMotionPreference() ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const context = gsap.context(() => {
      gsap.from(".case-page > *", {
        y: 45,
        opacity: 0,
        duration: 1.7,
        stagger: 0.09,
        ease: "expo.out",
        clearProps: "transform,opacity",
      });
    });
    return () => context.revert();
  }, []);
  return <>{children}</>;
}
