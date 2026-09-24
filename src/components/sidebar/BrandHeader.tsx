"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import styles from "./sidebar.module.css";

interface BrandHeaderProps {
  name?: string;
  onPlusClick?: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  name = "DEEPANSHU",
  onPlusClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { y: -16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.0,
          ease: "power3.out",
        }
      );
    }
  }, []);

  const handleMouseEnter = () => {
    if (plusRef.current) {
      gsap.to(plusRef.current, {
        rotate: 90,
        scale: 1.25,
        duration: 0.45,
        ease: "back.out(2.2)",
      });
    }
  };

  const handleMouseLeave = () => {
    if (plusRef.current) {
      gsap.to(plusRef.current, {
        rotate: 0,
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  };

  return (
    <div ref={containerRef} className={styles.brandHeader}>
      <h1 className={styles.brandName}>{name}</h1>
      <span
        ref={plusRef}
        className={styles.plusIcon}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onPlusClick}
        aria-label="Options"
        role="button"
        tabIndex={0}
      >
        +
      </span>
    </div>
  );
};
