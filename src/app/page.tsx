import Portfolio from "@/components/Portfolio";
import { siteUrl } from "@/data/portfolio";

export const metadata = {
  title: "Deepanshu Yadav | Frontend Developer & Full-Stack Engineer",
  description:
    "Deepanshu Yadav builds polished web, mobile, desktop, and AI-powered products with React, Next.js, TypeScript, and product-focused engineering.",
  alternates: { canonical: "/" },
  keywords: [
    "Deepanshu Yadav portfolio",
    "frontend developer India",
    "full stack engineer",
    "Next.js developer",
    "React portfolio",
    "TypeScript developer",
    "product engineer",
  ],
};

const profile = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Deepanshu Yadav",
      description:
        "Portfolio website of Deepanshu Yadav, a frontend developer and full-stack engineer building modern digital products in India.",
      inLanguage: "en-IN",
      publisher: {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: "Deepanshu Yadav",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Deepanshu Yadav",
      url: siteUrl,
      jobTitle: "Frontend Developer and Full-Stack Engineer",
      description:
        "Information Technology undergraduate building polished web, mobile, desktop, and interactive 3D applications with product-focused engineering.",
      knowsAbout: [
        "React",
        "Next.js",
        "TypeScript",
        "Full-stack development",
        "React Native",
        "Three.js",
        "Rust",
        "AI product development",
        "Product design systems",
      ],
      alumniOf: "Chandigarh University",
      worksFor: "IIT Mandi AcadLMS",
      sameAs: [
        "https://github.com/Deepanshu0211",
        "https://www.linkedin.com/in/deepanshuyad/",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What does Deepanshu Yadav build?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Deepanshu Yadav builds modern web apps, mobile products, desktop tools, and interactive experiences using React, Next.js, TypeScript, Node.js, and product-focused engineering.",
          },
        },
        {
          "@type": "Question",
          name: "Where is Deepanshu Yadav based?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Deepanshu Yadav is based in India and works across frontend, full-stack, and product engineering projects for real users and businesses.",
          },
        },
        {
          "@type": "Question",
          name: "What technologies does Deepanshu Yadav use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Deepanshu Yadav works with React, Next.js, TypeScript, JavaScript, React Native, Firebase, Supabase, PostgreSQL, Tauri, GSAP, Three.js, and Rust.",
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profile).replace(/</g, "\\u003c"),
        }}
      />
      <Portfolio />
    </>
  );
}
