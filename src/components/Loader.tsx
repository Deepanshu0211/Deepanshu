"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { playSfx } from "@/components/sfx";

export default function Loader({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Play SFX on mount
    playSfx("accent");

    // Animate loader out after 2.5 seconds
    const timer = setTimeout(() => {
      gsap.to(".loader-overlay", {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          setIsVisible(false);
          onComplete();
        },
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-content">
        <div className="loader-dot" />
        <div className="loader-text">dy</div>
      </div>
    </div>
  );
}
