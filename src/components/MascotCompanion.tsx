"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./MascotCompanion.module.css";

const EXPRESSIONS = [
  { id: "idle", label: "Quiet & watchful", quote: "Deepanshu's companion. Keeping things tidy behind the scenes." },
  { id: "curious", label: "Observing details", quote: "Curious about how things are structured under the hood." },
  { id: "working", label: "In the flow", quote: "Crafting interfaces that feel natural and tactile." },
  { id: "carrying", label: "Carrying bundles", quote: "Bringing useful tools into real-world hands." },
  { id: "organizing", label: "Ordering chaos", quote: "Untangling complex state and messy file systems." },
  { id: "scanning", label: "Pattern matching", quote: "Spotting subtle friction in user interactions." },
  { id: "happy", label: "Good vibes", quote: "When the build passes and the typography breathes." },
  { id: "sleepy", label: "Recharging", quote: "Even late-night terminal dwellers need quiet." },
  { id: "confused", label: "Puzzling it out", quote: "Wait... where did that margin collapse come from?" },
  { id: "celebrating", label: "Shipped it!", quote: "Handcrafted with soul — not algorithmic slop." }
];

export default function MascotCompanion() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speech, setSpeech] = useState<string | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const [audioHint, setAudioHint] = useState(false);

  const active = EXPRESSIONS[currentIdx];

  const cycleNext = () => {
    setBouncing(true);
    setCurrentIdx((prev) => (prev + 1) % EXPRESSIONS.length);
    setTimeout(() => setBouncing(false), 350);
  };

  const selectPose = (idx: number) => {
    setBouncing(true);
    setCurrentIdx(idx);
    setSpeech(EXPRESSIONS[idx].quote);
    setTimeout(() => setBouncing(false), 300);
  };

  useEffect(() => {
    // Show an initial greeting after a short delay
    const t = setTimeout(() => {
      setSpeech("Meet Neatify's woodland housekeeper. Tap me to shift mood!");
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.companionContainer}>
      <div className={styles.speechBubble} aria-live="polite">
        <span className={styles.tinyLabel}>FIELD COMPANION · V1.0</span>
        <p>{speech || active.quote}</p>
      </div>

      <div className={styles.mascotStage}>
        <button
          type="button"
          onClick={cycleNext}
          className={`${styles.characterButton} ${bouncing ? styles.bounce : ""}`}
          title="Click to change companion expression"
          aria-label={`Mascot companion in ${active.id} expression. Click to change.`}
        >
          <div className={styles.haloRing} />
          <Image
            src={`/mascot/expressions/${active.id}.png`}
            alt={`Neatify mascot companion - ${active.id}`}
            width={170}
            height={170}
            priority
            className={styles.pixelSprite}
          />
          <span className={styles.clickBadge}>TAP TO CYCLE ↷</span>
        </button>

        <div className={styles.metaBadge}>
          <div className={styles.statusDot} />
          <strong>{active.id.toUpperCase()}</strong>
          <span>— {active.label}</span>
        </div>
      </div>

      <div className={styles.poseSelector}>
        <span className={styles.shelfLabel}>MOOD SHELF (ORIGINAL PIXEL AUTHORING):</span>
        <div className={styles.thumbnails}>
          {EXPRESSIONS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => selectPose(idx)}
              className={`${styles.thumbBtn} ${idx === currentIdx ? styles.activeThumb : ""}`}
              title={`${item.id}: ${item.label}`}
              aria-label={`Select ${item.id} pose`}
            >
              <Image
                src={`/mascot/expressions/${item.id}.png`}
                alt={item.id}
                width={36}
                height={36}
                className={styles.thumbImage}
              />
              <span className={styles.thumbName}>{item.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
