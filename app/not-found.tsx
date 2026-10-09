import type { Metadata } from "next";
import Link from "next/link";

import { Cursor, ParticleCanvas } from "@/components/Chrome";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SHAPE } from "@/content/projects";
import { CaseExperience } from "@/features/motion/CaseExperience";
import { RequestLog } from "@/features/not-found/RequestLog";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `404 · ${site.shortName}` };

/** 404 (out/404.html): a broken light bulb in particles, with the case pages' motion layer. */
export default function NotFound() {
  return (
    <>
      <ParticleCanvas />
      <main className="case lost">
        <div className="case-in">
          <span className="mono muted">{"// error 404 · not found"}</span>
          <h1>This page burnt out.</h1>
          <p className="lede">
            The link is broken or the route never shipped. Everything else is still switched on.
          </p>
          <RequestLog />
          <div className="glass">
            <Link href="/" aria-label="Back home" data-cursor="Home">
              cd ~
            </Link>
            <Link href="/#work" aria-label="See work" data-cursor="Work">
              ls ./work
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </main>
      <Cursor />
      <CaseExperience shape={SHAPE.bulb} />
    </>
  );
}
