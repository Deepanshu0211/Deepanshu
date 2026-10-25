import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, siteUrl } from "@/data/portfolio";
import ProjectCover from "@/components/ProjectCover";
import CaseMotion from "@/components/CaseMotion";
const capabilities: Record<string, string[]> = {
  impact: [
    "Incident reporting",
    "Real-time geographic visualization",
    "AI-assisted report processing",
    "Volunteer coordination",
  ],
  neatify: [
    "Automated file organization",
    "File categorization",
    "Folder management",
    "Reversible local file operations",
  ],
  gurukul: [
    "Role-based access",
    "Attendance management",
    "Student safety alerts",
    "Audit tracking and reporting",
  ],
  demox: [
    "Responsive portfolio development",
    "Motion and animation",
    "Interactive 3D experiences",
    "Production website delivery",
  ],
};
export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.type }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((project) => project.type === slug);
  if (!p) return {};

  const keywords = [
    p.name,
    p.category,
    "Deepanshu Yadav",
    "portfolio project",
    ...p.stack,
    "web app",
    "product development",
  ];

  return {
    title: `${p.name} — ${p.category}`,
    description: `${p.description} Built with ${p.stack.join(", ")}. A product-focused case study from Deepanshu Yadav's portfolio.`,
    keywords,
    authors: [{ name: "Deepanshu Yadav", url: siteUrl }],
    creator: "Deepanshu Yadav",
    publisher: "Deepanshu Yadav",
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: `${p.name} by Deepanshu Yadav`,
      description: `${p.description} Built with ${p.stack.join(", ")}.`,
      url: `${siteUrl}/work/${slug}`,
      siteName: "Deepanshu Yadav",
      type: "article",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.name} by Deepanshu Yadav`,
      description: `${p.description} Built with ${p.stack.join(", ")}.`,
      images: ["/opengraph-image"],
    },
  };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.type === slug);
  if (index < 0) notFound();
  const p = projects[index],
    next = projects[(index + 1) % projects.length];
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: p.name,
        description: `${p.description} Built with ${p.stack.join(", ")}.`,
        url: `${siteUrl}/work/${slug}`,
        genre: p.category,
        creator: { "@type": "Person", name: "Deepanshu Yadav", url: siteUrl },
        author: { "@type": "Person", name: "Deepanshu Yadav", url: siteUrl },
        keywords: [...new Set([p.name, p.category, ...p.stack, "Deepanshu Yadav", "portfolio project"])].join(", "),
        inLanguage: "en-IN",
        about: p.stack,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Portfolio",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: p.name,
            item: `${siteUrl}/work/${slug}`,
          },
        ],
      },
      {
        "@type": "WebPage",
        url: `${siteUrl}/work/${slug}`,
        name: `${p.name} | ${p.category} Project by Deepanshu Yadav`,
        description: `${p.description} Built with ${p.stack.join(", ")}.`,
        isPartOf: { "@id": `${siteUrl}/#website` },
        breadcrumb: { "@id": `${siteUrl}/work/${slug}#breadcrumb` },
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(json).replace(/</g, "\\u003c"),
        }}
      />
      <header className="header orbit-case-header">
        <Link href="/" className="brand" aria-label="Deepanshu Yadav portfolio">
          dy<span>®</span>
        </Link>
        <Link href="/#work" className="header-contact">
          All projects ↗
        </Link>
      </header>
      <CaseMotion />
      <main className="case-page case-orbit">
        <span className="eyebrow orange">
          SELECTED WORK / 0{index + 1} / {p.category}
        </span>
        <h1 aria-label={p.name}>
          <span className="case-title-mask" aria-hidden="true">
            {[...p.name].map((letter, i) => (
              <span key={i} data-case-letter>{letter}</span>
            ))}
            <span data-case-letter className="orange">.</span>
          </span>
        </h1>
        <p className="case-tagline">{p.tagline}</p>
        <div className="case-cover" aria-label={`${p.name} project artwork`}>
          <ProjectCover type={p.type} />
        </div>
        <div className="case-summary" data-case-reveal>
          <div>
            <h2>The project</h2>
            <p>{p.description}</p>
          </div>
          <div>
            <h2>Under the hood</h2>
            <div className="tags">
              {p.stack.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>
        <section className="case-capabilities" data-case-reveal>
          <h2>What it brings together</h2>
          <ul>
            {capabilities[slug].map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
        {slug === "neatify" && (
          <section data-case-reveal style={{
            margin: "48px 0",
            padding: "32px",
            background: "#F7F1E4",
            border: "1.5px solid #1F1A17",
            borderRadius: "4px",
            boxShadow: "4px 6px 0px rgba(31, 26, 23, 0.12)"
          }}>
            <span style={{
              font: "9px var(--font-mono)",
              letterSpacing: "0.12em",
              color: "#9A4522",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              BRAND IDENTITY & DIGITAL COMPANION
            </span>
            <h2 style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              fontFamily: "var(--font-serif)",
              margin: "12px 0 16px",
              color: "#1F1A17"
            }}>
              The Woodland Housekeeper
            </h2>
            <p style={{
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#4A3E34",
              maxWidth: "720px",
              marginBottom: "24px"
            }}>
              Neatify doesn’t feel like sterile productivity software. It’s accompanied by an original, calm, curious woodland housekeeper: folded sage hood, cream linen tunic, forest outline, and a square satchel. Built with genuine pixel-authoring across 10 distinct emotional states to turn everyday file organization into a serene tactile experience.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "12px",
              background: "#fff",
              padding: "16px",
              borderRadius: "4px",
              border: "1px solid #E3D6BC"
            }}>
              {[
                { name: "Idle", img: "/mascot/expressions/idle.png" },
                { name: "Organizing", img: "/mascot/expressions/organizing.png" },
                { name: "Scanning", img: "/mascot/expressions/scanning.png" },
                { name: "Carrying", img: "/mascot/expressions/carrying.png" },
                { name: "Celebrating", img: "/mascot/expressions/celebrating.png" }
              ].map((m) => (
                <div key={m.name} style={{ textAlign: "center", padding: "10px" }}>
                  <img
                    src={m.img}
                    alt={m.name}
                    style={{
                      width: "72px",
                      height: "72px",
                      imageRendering: "pixelated",
                      display: "block",
                      margin: "0 auto 8px"
                    }}
                  />
                  <span style={{ font: "10px var(--font-mono)", color: "#1F1A17", fontWeight: 600 }}>
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="case-links" data-case-reveal>
          {p.live && (
            <a
              className="solid-button"
              href={p.live}
              target="_blank"
              rel="noreferrer"
            >
              Visit live site ↗
            </a>
          )}
          <a
            className="text-link"
            href={p.github}
            target="_blank"
            rel="noreferrer"
          >
            Explore the code ↗
          </a>
        </div>
        <div className="case-bottom" data-case-reveal>
          <Link href="/#work">← Back to selected work</Link>
          <Link href={`/work/${next.type}`}>NEXT PROJECT / {next.name} ↗</Link>
        </div>
      </main>
    </>
  );
}
