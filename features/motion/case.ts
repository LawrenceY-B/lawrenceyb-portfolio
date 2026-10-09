import { gsap } from "gsap";

import { prefersReducedMotion } from "@/lib/media";

import { ui } from "@/lib/store";

import { type MotionEnv, startGlass, startSmoothScroll } from "./shared";

/**
 * Case study pages and the 404: the same smooth scroll and glass as home, with the site-wide
 * particle cloud held on the page's shape (it morphs there from whatever was showing).
 * Returns a cleanup, like `initExperience`.
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
    // Content rises in under the morphing title, as the old case sheet did.
    if (!reduce)
      gsap.from(".case .lede, .case .facts, .case .chapters, .case .log, .case-nav, .lost .glass", {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.07,
        delay: 0.2,
        ease: "power3.out",
      });
  });
  ui.setState({ sceneShape: shape });
  cleanups.push(() => ui.setState({ sceneShape: null }));

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
    ctx.revert();
  };
}
