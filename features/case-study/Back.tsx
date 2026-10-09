"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ui } from "@/lib/store";

/**
 * "← Back" on a case study, also bound to Escape. Coming from the project list it steps back
 * through history; otherwise (a direct visit) it goes to the project's row on the home page.
 */
export function Back({ slug }: { slug: string }) {
  const router = useRouter();
  const href = `/#work-${slug}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName ?? "";
      if (e.key !== "Escape" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (ui.getState().lastCase === slug) router.back();
      else router.push(href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, slug, href]);

  return (
    <Link
      href={href}
      data-cursor="Back"
      onClick={(e) => {
        if (ui.getState().lastCase !== slug || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        router.back();
      }}
    >
      ← Back · Esc
    </Link>
  );
}
