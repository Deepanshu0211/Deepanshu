export { projects } from "@/data/portfolio";
export const experience = [
  { company: "IIT Mandi", role: "Frontend Developer · AcadLMS", dates: "July 2026 — present", detail: "Contributing to an academic management platform for students and faculty. Building interfaces that make everyday academic work easier to navigate." },
  { company: "Ethixweb", role: "Full Stack Developer Intern", dates: "August — September 2026", detail: "Built web applications with React, Node.js, and MongoDB, working across database optimization, REST APIs, and frontend performance." },
  { company: "QSentia", role: "Software Development Intern", dates: "May — July 2026", detail: "Worked on an AI-powered financial research platform with TypeScript and Next.js, including interactive dashboards and real-time data visualization." },
];
export const skills = ["React", "Next.js", "TypeScript", "Three.js", "React Native", "Rust", "Tauri", "GSAP", "Node.js", "MongoDB", "Firebase", "Expo", "Supabase", "PostgreSQL"];
export const contact = { email: "dy3239073@gmail.com", github: "https://github.com/Deepanshu0211", linkedin: "https://www.linkedin.com/in/deepanshuyad/", resume: "/Deepanshu-Yadav-Resume.pdf" };
// From the résumé and public GitHub profile. LinkedIn does not allow its pages to be read without signing in.
export const profile = {
  name: "Deepanshu Yadav",
  headline: "Frontend & Full-Stack Developer · B.Tech IT, Chandigarh University",
  location: "India",
  about: "B.Tech Information Technology undergraduate and frontend/full-stack developer with hands-on experience across internships, academic platforms and production applications. Currently contributing as a Frontend Developer to IIT Mandi's AcadLMS, building web, mobile, desktop and AI-assisted applications.",
  education: [
    { school: "Chandigarh University", degree: "Bachelor of Technology, Information Technology", dates: "2026 — 2030 (expected)" },
    { school: "AGSS Centre of Distance Education", degree: "Senior Secondary (12th) · 86%", dates: "Prayagraj" },
  ],
  certifications: [
    { title: "Google Solution Challenge 2026 — Build with AI", issuer: "Hack2skill", date: "July 2026", credential: "2026H2S07SCBWAI-TH00077" },
    { title: "OCI 2025 Certified AI Foundations Associate", issuer: "Oracle", date: "August 2025", credential: "" },
    { title: "Web Development Workshop", issuer: "Indian Institute of Technology Bombay", date: "December 2025", credential: "aa75fe04" },
  ],
  skillGroups: [
    ["Languages", "TypeScript, JavaScript, Python, Rust"],
    ["Frontend", "React, Next.js, React Native, Tailwind CSS, Framer Motion, shadcn/ui"],
    ["Backend & APIs", "Node.js, Express, Firebase, Supabase, REST APIs"],
    ["Databases", "PostgreSQL, MySQL, Firestore"],
    ["Tools", "Git, GitHub, Tauri, Expo, Vite, Oracle Cloud"],
    ["Interactive & AI", "GSAP, Three.js, AI-assisted applications, automation"],
  ] as [string, string][],
  github: { handle: "Deepanshu0211", bio: "Full Stack Developer | CS & AI Engineer. Teaching machines, reshaping systems, bridging code to the physical world.", repos: 42, followers: 72, top: [["Neatify", 23], ["Desktop-Organizer", 7], ["Impact_hub", 3]] as [string, number][] },
};
