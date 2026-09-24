export const projects = [
  {
    name: "ImpactHub",
    category: "FULL-STACK / AI",
    type: "impact",
    tagline: "Technology that shows up when it matters.",
    description:
      "A disaster-response platform connecting incident reporting, real-time geographic visualization, AI-assisted report processing, and volunteer coordination.",
    stack: ["Next.js", "Firebase", "AI"],
    live: "https://theimpacthub.in",
    github: "https://github.com/Deepanshu0211/Impact_hub",
  },
  {
    name: "Neatify",
    category: "DESKTOP / AUTOMATION",
    type: "neatify",
    tagline: "Less searching. More doing.",
    description:
      "A cross-platform desktop file manager with automated organization, categorization, folder management, and reversible local file operations.",
    stack: ["Tauri", "React", "Rust"],
    github: "https://github.com/Deepanshu0211/Neatify",
  },
  {
    name: "Gurukul",
    category: "MOBILE / EDUCATION",
    type: "gurukul",
    tagline: "A little more connected. A lot more secure.",
    description:
      "A mobile attendance and student-safety system with role-based access, safety alerts, audit tracking, reporting, and database-backed workflows.",
    stack: ["React Native", "Expo", "Supabase", "PostgreSQL"],
    github: "https://github.com/Deepanshu0211/gurukul",
  },
  {
    name: "Demox",
    category: "CREATIVE DEVELOPMENT / 3D",
    type: "demox",
    tagline: "Motion with a point of view.",
    description:
      "A production portfolio for a graphic and motion designer, built with responsive interfaces, expressive animation, and interactive 3D experiences.",
    stack: ["React", "TypeScript", "GSAP", "Three.js"],
    live: "https://demox.in",
    github: "https://github.com/Deepanshu0211/demox",
  },
];
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://deepanshuyad.in"
).replace(/\/$/, "");
