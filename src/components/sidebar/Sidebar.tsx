"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import styles from "./sidebar.module.css";
import { BrandHeader } from "./BrandHeader";
import { NavMenu } from "./NavMenu";
import { LocationBadge } from "./LocationBadge";

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection = "home",
  onSectionChange,
  className = "",
}) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const [currentActive, setCurrentActive] = useState<string>(activeSection);

  useEffect(() => {
    setCurrentActive(activeSection);
  }, [activeSection]);

  const handleSelect = (id: string) => {
    setCurrentActive(id);
    if (onSectionChange) {
      onSectionChange(id);
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={`${styles.sidebar} ${className}`}
      aria-label="Sidebar Navigation"
    >
      {/* 1. Header: DEEPANSHU + */}
      <BrandHeader name="DEEPANSHU" />

      {/* 2. Unified Timeline block containing Navigation & Location Badge */}
      <div className={styles.timelineWrapper}>
        <NavMenu
          activeId={currentActive}
          onSelect={handleSelect}
        />

        <LocationBadge
          statusText="Currently in"
          locationText="Dehradun, India"
        />
      </div>
    </aside>
  );
};

export default Sidebar;
