export interface Project {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  image: string;
  description: string;
  tech: string[];
  year: string;
  link?: string;
  github?: string;
}

export const projectsList: Project[] = [
  {
    id: "suzu",
    name: "Suzu",
    subtitle: "Anime Timer App",
    category: "Desktop & Web Application",
    image: "/images/suzu.jpg",
    description:
      "An anime-inspired Pomodoro productivity desktop and web application designed to create immersive, peaceful focus sessions with lo-fi soundscapes, ambient anime visuals, and customized session tracking.",
    tech: ["Next.js", "Tauri", "Tailwind CSS", "TypeScript", "Web Audio API"],
    year: "2024",
    link: "https://github.com",
    github: "https://github.com",
  },
  {
    id: "neatify",
    name: "Neatify",
    subtitle: "Windows Productivity App",
    category: "Native Windows Utility",
    image: "/images/neatify.jpg",
    description:
      "A modern Windows 11 productivity and workspace organizer with fluent acrylic glass design, automated desktop file clustering, smart tagging, and quick task management.",
    tech: ["Rust", "Tauri", "React", "TypeScript", "WinUI 3"],
    year: "2024",
    link: "https://github.com",
    github: "https://github.com",
  },
  {
    id: "impact-hub",
    name: "Impact Hub",
    subtitle: "Volunteer & NGO Platform",
    category: "Crisis Telemetry Platform",
    image: "/images/impact-hub.jpg",
    description:
      "A real-time emergency disaster relief coordination platform connecting active volunteer teams and NGO supply shipments with live GIS mapping, alerts, and operational telemetry.",
    tech: ["Next.js", "Node.js", "PostgreSQL", "Supabase", "Mapbox GL"],
    year: "2023",
    link: "https://github.com",
    github: "https://github.com",
  },
  {
    id: "ethixweb",
    name: "Ethixweb Dashboard",
    subtitle: "Client Management System",
    category: "Enterprise SaaS",
    image: "/images/ethixweb.jpg",
    description:
      "A comprehensive client relations and revenue analytics platform built for high-growth digital agencies, featuring automated invoicing, pipeline metrics, and client portal management.",
    tech: ["React", "Express", "Node.js", "MongoDB", "Tailwind CSS"],
    year: "2023",
    link: "https://github.com",
    github: "https://github.com",
  },
];

export const toolsList = [
  { name: "React", icon: "react" },
  { name: "Next.js", icon: "nextjs" },
  { name: "Tailwind", icon: "tailwind" },
  { name: "Node.js", icon: "nodejs" },
  { name: "Express", icon: "express" },
  { name: "Python", icon: "python" },
  { name: "MongoDB", icon: "mongodb" },
  { name: "PostgreSQL", icon: "postgresql" },
  { name: "Tauri", icon: "tauri" },
  { name: "Rust", icon: "rust" },
  { name: "AWS", icon: "aws" },
  { name: "Vercel", icon: "vercel" },
  { name: "Supabase", icon: "supabase" },
  { name: "Firebase", icon: "firebase" },
  { name: "Figma", icon: "figma" },
] as const;

export type ToolIconName = (typeof toolsList)[number]["icon"];

export const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Blog", href: "#experience" },
  { label: "Contact", href: "#contact" },
] as const;

export const currentlyItems = [
  { label: "Building cool things", color: "color-blue" },
  { label: "Exploring new tech", color: "color-orange" },
  { label: "Studying & improving", color: "color-green" },
  { label: "Open to opportunities", color: "color-purple" },
] as const;

export const socialLinks = [
  { name: "GitHub", href: "https://github.com", icon: "github" },
  { name: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
  { name: "Twitter/X", href: "https://x.com", icon: "twitter" },
  { name: "Instagram", href: "https://instagram.com", icon: "instagram" },
] as const;
