import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { hasFinePointer } from "@/lib/media";
import { loadHead } from "@/features/particles/data";
import { prepareAsync } from "@/features/particles/prepareAsync";
import type { Particles, ScrollInput } from "@/features/particles/scene";

gsap.registerPlugin(ScrollTrigger);

/**
 * Effects every page shares (home and case studies). Each one registers its listeners on
 * `signal` and its teardown in `cleanups`; call them inside the page's `gsap.context`.
 */
export type MotionEnv = { signal: AbortSignal; cleanups: (() => void)[]; reduce: boolean };

export const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);

/** Lenis smooth scroll plus smooth in-page `#hash` links. Null under reduced motion. */
export function startSmoothScroll({ signal, cleanups, reduce }: MotionEnv): Lenis | null {
  let lenis: Lenis | null = null;
  if (!reduce) {
    const l = new Lenis({ lerp: 0.09 });
    lenis = l;
    l.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      l.destroy();
    });
  }
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const id = a?.getAttribute("href");
      const t = id && id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { duration: 1.6 });
      else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    },
    { signal },
  );
  return lenis;
}

export function startGlass({ signal, reduce }: MotionEnv): void {
  document.addEventListener(
    "pointermove",
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(".glass, .gbtn");
      if (!el) return;
      const b = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
    },
    { signal },
  );
  const glass = $("#glass");
  const blob = $("#blob");
  if (glass && blob) {
    glass.querySelectorAll("a, button").forEach((it) =>
      it.addEventListener(
        "pointerenter",
        () => {
          const b = glass.getBoundingClientRect();
          const r = it.getBoundingClientRect();
          gsap.to(blob, {
            left: r.left - b.left,
            width: r.width,
            opacity: 1,
            duration: reduce ? 0 : 0.6,
            ease: "elastic.out(1, .65)",
          });
        },
        { signal },
      ),
    );
    glass.addEventListener("pointerleave", () => gsap.to(blob, { opacity: 0, duration: 0.3 }), {
      signal,
    });
  }
}

/** Any element with data-cursor="Label" shows that label on the cursor while hovered. */
export function startCursor({ signal, cleanups, reduce }: MotionEnv): void {
  const me = $("#me");
  const meName = $("#meName");
  if (!me || !meName || !hasFinePointer() || reduce) return;
  const label = (t: string | null) => {
    if (t) meName.textContent = t;
    me.classList.toggle("label", !!t);
  };
  document.body.classList.add("has-cursor");
  cleanups.push(() => document.body.classList.remove("has-cursor"));
  const mx = gsap.quickTo(me, "x", { duration: 0.1, ease: "power3" });
  const my = gsap.quickTo(me, "y", { duration: 0.1, ease: "power3" });
  window.addEventListener("pointermove", (e) => (mx(e.clientX), my(e.clientY)), { signal });
  window.addEventListener("pointerdown", () => me.classList.add("press"), { signal });
  window.addEventListener("pointerup", () => me.classList.remove("press"), { signal });
  document.addEventListener("pointerleave", () => gsap.to(me, { opacity: 0, duration: 0.2 }), {
    signal,
  });
  document.addEventListener("pointerenter", () => gsap.to(me, { opacity: 1, duration: 0.2 }), {
    signal,
  });
  document.addEventListener(
    "pointerover",
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      if (el) label(el.dataset.cursor ?? null);
    },
    { signal },
  );
  document.addEventListener(
    "pointerout",
    (e) => {
      const from = (e.target as Element | null)?.closest("[data-cursor]");
      const to = (e.relatedTarget as Element | null)?.closest("[data-cursor]");
      if (from && from !== to) label(null);
    },
    { signal },
  );
}

/** Resolves to null if there is no canvas, the page was torn down, or loading failed (the canvas is then hidden). */
export async function startParticles(
  { signal, cleanups, reduce }: MotionEnv,
  opts: { scroll: () => ScrollInput | null },
): Promise<Particles | null> {
  const canvas = $<HTMLCanvasElement>("#gl");
  if (!canvas) return null;
  try {
    const [mod, data] = await Promise.all([
      import("@/features/particles/scene"),
      loadHead(signal).then((buf) => prepareAsync(buf, signal)),
    ]);
    if (signal.aborted) return null;
    const particles = mod.createParticles(canvas, data, {
      reduce,
      narrow: window.innerWidth < 760,
      ...opts,
    });
    cleanups.push(() => particles.dispose());
    return particles;
  } catch (err) {
    if (signal.aborted) return null;
    console.error(err);
    canvas.style.display = "none";
    return null;
  }
}

export function gather(particles: Particles): void {
  gsap.fromTo(particles.assemble, { value: 0 }, { value: 1, duration: 3, ease: "power2.inOut" });
}
