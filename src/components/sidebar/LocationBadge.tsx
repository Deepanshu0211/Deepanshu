"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./sidebar.module.css";

interface LocationBadgeProps {
  statusText?: string;
  locationText?: string;
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  statusText = "Currently in",
  locationText = "Dehradun, India",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const greenDotRef = useRef<HTMLSpanElement>(null);
  const yellowDotRef = useRef<HTMLSpanElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Entrance animation synced with the overall timeline
    const tl = gsap.timeline({ delay: 0.9 });

    if (ringRef.current) {
      tl.fromTo(
        ringRef.current,
        { scale: 0.5, rotate: -90, opacity: 0 },
        {
          scale: 1,
          rotate: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
        },
        0
      );
    }

    if (detailsRef.current) {
      tl.fromTo(
        detailsRef.current.children,
        { x: -12, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
        },
        0.2
      );
    }

    // 2. High-end continuous ambient micro-animations
    if (greenDotRef.current) {
      gsap.to(greenDotRef.current, {
        scale: 1.35,
        opacity: 0.75,
        boxShadow: "0 0 10px rgba(34, 197, 94, 0.7)",
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    if (yellowDotRef.current) {
      gsap.to(yellowDotRef.current, {
        scale: 1.2,
        opacity: 0.85,
        boxShadow: "0 0 8px rgba(217, 119, 6, 0.6)",
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.6,
      });
    }
  }, []);

  const handleRingHover = () => {
    if (ringRef.current) {
      gsap.to(ringRef.current, {
        rotate: "+=180",
        scale: 1.15,
        duration: 0.6,
        ease: "back.out(2)",
      });
    }
  };

  const handleRingLeave = () => {
    if (ringRef.current) {
      gsap.to(ringRef.current, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  };

  return (
    <div ref={containerRef} className={styles.locationSection}>
      {/* Target ring icon ◎ aligned directly on the vertical line axis */}
      <div
        ref={ringRef}
        className={styles.targetRing}
        onMouseEnter={handleRingHover}
        onMouseLeave={handleRingLeave}
        title="Location: Dehradun, India"
      >
        <div className={styles.targetDot} />
      </div>

      {/* Location text details */}
      <div ref={detailsRef} className={styles.locationDetails}>
        {/* Row 1: Green dot + Currently in */}
        <div className={styles.locationRow}>
          <span ref={greenDotRef} className={styles.greenDot} />
          <span className={styles.currentlyText}>{statusText}</span>
        </div>

        {/* Row 2: Amber dot + Dehradun, India */}
        <div className={styles.locationRow}>
          <span ref={yellowDotRef} className={styles.yellowDot} />
          <span className={styles.cityText}>{locationText}</span>
        </div>
      </div>
    </div>
  );
};
