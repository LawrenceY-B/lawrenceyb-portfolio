import { gsap } from "gsap";

import { prefersReducedMotion } from "@/lib/media";
import type { Particles, ScrollInput } from "@/features/particles/scene";

import { gather, type MotionEnv, startCursor, startParticles } from "./shared";

/** Site-wide motion that survives navigations: the particle scene and the custom cursor. */
// Pages mount before the layout's effect runs, so they wait on this rather than on the load.
let resolve: (p: Particles | null) => void = () => {};
let settled = false;
let ready = new Promise<Particles | null>((r) => (resolve = r));
let current: Particles | null = null;
let siteCtx: gsap.Context | null = null;
let scrollSource: (() => ScrollInput) | null = null;

export const whenParticles = () => ready;
export const getParticles = () => current;

/**
 * Tweens on the cloud must live in the site's gsap context: GSAP runs callbacks in the context
 * that created them, so a page-owned tween is reverted when that page unmounts. `ignore()`
 * first, or `add()` nests the whole site context inside the caller's.
 */
export function gatherCloud(p: Particles | null = current): boolean {
  const ctx = siteCtx;
  if (!p || !ctx) return false;
  ctx.ignore(() => ctx.add(() => gather(p)));
  return true;
}

/** null holds the cloud at its last scroll position. */
export function setScrollSource(fn: (() => ScrollInput) | null): void {
  scrollSource = fn;
}

export function initSiteMotion(): () => void {
  const root = document.documentElement;
  const reduce = prefersReducedMotion();
  const ac = new AbortController();
  const cleanups: (() => void)[] = [];
  const env: MotionEnv = { signal: ac.signal, cleanups, reduce };

  const ctx = gsap.context(() => startCursor(env));
  siteCtx = ctx;
  void startParticles(env, { scroll: () => scrollSource?.() ?? null }).then((p) => {
    if (ac.signal.aborted) return;
    // Home's preloader gathers the cloud as part of its intro; everywhere else, gather now.
    if (p && !reduce && !root.classList.contains("js-loading")) gatherCloud(p);
    current = p;
    settled = true;
    resolve(p);
  });

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
    ctx.revert();
    siteCtx = null;
    current = null;
    // A settled promise points at the disposed scene; start a fresh one for the next mount.
    if (settled) {
      settled = false;
      ready = new Promise((r) => (resolve = r));
    }
  };
}
