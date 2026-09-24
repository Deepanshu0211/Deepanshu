"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ColorDecider from "@/components/ColorDecider";

export default function NotFound() {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="not-found-page">
      <header className="personal-nav">
        <Link href="/" className="personal-logo" aria-label="Return home">
          dy<span>↖</span>
        </Link>
        <span className="nav-caption">
          COORDINATE: [NaN, NaN] · SIGNAL STATUS: UNREACHABLE
        </span>
        <div className="not-found-nav-actions">
          <button
            className="dock-palette-btn"
            onClick={() => setColorPickerOpen(true)}
            aria-label="Customize theme color"
            title="Choose your accent color"
          >
            <span className="dock-color-dot" />
          </button>
          <Link href="/" className="not-found-back-link">
            Return Home ↗
          </Link>
        </div>
      </header>

      <main className="not-found-main">
        <div className="not-found-glow" aria-hidden="true" />

        <div className="not-found-content">
          {/* <div className="not-found-meta-tag">
            <span className="status-live-pulse" />
            <span>ERROR 404 · PAGE NOT FOUND</span>
          </div> */}

          <h1 className="not-found-title" aria-label="404">
            {"404".split("").map((num, i) => (
              <span key={i} className="name-char" data-char={num}>
                {num}
              </span>
            ))}
          </h1>

          <div className="not-found-prose">
            <h2 className="not-found-subtitle">
              You’ve drifted into <em>uncharted territory.</em>
            </h2>
            <p className="not-found-desc">
              The coordinate you requested doesn’t exist in this build. It may have been refactored,
              moved to another dimension, or was simply a typo in the URL space.
            </p>
          </div>

          <div className="not-found-actions">
            <Link href="/" className="round-link not-found-primary-btn">
              <span>RETURN TO HOME BASE</span>
              <i>↗</i>
            </Link>

            <div className="not-found-quick-links">
              <span className="quick-links-label">OR JUMP STRAIGHT TO:</span>
              <div className="quick-links-row">
                <Link href="/#work" className="editorial-text-link">
                  Selected Work <sup>04</sup>
                </Link>
                <span className="link-separator">/</span>
                <Link href="/#person" className="editorial-text-link">
                  The Person
                </Link>
                <span className="link-separator">/</span>
                <Link href="/#experience" className="editorial-text-link">
                  The Journey
                </Link>
                <span className="link-separator">/</span>
                <Link href="/#hello" className="editorial-text-link">
                  Say Hello
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="not-found-footer">
        <span>DEEPANSHU YADAV — PERSONAL CORNER OF THE WEB</span>
        <button
          className="color-switcher-link"
          onClick={() => setColorPickerOpen(true)}
        >
          Customize Site Color 🎨
        </button>
      </footer>

      {mounted && (
        <ColorDecider
          isOpen={colorPickerOpen}
          onClose={() => setColorPickerOpen(false)}
        />
      )}
    </div>
  );
}
