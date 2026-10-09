"use client";

import Link from "next/link";
import { useEffect, ViewTransition } from "react";

import type { Project } from "@/content/projects";
import { ui } from "@/lib/store";

import { MORPH, titleName } from "./transitions";

const pad = (n: number) => String(n).padStart(2, "0");

/** Project rows. Hovering one forms its particle shape; clicking opens /work/<slug>. */
export function Work({ projects }: { projects: Project[] }) {
  // Leaving via a row never fires pointerleave; clear it so the same row can form its shape again.
  useEffect(() => () => ui.setState({ hoveredShape: null }), []);

  return (
    <ul className="rows">
      {projects.map((proj, i) => {
        const hover = () => ui.setState({ hoveredShape: proj.shape });
        const leave = () => ui.setState({ hoveredShape: null });
        return (
          <li
            key={proj.slug}
            id={`work-${proj.slug}`}
            className="row"
            data-inspect="ProjectRow"
            data-cursor="Open case"
            onPointerEnter={hover}
            onFocus={hover}
            onPointerLeave={leave}
            onBlur={leave}
          >
            <span className="mono muted">{pad(i + 1)}</span>
            <span>
              <ViewTransition name={titleName(proj.slug)} share={MORPH} default="none">
                <span className="t">{proj.name}</span>
              </ViewTransition>
              {proj.badge && <span className="badge">{proj.badge}</span>}
            </span>
            <span className="s mono muted">
              {proj.stack} · {proj.year}
            </span>
            <p className="d">{proj.desc}</p>
            <Link
              className="open"
              href={`/work/${proj.slug}`}
              transitionTypes={["nav-forward"]}
              aria-label={`Open case study: ${proj.name}`}
              onClick={() => ui.setState({ lastCase: proj.slug })}
            />
          </li>
        );
      })}
    </ul>
  );
}
