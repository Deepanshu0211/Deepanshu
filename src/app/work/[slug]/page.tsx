import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, siteUrl } from "@/data/portfolio";
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
    title: `${p.name} | ${p.category} Project by Deepanshu Yadav`,
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
      <header className="header">
        <Link href="/" className="brand" aria-label="Deepanshu Yadav portfolio">
          dy<span>®</span>
        </Link>
        <Link href="/#work" className="header-contact">
          All projects ↗
        </Link>
      </header>
      <main className="case-page">
        <span className="eyebrow orange">
          SELECTED WORK / 0{index + 1} / {p.category}
        </span>
        <h1>
          {p.name}
          <span className="orange">.</span>
        </h1>
        <p className="case-tagline">{p.tagline}</p>
        <div className="case-summary">
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
        <section className="case-capabilities">
          <h2>What it brings together</h2>
          <ul>
            {capabilities[slug].map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
        <div className="case-links">
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
        <div className="case-bottom">
          <Link href="/#work">← Back to selected work</Link>
          <Link href={`/work/${next.type}`}>NEXT PROJECT / {next.name} ↗</Link>
        </div>
      </main>
    </>
  );
}
