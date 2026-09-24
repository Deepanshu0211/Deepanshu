"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import styles from "./sidebar.module.css";

export interface NavItemDef {
  id: string;
  label: string;
  href?: string;
}

const DEFAULT_NAV_ITEMS: NavItemDef[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact" },
];

interface NavMenuProps {
  items?: NavItemDef[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

export const NavMenu: React.FC<NavMenuProps> = ({
  items = DEFAULT_NAV_ITEMS,
  activeId = "home",
  onSelect,
}) => {
  const [currentActive, setCurrentActive] = useState<string>(activeId);

  // Refs for 3D dot assembly
  const dotContainerRef = useRef<HTMLDivElement>(null);
  const dotOrbRef = useRef<HTMLDivElement>(null);
  const dotShadowRef = useRef<HTMLDivElement>(null);
  const motionTrailRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const ghostDotRef = useRef<HTMLDivElement>(null);

  const lineRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isInitialized = useRef(false);

  // Sync external activeId if changed
  useEffect(() => {
    setCurrentActive(activeId);
  }, [activeId]);

  // Compute exact Y position of an element relative to trackRef using getBoundingClientRect
  const getTargetY = useCallback((el: HTMLElement) => {
    if (!trackRef.current) return 0;
    const trackRect = trackRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // Center of element relative to top of track, minus half dot height (4.25px)
    return elRect.top - trackRect.top + elRect.height / 2 - 4.25;
  }, []);

  // Update vertical guideline height to reach right to the bottom location ring
  const updateLineHeight = useCallback(() => {
    if (lineRef.current && trackRef.current) {
      const trackHeight = trackRef.current.offsetHeight;
      lineRef.current.style.height = `${trackHeight + 42}px`;
    }
  }, []);

  useEffect(() => {
    updateLineHeight();
    window.addEventListener("resize", updateLineHeight);
    return () => window.removeEventListener("resize", updateLineHeight);
  }, [updateLineHeight, items]);

  // ANIMATE DOT TO ACTIVE ITEM WITH PREMIUM GSAP PHYSICS
  useEffect(() => {
    const activeEl = itemsRef.current.get(currentActive);
    if (!activeEl || !dotContainerRef.current || !dotOrbRef.current) return;

    const targetY = getTargetY(activeEl);

    // Initial mount positioning without animation delay
    if (!isInitialized.current) {
      gsap.set(dotContainerRef.current, { y: targetY });
      isInitialized.current = true;
      return;
    }

    // Kill any in-flight animations to avoid conflicts
    gsap.killTweensOf(dotContainerRef.current);
    gsap.killTweensOf(dotOrbRef.current);
    if (dotShadowRef.current) gsap.killTweensOf(dotShadowRef.current);
    if (motionTrailRef.current) gsap.killTweensOf(motionTrailRef.current);
    if (rippleRef.current) gsap.killTweensOf(rippleRef.current);

    const currentY = gsap.getProperty(dotContainerRef.current, "y") as number;
    const distance = Math.abs(targetY - currentY);
    if (distance < 1) return;

    const isMovingDown = targetY > currentY;
    // Calculate balanced travel duration (0.55s - 0.9s depending on distance)
    const duration = Math.min(Math.max(distance / 220, 0.55), 0.9);

    const tl = gsap.timeline();

    // 1. Motion Trail blur streak stretching behind the moving dot
    if (motionTrailRef.current) {
      gsap.set(motionTrailRef.current, {
        top: isMovingDown ? -12 : 8,
        height: Math.min(distance * 0.45, 28),
      });

      tl.fromTo(
        motionTrailRef.current,
        { opacity: 0.7, scaleY: 0.6 },
        { opacity: 0, scaleY: 1.6, duration: duration * 0.7, ease: "power2.out" },
        0
      );
    }

    // 2. 3D Liftoff, squash & stretch, and subtle velocity blur
    tl.to(
      dotOrbRef.current,
      {
        scale: 1.3,
        scaleY: 1.45,
        scaleX: 0.78,
        filter: "blur(0.6px)",
        boxShadow: "0 10px 18px rgba(0, 0, 0, 0.45), 0 3px 6px rgba(0, 0, 0, 0.3)",
        duration: duration * 0.35,
        ease: "power2.in",
      },
      0
    )
      // 3. Ambient Shadow expanding during flight
      .to(
        dotShadowRef.current,
        {
          scale: 1.7,
          opacity: 0.85,
          filter: "blur(3.5px)",
          duration: duration * 0.35,
        },
        0
      )
      // 4. Smooth gliding motion down or up to targetY
      .to(
        dotContainerRef.current,
        {
          y: targetY,
          duration: duration,
          ease: "power3.inOut",
        },
        0
      )
      // 5. Impact compression (Squash on arrival)
      .to(
        dotOrbRef.current,
        {
          scale: 1,
          scaleY: 0.82,
          scaleX: 1.22,
          filter: "blur(0px)",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.4)",
          duration: 0.18,
          ease: "sine.out",
        },
        `-=${duration * 0.22}`
      )
      // 6. Ambient Shadow settling
      .to(
        dotShadowRef.current,
        {
          scale: 1,
          opacity: 0.6,
          filter: "blur(2.5px)",
          duration: 0.2,
        },
        `-=${duration * 0.22}`
      )
      // 7. Elastic bounce settling to perfect 3D sphere
      .to(dotOrbRef.current, {
        scaleY: 1,
        scaleX: 1,
        duration: 0.45,
        ease: "elastic.out(1.3, 0.4)",
      });

    // 8. Shockwave ripple ring at destination
    if (rippleRef.current) {
      tl.fromTo(
        rippleRef.current,
        { scale: 0.5, opacity: 0.7 },
        { scale: 3.4, opacity: 0, duration: 0.7, ease: "power2.out" },
        `-=${duration * 0.2}`
      );
    }
  }, [currentActive, getTargetY]);

  // Initial choreographed reveal
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    if (lineRef.current) {
      tl.fromTo(
        lineRef.current,
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 1.4,
          ease: "power3.inOut",
          transformOrigin: "top center",
        },
        0
      );
    }

