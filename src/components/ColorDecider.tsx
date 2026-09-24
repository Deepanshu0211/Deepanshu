"use client";

import React, { useState, useEffect, useRef } from "react";
import { discover } from "@/components/discoveries";

export interface PalettePreset {
  name: string;
  primary: string;
  accent: string;
  wash: string;
}

export const PRESET_PALETTES: PalettePreset[] = [
  { name: "Electric Cobalt", primary: "#2448f5", accent: "#5073ff", wash: "rgba(36, 72, 245, 0.08)" },
  { name: "Sunset Crimson", primary: "#e11d48", accent: "#fb7185", wash: "rgba(225, 29, 72, 0.08)" },
  { name: "Cyber Emerald", primary: "#059669", accent: "#34d399", wash: "rgba(5, 150, 105, 0.08)" },
  { name: "Royal Violet", primary: "#7c3aed", accent: "#a78bfa", wash: "rgba(124, 58, 237, 0.08)" },
  { name: "Solar Amber", primary: "#d97706", accent: "#fbbf24", wash: "rgba(217, 119, 6, 0.08)" },
  { name: "Neon Cyan", primary: "#06b6d4", accent: "#67e8f9", wash: "rgba(6, 182, 212, 0.08)" },
  { name: "Rose Quartz", primary: "#db2777", accent: "#f472b6", wash: "rgba(219, 39, 119, 0.08)" },
  { name: "Lime Glow", primary: "#65a30d", accent: "#a3e635", wash: "rgba(101, 163, 13, 0.08)" },
  { name: "Obsidian Slate", primary: "#334155", accent: "#94a3b8", wash: "rgba(51, 65, 85, 0.08)" },
];

export function applyThemeColor(primary: string, name = "Custom") {
  if (typeof document === "undefined") return;
  
  // Calculate soft and wash colors from hex
  const hex = primary.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 36;
  const g = parseInt(hex.substring(2, 4), 16) || 72;
  const b = parseInt(hex.substring(4, 6), 16) || 245;

  const wash = `rgba(${r}, ${g}, ${b}, 0.08)`;
  const soft = `rgba(${r}, ${g}, ${b}, 0.25)`;
  
  document.documentElement.style.setProperty("--blue", primary);
  document.documentElement.style.setProperty("--blue-soft", soft);
  document.documentElement.style.setProperty("--wash", wash);

  window.dispatchEvent(new CustomEvent("dy-palette", { detail: primary }));

  try {
    localStorage.setItem("dy-accent-color", primary);
    localStorage.setItem("dy-palette-name", name);
  } catch {}
}

export function getStoredColor(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("dy-accent-color");
  } catch {
    return null;
  }
}

interface ColorDeciderProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export default function ColorDecider({ isOpen, onClose }: ColorDeciderProps) {
  const [currentColor, setCurrentColor] = useState("#2448f5");
  const [customHex, setCustomHex] = useState("#2448f5");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Restore stored color on mount
  useEffect(() => {
    const stored = getStoredColor();
    if (stored) {
      setCurrentColor(stored);
      setCustomHex(stored);
      applyThemeColor(stored, "Saved Preference");
    }
  }, []);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelectPreset = (preset: PalettePreset, e: React.MouseEvent) => {
    setCurrentColor(preset.primary);
    setCustomHex(preset.primary);
    applyThemeColor(preset.primary, preset.name);
    discover("palette", e.currentTarget as HTMLElement);
  };

  const handleCustomChange = (newColor: string) => {
    setCurrentColor(newColor);
    setCustomHex(newColor);
    applyThemeColor(newColor, "Custom");
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setCurrentColor(val);
      applyThemeColor(val, "Custom Hex");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="color-decider-overlay" role="dialog" aria-modal="true" aria-label="Theme Color Customizer">
      <div ref={popoverRef} className="color-decider-card">
        <div className="color-decider-header">
          <div className="decider-title-group">
            <span className="decider-eyebrow">CUSTOMIZE PALETTE</span>
            <h3 className="decider-title">Decide Your Color</h3>
          </div>
          <button
            className="decider-close-btn"
            onClick={onClose}
            aria-label="Close color customizer"
          >
            ✕
          </button>
        </div>

        <p className="decider-desc">
          Choose a curated accent or pick any custom hue. The entire site and 3D monogram adapt live.
        </p>

        {/* Curated Swatches Grid */}
        <div className="color-swatches-grid">
          {PRESET_PALETTES.map((p) => {
            const isSelected = currentColor.toLowerCase() === p.primary.toLowerCase();
            return (
              <button
                key={p.name}
                onClick={(e) => handleSelectPreset(p, e)}
                className={`swatch-pill ${isSelected ? "is-selected" : ""}`}
                title={p.name}
                aria-label={`Select ${p.name}`}
              >
                <span className="swatch-color" style={{ background: p.primary }} />
                <span className="swatch-name">{p.name}</span>
                {isSelected && <span className="swatch-check">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="color-decider-divider" />

        {/* Custom Color Decider Controls */}
        <div className="custom-color-row">
          <div className="custom-picker-wrapper">
            <input
              type="color"
              id="custom-site-color"
              value={currentColor}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="custom-color-input"
              aria-label="Pick any custom color"
            />
            <label htmlFor="custom-site-color" className="custom-color-label" style={{ background: currentColor }}>
              <span className="picker-icon">🎨</span>
            </label>
          </div>

          <div className="custom-input-fields">
            <span className="custom-label">HEX VALUE</span>
            <div className="hex-input-group">
              <span className="hex-hash">#</span>
              <input
                type="text"
                value={customHex.replace("#", "")}
                onChange={handleHexInput}
                maxLength={6}
                placeholder="2448F5"
                className="hex-text-input"
                aria-label="Hex color code"
              />
            </div>
          </div>

          <button
            className="decider-reset-btn"
            onClick={() => handleCustomChange("#2448f5")}
            title="Reset to default cobalt"
          >
            Reset
          </button>
        </div>

        <div className="decider-footer">
          <span className="decider-hint">
            Active: <strong style={{ color: currentColor }}>{currentColor.toUpperCase()}</strong> · Auto-saved to browser
          </span>
        </div>
      </div>
    </div>
  );
}
