import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { siteUrl } from "@/data/portfolio";
import "./globals.css";
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "Deepanshu Yadav | Frontend Developer, Full-Stack Engineer & Product Builder",
    template: "%s | Deepanshu Yadav",
  },
  description:
    "Deepanshu Yadav is a frontend developer and full-stack engineer in India building modern React, Next.js, mobile, and AI-powered products. Explore portfolio projects, case studies, and product work.",
  keywords: [
    "Deepanshu Yadav",
    "frontend developer India",
    "full stack developer India",
    "Next.js developer",
    "React developer",
    "TypeScript developer",
    "software engineer India",
    "portfolio website",
    "web app developer",
    "mobile app developer",
    "desktop app developer",
    "AI product developer",
    "three.js developer",
    "Rust developer",
    "IIT Mandi AcadLMS",
    "product builder",
    "creative developer",
  ],
  applicationName: "Deepanshu Yadav Portfolio",
  authors: [{ name: "Deepanshu Yadav", url: siteUrl }],
  creator: "Deepanshu Yadav",
  publisher: "Deepanshu Yadav",
  category: "technology",
  alternates: {
    canonical: "/",
    languages: { "en-US": "/" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Deepanshu Yadav | Frontend & Full-Stack Developer",
    description:
      "I build polished digital products with React, Next.js, TypeScript, mobile apps, desktop tools, and interactive experiences for real users.",
    url: siteUrl,
    siteName: "Deepanshu Yadav",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Deepanshu Yadav portfolio preview for frontend and full-stack development work",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deepanshu Yadav | Frontend & Full-Stack Developer",
    description:
      "Building web, mobile, desktop, AI, and interactive experiences with React, Next.js, TypeScript, and product-driven thinking.",
    images: ["/opengraph-image"],
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
