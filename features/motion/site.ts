import { gsap } from "gsap";

import { prefersReducedMotion } from "@/lib/media";
import type { Particles, ScrollInput } from "@/features/particles/scene";

import { gather, type MotionEnv, startCursor, startParticles } from "./shared";

/**
 * Site-wide motion that outlives page navigations: the particle scene and the custom cursor.
 * Mounted once from the root layout, so the cloud morphs between pages instead of reloading.
 * Pages steer it: home plugs in its scroll input, case studies and the 404 hold a shape
 * (`sceneShape` in the store).
 */
// Pages mount before the layout's effect runs, so they wait on this rather than on the load.
let resolve: (p: Particles | null) => void = () => {};
let settled = false;
let ready = new Promise<Particles | null>((r) => (resolve = r));
let current: Particles | null = null;
let siteCtx: gsap.Context | null = null;
let scrollSource: (() => ScrollInput) | null = null;

/** The particle scene once it has loaded (null if it failed or there is no canvas). */
export const whenParticles = () => ready;
/** The loaded scene right now, if any. */
export const getParticles = () => current;

/**
 * Gathers the cloud in from scattered. The tween must belong to the site's gsap context, not
 * the caller's: GSAP runs callbacks in the context that created them, so a page-owned tween
 * would be reverted (scattering the cloud) when that page unmounts. `ignore` clears the
 * caller's context first; calling `add` with it still active would nest the whole site
 * context inside the page's, and leaving the page would revert the cursor too.
 */
export function gatherCloud(p: Particles | null = current): boolean {
  const ctx = siteCtx;
  if (!p || !ctx) return false;
  ctx.ignore(() => ctx.add(() => gather(p)));
  return true;
}

/** Home registers its scroll-driven input; pass null on teardown to hold the last position. */
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
