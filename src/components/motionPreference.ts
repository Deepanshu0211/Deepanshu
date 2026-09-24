"use client";
import { useSyncExternalStore } from "react";
const key = "dy-motion";
export function getMotionPreference() {
  try {
    return localStorage.getItem(key) !== "off";
  } catch {
    return true;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("dy-motion-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("dy-motion-change", callback);
    window.removeEventListener("storage", callback);
  };
}
export function useMotionPreference(): [boolean, () => void] {
  const enabled = useSyncExternalStore(
    subscribe,
    getMotionPreference,
    () => true,
  );
  return [
    enabled,
    () => {
      try {
        localStorage.setItem(key, getMotionPreference() ? "off" : "on");
      } catch {}
      window.dispatchEvent(new Event("dy-motion-change"));
    },
  ];
}
