"use client";

export type SfxType = "intro" | "hover" | "click" | "accent" | "nav";

const store = new WeakMap<Window, AudioContext>();

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  let ctx = store.get(w);

  if (!ctx) {
    const AudioCtor = window.AudioContext || w.webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
    store.set(w, ctx);
  }

  return ctx;
}

export function unlockSfx() {
  const ctx = getAudioContext();
  if (!ctx) return null;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  return ctx;
}

export function isSfxUnlocked() {
  if (typeof window === "undefined") return false;

  const ctx = store.get(window as Window & { webkitAudioContext?: typeof AudioContext });
  return !!ctx && ctx.state === "running";
}

export function playSfx(type: SfxType) {
  const ctx = unlockSfx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  const gain = ctx.createGain();
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();

  master.gain.setValueAtTime(0.0001, now);
  gain.gain.setValueAtTime(0.0001, now);

  oscA.connect(gain);
  oscB.connect(gain);
  gain.connect(master);
  master.connect(ctx.destination);

  if (type === "intro") {
    oscA.type = "triangle";
    oscB.type = "sine";
    oscA.frequency.setValueAtTime(220, now);
    oscB.frequency.setValueAtTime(330, now);
    oscA.frequency.exponentialRampToValueAtTime(440, now + 0.18);
    oscB.frequency.exponentialRampToValueAtTime(660, now + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    oscA.start(now);
    oscB.start(now + 0.05);
    oscA.stop(now + 0.38);
    oscB.stop(now + 0.4);
    return;
  }

  if (type === "hover") {
    oscA.type = "sine";
    oscB.type = "triangle";
    oscA.frequency.setValueAtTime(520, now);
    oscB.frequency.setValueAtTime(680, now);
    oscA.frequency.exponentialRampToValueAtTime(580, now + 0.08);
    oscB.frequency.exponentialRampToValueAtTime(740, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscA.start(now);
    oscB.start(now + 0.02);
    oscA.stop(now + 0.12);
    oscB.stop(now + 0.13);
    return;
  }

  if (type === "click") {
    oscA.type = "sawtooth";
    oscB.type = "square";
    oscA.frequency.setValueAtTime(220, now);
    oscB.frequency.setValueAtTime(110, now);
    oscA.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    oscB.frequency.exponentialRampToValueAtTime(90, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscA.start(now);
    oscB.start(now + 0.01);
    oscA.stop(now + 0.1);
    oscB.stop(now + 0.12);
    return;
  }

  if (type === "accent") {
    oscA.type = "triangle";
    oscB.type = "sine";
    oscA.frequency.setValueAtTime(390, now);
    oscB.frequency.setValueAtTime(560, now);
    oscA.frequency.exponentialRampToValueAtTime(780, now + 0.13);
    oscB.frequency.exponentialRampToValueAtTime(930, now + 0.13);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscA.start(now);
    oscB.start(now + 0.04);
    oscA.stop(now + 0.16);
    oscB.stop(now + 0.18);
    return;
  }

  oscA.type = "triangle";
  oscB.type = "square";
  oscA.frequency.setValueAtTime(440, now);
  oscB.frequency.setValueAtTime(330, now);
  oscA.frequency.exponentialRampToValueAtTime(620, now + 0.1);
  oscB.frequency.exponentialRampToValueAtTime(490, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  oscA.start(now);
  oscB.start(now + 0.01);
  oscA.stop(now + 0.14);
  oscB.stop(now + 0.16);
}
