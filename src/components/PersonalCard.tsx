"use client";

import React, { useState, useRef, useCallback } from "react";
import { discover } from "@/components/discoveries";

export default function PersonalCard() {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    // Normalizing between -1 and 1
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    const rotateX = -normY * 14; // Max 14deg tilt
    const rotateY = normX * 14;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      cardRef.current.style.setProperty("--rot-x", `${rotateX}deg`);
      cardRef.current.style.setProperty("--rot-y", `${rotateY}deg`);
      cardRef.current.style.setProperty("--shine-x", `${percentX}%`);
      cardRef.current.style.setProperty("--shine-y", `${percentY}%`);
      cardRef.current.style.setProperty("--shine-opacity", "0.45");
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      cardRef.current.style.setProperty("--rot-x", "0deg");
      cardRef.current.style.setProperty("--rot-y", "0deg");
      cardRef.current.style.setProperty("--shine-opacity", "0");
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className="personal-card-3d-wrapper"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="personal-card">
        {/* Holographic gloss overlay */}
        <div className="card-specular-shine" aria-hidden="true" />
        
        <button
          className="card-flip-control"
          aria-label="Flip Deepanshu’s personal card"
          aria-pressed={flipped}
          onClick={(e) => {
            setFlipped(!flipped);
            discover("card", e.currentTarget);
          }}
        >
          <span className={`card-flip-inner ${flipped ? "is-flipped" : ""}`}>
            <span className="card-face card-front" aria-hidden={flipped}>
              <span className="card-greeting">HELLO, HUMAN.</span>
              <span className="personal-card-name">
                DEEP
                <br />
                ANSHU<span>↗</span>
              </span>
              <span className="personal-card-bottom">
                <span>
                  DEVELOPER. STUDENT.
                  <br />
                  PERPETUALLY CURIOUS.
                </span>
                <b className="flip-hint">
                  <span className="flip-icon">↻</span> FLIP ME
                </b>
              </span>
            </span>

            <span className="card-face card-back" aria-hidden={!flipped}>
              <span className="card-greeting">THE OTHER SIDE OF THE STORY</span>
              <span className="card-back-star">✳</span>
              <strong>
                Still learning.
                <br />
                Still making.
                <br />
                Still me.
              </strong>
              <span className="card-back-note">
                Good things usually start with
                <br />
                “what if I tried this?”
              </span>
              <span className="personal-card-bottom">
                <span>THANKS FOR BEING CURIOUS.</span>
                <b className="flip-hint">
                  <span className="flip-icon">↺</span> FLIP BACK
                </b>
              </span>
            </span>
          </span>
        </button>
        {/* <span className="hand-note">there’s always another side.</span> */}
      </div>
    </div>
  );
}
