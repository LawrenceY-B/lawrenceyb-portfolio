import type { Metadata } from "next";
import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";
import { TiltToggle } from "@/components/TiltToggle";
import { SHAPE } from "@/content/projects";
import { CaseExperience } from "@/features/motion/CaseExperience";
import { Terminal } from "@/features/not-found/Terminal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `404 · ${site.shortName}` };

export default function NotFound() {
  return (
    <>
      <main className="case lost">
        <div className="case-in">
          <span className="mono muted">{"// error 404 · not found"}</span>
          <h1>This page burnt out.</h1>
          <p className="lede">
            The link is broken or the route never shipped. Everything else is still switched on.
          </p>
          <Terminal />
          <div className="glass">
            <Link href="/" aria-label="Back home" data-cursor="Home">
              cd ~
            </Link>
            <ThemeToggle />
            <TiltToggle />
          </div>
        </div>
      </main>
      <CaseExperience shape={SHAPE.bulb} />
    </>
  );
}
