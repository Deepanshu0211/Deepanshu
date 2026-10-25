import type { Metadata } from "next";
import CozyPortfolio from "@/components/CozyPortfolio";
import { projects, siteUrl } from "@/data/portfolio";

export const metadata: Metadata = {
  title: { absolute: "Deepanshu Yadav — Creative Developer & Full-Stack Engineer" },
  description: "Explore Deepanshu Yadav’s portfolio: thoughtful web, mobile and desktop products built with React, Next.js, TypeScript and Rust. Based in India.",
  alternates: { canonical: "/" },
};

const profile = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl,
      name: "Deepanshu Yadav", inLanguage: "en-IN",
      publisher: { "@id": `${siteUrl}/#person` },
    },
    {
      "@type": "ProfilePage", "@id": `${siteUrl}/#profile`, url: siteUrl,
      name: "Deepanshu Yadav — Creative Developer & Full-Stack Engineer",
      description: "The portfolio of Deepanshu Yadav, a developer in India working across web, mobile, desktop and interactive experiences.",
      isPartOf: { "@id": `${siteUrl}/#website` },
      mainEntity: { "@id": `${siteUrl}/#person` },
      hasPart: { "@id": `${siteUrl}/#selected-work` }, inLanguage: "en-IN",
    },
    {
      "@type": "Person", "@id": `${siteUrl}/#person`, name: "Deepanshu Yadav", url: siteUrl,
      jobTitle: "Creative Developer and Full-Stack Engineer",
      description: "Information Technology student at Chandigarh University, contributing to IIT Mandi’s AcadLMS and building web, mobile and desktop products.",
      homeLocation: { "@type": "Country", name: "India" },
      knowsAbout: ["React", "Next.js", "TypeScript", "Full-stack development", "React Native", "Three.js", "Rust", "GSAP"],
      sameAs: ["https://github.com/Deepanshu0211", "https://www.linkedin.com/in/deepanshuyad/"],
    },
    {
      "@type": "ItemList", "@id": `${siteUrl}/#selected-work`, name: "Selected development projects",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem", position: index + 1, name: project.name,
        url: `${siteUrl}/work/${project.type}`,
      })),
    },
  ],
};

export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} /><CozyPortfolio /></>;
}