    if (dotContainerRef.current) {
      tl.fromTo(
        dotContainerRef.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.75,
          ease: "back.out(2.5)",
        },
        0.3
      );
    }

    const elements = Array.from(itemsRef.current.values());
    if (elements.length > 0) {
      tl.fromTo(
        elements,
        { x: -16, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        },
        0.35
      );
    }
  }, []);

  const handleClick = (id: string) => {
    setCurrentActive(id);
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleMouseEnter = (id: string, el: HTMLButtonElement) => {
    if (id !== currentActive) {
      gsap.to(el, {
        x: 4,
        color: "#111111",
        duration: 0.25,
        ease: "power2.out",
      });

      // Preview ghost dot at hovered item
      if (ghostDotRef.current) {
        const targetY = getTargetY(el);
        gsap.to(ghostDotRef.current, {
          y: targetY,
          opacity: 0.5,
          scale: 1,
          duration: 0.25,
          ease: "power2.out",
        });
      }
    }
  };

  const handleMouseLeave = (id: string, el: HTMLButtonElement) => {
    if (id !== currentActive) {
      gsap.to(el, {
        x: 0,
        color: "#63625f",
        duration: 0.25,
        ease: "power2.out",
      });

      if (ghostDotRef.current) {
        gsap.to(ghostDotRef.current, {
          opacity: 0,
          scale: 0.5,
          duration: 0.2,
          ease: "power2.in",
        });
      }
    }
  };

  return (
    <nav className={styles.navContainer} aria-label="Primary Navigation">
      <div ref={trackRef} className={styles.timelineTrack}>
        {/* Continuous visible vertical guide line */}
        <div ref={lineRef} className={styles.verticalGuideLine} />

        {/* 3D Active Dot Assembly */}
        <div ref={dotContainerRef} className={styles.activeDotContainer}>
          {/* Ambient blur shadow */}
          <div ref={dotShadowRef} className={styles.dotAmbientShadow} />

          {/* Motion trail with directional blur */}
          <div ref={motionTrailRef} className={styles.motionTrail} />

          {/* 3D Tactile Orb Dot with specular reflection */}
          <div ref={dotOrbRef} className={styles.activeDot3D}>
            <div className={styles.dotSpecular} />
          </div>

          {/* Landing shockwave ripple */}
          <div ref={rippleRef} className={styles.landingRipple} />
        </div>

        {/* Hover preview ghost dot with soft blur */}
        <div ref={ghostDotRef} className={styles.hoverGhostDot} />

        {/* Navigation list */}
        <ul className={styles.navList}>
          {items.map((item) => {
            const isActive = currentActive === item.id;
            return (
              <li key={item.id} className={styles.navItem}>
                <button
                  ref={(el) => {
                    if (el) itemsRef.current.set(item.id, el);
                    else itemsRef.current.delete(item.id);
                  }}
                  className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                  onClick={() => handleClick(item.id)}
                  onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
                  onMouseLeave={(e) => handleMouseLeave(item.id, e.currentTarget)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
