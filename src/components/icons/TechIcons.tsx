import React from "react";
import type { ToolIconName } from "@/data/projects";

const icons: Record<ToolIconName, React.ReactNode> = {
  react: (
    <svg viewBox="-11.5 -10.23 23 20.46" width="14" height="14">
      <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),
  nextjs: (
    <svg viewBox="0 0 180 180" width="13" height="13">
      <circle cx="90" cy="90" r="90" fill="#000" />
      <path
        fill="url(#ngrad)"
        d="M149.5 157.5L69.1 54H54v72h12.1V69.4l72.9 94a90.3 90.3 0 0010.5-5.9z"
      />
      <path fill="#fff" d="M115 54h12v72h-12z" />
      <defs>
        <linearGradient id="ngrad" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  ),
  tailwind: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#38bdf8">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
    </svg>
  ),
  nodejs: (
    <svg viewBox="0 0 32 32" width="13" height="13">
      <path fill="#539e43" d="M16 2.5l12.5 7.2v14.6L16 31.5 3.5 24.3V9.7L16 2.5zm0 3.2L6.3 11.3v9.4L16 26.3l9.7-5.6v-9.4L16 5.7z" />
    </svg>
  ),
  express: (
    <span style={{ fontWeight: 700, fontSize: "9.5px", color: "#111" }}>ex</span>
  ),
  python: (
    <svg viewBox="0 0 110 110" width="13" height="13">
      <path fill="#3776ab" d="M54.5 7.5c-24.8 0-23.2 10.7-23.2 10.7l.03 11.1h23.6v3.3H21.8S7.5 31 7.5 55.7c0 24.8 12.4 23.9 12.4 23.9h7.4v-10.4s-.4-12.4 12.2-12.4h23.6s11.7.2 11.7-11.4V19.2s1.7-11.7-20.3-11.7zm-13.1 7.4a3.8 3.8 0 110 7.6 3.8 3.8 0 010-7.6z" />
      <path fill="#ffd43b" d="M55.5 102.5c24.8 0 23.2-10.7 23.2-10.7l-.03-11.1H55.1v-3.3h33.1s14.3 1.6 14.3-23.1c0-24.8-12.4-23.9-12.4-23.9h-7.4v10.4s.4 12.4-12.2 12.4H46.9s-11.7-.2-11.7 11.4v16.2s-1.7 11.7 20.3 11.7zm13.1-7.4a3.8 3.8 0 110-7.6 3.8 3.8 0 010 7.6z" />
    </svg>
  ),
  mongodb: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#47a248">
      <path d="M12 2C12 2 7 8 7 13.5C7 17.5 9.5 20.5 12 22C14.5 20.5 17 17.5 17 13.5C17 8 12 2 12 2ZM12 20.5C10.5 19.5 8.5 17 8.5 13.5C8.5 9.5 11.5 5 11.5 5V20.5H12Z" />
    </svg>
  ),
  postgresql: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#336791">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
      <circle cx="9" cy="10" r="1.5" fill="#336791" />
      <circle cx="15" cy="10" r="1.5" fill="#336791" />
      <path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="#336791" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  tauri: (
    <svg viewBox="0 0 24 24" width="13" height="13">
      <circle cx="8" cy="12" r="5" fill="#24c8db" />
      <circle cx="16" cy="12" r="5" fill="#ffc131" />
      <circle cx="12" cy="12" r="3" fill="#ffffff" />
    </svg>
  ),
  rust: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#dea584">
      <circle cx="12" cy="12" r="9" stroke="#000" strokeWidth="2" fill="none" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#000">R</text>
    </svg>
  ),
  aws: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#ff9900">
      <path d="M18.5 13.5c-2.8 2-6.5 3-10.2 3-4.8 0-9.2-1.8-12.8-4.8-.3-.2 0-.6.3-.4 3.5 2.5 7.7 4 12.3 4 3.4 0 6.8-.9 9.8-2.6.5-.3.9.3.6.8z" />
      <path d="M19.7 12.3c-.4-.5-2.4-.2-3.3-.1-.3 0-.3-.3 0-.5 1.7-1.2 4.4-.9 4.7-.5.4.4.1 3.2-1.5 4.6-.3.2-.5.1-.4-.2.4-.9.8-2.8.5-3.3z" />
    </svg>
  ),
  vercel: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="#000">
      <path d="M12 1L24 22H0L12 1Z" />
    </svg>
  ),
  supabase: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="#3ecf8e">
      <path d="M13.5 2L3 14.5h8L8.5 22 21 9.5h-7.5L13.5 2z" />
    </svg>
  ),
  firebase: (
    <svg viewBox="0 0 24 24" width="13" height="13">
      <path fill="#ffa000" d="M4 18l5-12 3 5z" />
      <path fill="#f57c00" d="M12 11l3-5 5 12z" />
      <path fill="#ffca28" d="M4 18l8 4 8-4-8-7z" />
    </svg>
  ),
  figma: (
    <svg viewBox="0 0 38 57" width="11" height="14">
      <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  ),
};

// Social icons
export const socialIcons: Record<string, React.ReactNode> = {
  github: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  ),
  twitter: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  email: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
};

export function TechIcon({ name }: { name: ToolIconName }) {
  return <span className="tool-svg-icon">{icons[name]}</span>;
}

export default TechIcon;
