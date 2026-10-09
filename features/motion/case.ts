import { gsap } from "gsap";

import { prefersReducedMotion } from "@/lib/media";

import {
  gather,
  type MotionEnv,
  startCursor,
  startGlass,
  startParticles,
  startSmoothScroll,
} from "./shared";

/**
 * Case study pages: the same smooth scroll, glass, cursor and particle cloud as home, with the
 * cloud held on the project's own shape. Returns a cleanup, like `initExperience`.
 */
export function initCaseExperience(shape: number): () => void {
  const reduce = prefersReducedMotion();
  const ac = new AbortController();
  const { signal } = ac;
  const cleanups: (() => void)[] = [];
  const env: MotionEnv = { signal, cleanups, reduce };
  // There is no preloader here; dropping the class also tells home not to run it later.
  document.documentElement.classList.remove("js-loading");

  const ctx = gsap.context(() => {
    startSmoothScroll(env);
    startGlass(env);
    startCursor(env);
  });

  void startParticles(env, { scroll: () => ({ seg: 0, po: 0 }), shape }).then((p) => {
    if (p && !reduce) gather(p);
  });

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
    ctx.revert();
  };
}
