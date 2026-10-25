"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { orientationTilt } from "@/lib/deviceTilt";
import styles from "./Portfolio.module.css";

type SensorState = "off" | "requesting" | "waiting" | "active" | "unavailable" | "denied";
type PermissionOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
function subscribeReduced(callback: () => void) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const clamp = (value: number) => Math.max(-16, Math.min(16, value));

export default function Relic({ enabled }: { enabled: boolean }) {
  const object = useRef<HTMLDivElement>(null);
  const [sensor, setSensor] = useState<SensorState>("off");
  const [turn, setTurn] = useState(0);
  const reduced = useSyncExternalStore(subscribeReduced, () => matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const allowed = enabled && !reduced;
  const mounted = useRef(false);
  const requestVersion = useRef(0);
  const sensorCleanup = useRef<(() => void) | null>(null);
  const baseline = useRef<{ beta: number; gamma: number } | null>(null);
  const move = useRef<(x: number, y: number) => void>(() => {});
  const sensorRunning = sensor === "active" || sensor === "waiting";

  useEffect(() => {
    mounted.current = true;
    const requests = requestVersion;
    return () => { mounted.current = false; requests.current++; sensorCleanup.current?.(); };
  }, []);

  useEffect(() => {
    if (!object.current || !allowed) return;
    const x = gsap.quickTo(object.current, "rotationX", { duration: .9, ease: "power3.out" });
    const y = gsap.quickTo(object.current, "rotationY", { duration: .9, ease: "power3.out" });
    move.current = (rx, ry) => { x(clamp(rx)); y(clamp(ry)); };
    const element = object.current;
    const requests = requestVersion;
    return () => {
      move.current = () => {};
      x.tween.kill(); y.tween.kill();
      gsap.set(element, { clearProps: "transform" });
      sensorCleanup.current?.();
      sensorCleanup.current = null;
      requests.current++;
      if (mounted.current) setSensor("off");
    };
  }, [allowed]);

  function stopSensor() {
    sensorCleanup.current?.(); sensorCleanup.current = null;
    baseline.current = null; setSensor("off"); setTurn(0); move.current(0, 0);
  }

  async function enableSensor() {
    if (sensorRunning) { stopSensor(); return; }
    if (!allowed) return;
    if (!window.isSecureContext || typeof DeviceOrientationEvent === "undefined") { setSensor("unavailable"); return; }
    setSensor("requesting");
    const version = ++requestVersion.current;
    try {
      const orientation = DeviceOrientationEvent as PermissionOrientation;
      if (orientation.requestPermission && await orientation.requestPermission() !== "granted") {
        if (mounted.current && version === requestVersion.current) setSensor("denied");
        return;
      }
      if (!mounted.current || version !== requestVersion.current || !enabled || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      baseline.current = null;
      setSensor("waiting");
      let received = false;
      const onOrientation = (event: DeviceOrientationEvent) => {
        if (document.hidden || event.beta === null || event.gamma === null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
        if (!received) { received = true; setSensor("active"); }
        if (!baseline.current) baseline.current = { beta: event.beta, gamma: event.gamma };
        const tilt = orientationTilt({ beta: event.beta, gamma: event.gamma }, baseline.current, screen.orientation?.angle ?? 0);
        move.current(tilt.x, tilt.y);
      };
      const recalibrate = () => { baseline.current = null; move.current(0, 0); };
      window.addEventListener("deviceorientation", onOrientation);
      window.addEventListener("orientationchange", recalibrate);
      document.addEventListener("visibilitychange", recalibrate);
      const timeout = setTimeout(() => {
        if (!received) { sensorCleanup.current?.(); sensorCleanup.current = null; setSensor("unavailable"); }
      }, 3000);
      sensorCleanup.current = () => {
        clearTimeout(timeout);
        window.removeEventListener("deviceorientation", onOrientation);
        window.removeEventListener("orientationchange", recalibrate);
        document.removeEventListener("visibilitychange", recalibrate);
      };
    } catch { if (mounted.current && version === requestVersion.current) setSensor("denied"); }
  }

  const status = !allowed ? "Motion paused. The sculpture is still." : sensor === "active" ? "Tilt gently. Find your own perspective." : sensor === "waiting" ? "Hold your phone comfortably…" : sensor === "denied" ? "Permission declined. Try the touch control below." : sensor === "unavailable" ? "Tilt isn’t available here. Try the touch control." : "Move your cursor, or turn the artefact below.";

  return <div className={styles.relicExperience}>
    <div className={styles.relicStage} data-relic-stage
      onPointerMove={(event) => {
        if (!allowed || sensorRunning || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        move.current((.5 - (event.clientY - bounds.top) / bounds.height) * 18, ((event.clientX - bounds.left) / bounds.width - .5) * 22);
      }} onPointerLeave={() => { if (!sensorRunning) move.current(0, turn); }}>
      <div className={styles.relicFloat} data-relic-float><div ref={object} className={styles.relicObject}>
        <Image src="/images/digital-relic.webp" alt="A fragmented limestone ring fused with liquid chrome — an exploration of nature and technology" width={1280} height={1280} loading="eager" fetchPriority="high" sizes="(max-width: 700px) 90vw, 52vw" />
      </div></div>
    </div>
    <div className={styles.relicControls}>
      <div className={styles.sensorButtons}><button onClick={enableSensor} disabled={!allowed || sensor === "requesting"} aria-pressed={allowed && sensorRunning}>{allowed && sensorRunning ? "DISABLE TILT −" : sensor === "requesting" ? "REQUESTING…" : "ENABLE TILT ↗"}</button>{allowed && sensor === "active" && <button onClick={() => { baseline.current = null; move.current(0, 0); }}>RECENTER</button>}</div>
      <label className={styles.turnControl}>TURN THE ARTEFACT<input aria-label="Turn the sculpture" type="range" min="-16" max="16" step="1" value={turn} disabled={!allowed} onChange={(event) => { if (sensorRunning) stopSensor(); const value = Number(event.target.value); setTurn(value); move.current(0, value); }} /></label>
      <p aria-live="polite">{status}</p>
    </div>
  </div>;
}
