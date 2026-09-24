"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import ColorDecider from "@/components/ColorDecider";

interface DockItem {
  id: string;
  label: string;
  num?: string;
}

const navItems: DockItem[] = [
  { id: "top", label: "Intro" },
  { id: "work", label: "Work", num: "04" },
  { id: "person", label: "Person" },
  { id: "experience", label: "Journey" },
  { id: "hello", label: "Contact" },
];

export default function FloatingDock({
  onPaletteChange,
}: {
  onPaletteChange?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [activeSection, setActiveSection] = useState("top");
  const [colorDeciderOpen, setColorDeciderOpen] = useState(false);
  const [isDockVisible, setIsDockVisible] = useState(true);
  const dockRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use IntersectionObserver to reliably detect which section is in view
    // On mobile, use more aggressive margin to trigger hide earlier
    const isMobile = window.innerWidth < 768;
    const observerOptions = {
      root: null,
      rootMargin: isMobile ? "-30% 0px -70% 0px" : "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observedSections: { [key: string]: boolean } = {};
    navItems.forEach((item) => {
      observedSections[item.id] = false;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.id;
        observedSections[sectionId] = entry.isIntersecting;
      });

      // Find the last (highest in the page) section that is in view
      let active = "top";
      for (let i = navItems.length - 1; i >= 0; i--) {
        if (observedSections[navItems[i].id]) {
          active = navItems[i].id;
          break;
        }
      }

      setActiveSection(active);
      setIsDockVisible(active !== "hello");
    }, observerOptions);

    // Observe all sections
    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Listen for open color picker custom events (e.g. from hero dot)
  useEffect(() => {
    const handleOpen = () => setColorDeciderOpen(true);
    window.addEventListener("dy-open-color-picker", handleOpen);
    return () => window.removeEventListener("dy-open-color-picker", handleOpen);
  }, []);

  // Update sliding pill position
  useEffect(() => {
    if (!dockRef.current || !pillRef.current) return;
    const activeBtn = dockRef.current.querySelector<HTMLElement>(`[data-dock-id="${activeSection}"]`);
    if (activeBtn) {
      const dockRect = dockRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const left = btnRect.left - dockRect.left;
      const width = btnRect.width;

      gsap.to(pillRef.current, {
        x: left,
        width: width,
        duration: 0.35,
        ease: "power3.out",
      });
    }
  }, [activeSection]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const lenis = (window as unknown as { __lenis?: { scrollTo: (target: HTMLElement, opts: object) => void } }).__lenis;
    if (lenis) {
      lenis.scrollTo(target, { offset: -30, duration: 1.3 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
    setActiveSection(id);
    setIsDockVisible(id !== "hello");
    history.pushState(null, "", `#${id}`);
  };

  const handlePaletteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onPaletteChange) {
      onPaletteChange(e);
    }
    setColorDeciderOpen(true);
  };

  return (
    <>
      <div
        className={`floating-dock-container ${isDockVisible ? "is-visible" : "is-hidden"}`}
        aria-label="Quick section navigation"
      >
        <nav ref={dockRef} className="floating-dock">
          <div ref={pillRef} className="dock-active-pill" aria-hidden="true" />
          
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-dock-id={item.id}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`dock-item ${isActive ? "is-active" : ""}`}
              >
                <span>{item.label}</span>
                {item.num && <sup>{item.num}</sup>}
              </a>
            );
          })}

          <button
            className="dock-palette-btn"
            onClick={handlePaletteClick}
            aria-label="Decide your accent color"
            title="Decide your site color"
          >
            <span className="dock-color-dot" />
          </button>
        </nav>
      </div>

      <ColorDecider
        isOpen={colorDeciderOpen}
        onClose={() => setColorDeciderOpen(false)}
      />
    </>
  );
}
