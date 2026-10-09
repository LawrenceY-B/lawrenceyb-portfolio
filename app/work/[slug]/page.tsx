import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, ViewTransition } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { getProject, projects } from "@/content/projects";
import { Back } from "@/features/case-study/Back";
import { MORPH, titleName } from "@/features/case-study/transitions";
import { CaseExperience } from "@/features/motion/CaseExperience";
import { site } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

// Static export: only the slugs below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const found = getProject((await params).slug);
  if (!found) return {};
  const { project: p } = found;
  const title = `${p.name} · Case study · ${site.shortName}`;
  const url = `/work/${p.slug}`;
  return {
    title,
    description: p.lede,
    alternates: { canonical: url },
    openGraph: { type: "article", url, siteName: site.shortName, title, description: p.lede },
    twitter: { card: "summary_large_image", title, description: p.lede },
  };
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const found = getProject((await params).slug);
  if (!found) notFound();
  const { project: p, index } = found;
  // Wraps around, so both always exist.
  const prev = projects[(index - 1 + projects.length) % projects.length]!;
  const next = projects[(index + 1) % projects.length]!;

  return (
    <>
      <main className="case">
        <div className="case-in">
          <div className="case-top">
            <div className="glass">
              <Back slug={p.slug} />
              <ThemeToggle />
            </div>
            <span className="mono muted">
              {`// case study ${pad(index + 1)} / ${pad(projects.length)}`}
            </span>
          </div>
          <ViewTransition name={titleName(p.slug)} share={MORPH} default="none">
            <h1>{p.name}</h1>
          </ViewTransition>
          <p className="lede">{p.lede}</p>
          <div className="facts">
            {p.facts.map((f) => (
              <div key={f.label}>
                <span className="mono muted">{f.label}</span>
                {"value" in f
                  ? f.value
                  : f.links.map((l, k) => (
                      <Fragment key={l.href}>
                        {k > 0 && " · "}
                        <a href={l.href} target="_blank" rel="noopener noreferrer">
                          {l.label}
                        </a>
                      </Fragment>
                    ))}
              </div>
            ))}
          </div>
          <div className="chapters">
            {p.body.map((b) => (
              <section key={b.label}>
                <span className="mono muted">{b.label}</span>
                <p>{b.text}</p>
              </section>
            ))}
          </div>
          <nav className="case-nav" aria-label="More case studies">
            <Link
              href={`/work/${prev.slug}`}
              rel="prev"
              data-cursor="Open case"
              transitionTypes={["nav-back"]}
            >
              <span className="mono muted">← Previous</span>
              <ViewTransition name={titleName(prev.slug)} share={MORPH} default="none">
                <span className="case-nav-t">{prev.name}</span>
              </ViewTransition>
            </Link>
            <Link
              href={`/work/${next.slug}`}
              rel="next"
              data-cursor="Open case"
              transitionTypes={["nav-forward"]}
            >
              <span className="mono muted">Next →</span>
              <ViewTransition name={titleName(next.slug)} share={MORPH} default="none">
                <span className="case-nav-t">{next.name}</span>
              </ViewTransition>
            </Link>
          </nav>
        </div>
      </main>
      <CaseExperience shape={p.shape} />
    </>
  );
}
