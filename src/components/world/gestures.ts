// Gestures, on keys 1 to 6: how long each lasts and the emoji friends see on your name tag.
// Kept free of three.js so the interface can use it without loading the 3D engine.
export type Gesture = "wave" | "point" | "thumbs" | "clap" | "dance" | "smoke";
export const GESTURES: Record<Gesture, { dur: number; emoji: string; key: string; label: string }> = {
  wave: { dur: 2.6, emoji: "👋", key: "1", label: "Wave" },
  point: { dur: 2.8, emoji: "👉", key: "2", label: "Point" },
  thumbs: { dur: 2.2, emoji: "👍", key: "3", label: "Thumbs up" },
  clap: { dur: 2.6, emoji: "👏", key: "4", label: "Clap" },
  dance: { dur: 8, emoji: "💃", key: "5", label: "Dance" },
  smoke: { dur: 9.6, emoji: "🚬", key: "6", label: "Smoke" }, // three drags, a puff out after each
};
