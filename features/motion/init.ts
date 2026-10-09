import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { prefersReducedMotion } from "@/lib/media";
import { ui } from "@/lib/store";
import { marketReady } from "@/features/market/store";
import type { ScrollInput } from "@/features/particles/scene";

import { $, type MotionEnv, startGlass, startSmoothScroll } from "./shared";
import { gatherCloud, setScrollSource, whenParticles } from "./site";
import { slotter } from "./slots";
import { scramble, split } from "./text";

const $$ = <T extends Element = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/**
 * Wires up every imperative effect on the page: smooth scroll, pinned slot sections, text
 * effects, the preloader and intro, glass highlights, the custom cursor and the particle scene.
 * Returns a cleanup that reverts all of it (React Strict Mode mounts effects twice in dev).
 */
export function initExperience(): () => void {
  const root = document.documentElement;
  const reduce = prefersReducedMotion();
  const ac = new AbortController();
  const { signal } = ac;
  const cleanups: (() => void)[] = [];
  const env: MotionEnv = { signal, cleanups, reduce };
  // No js-loading means the preloader already ran this visit (e.g. back from a case study).
  const returning = !root.classList.contains("js-loading");
  let introPlayed = false;
  let gathered = false;
  let buildST: ScrollTrigger | null = null;
  let offST: ScrollTrigger | null = null;

  const lenis = startSmoothScroll(env);

  const ctx = gsap.context(() => {
    /* ---------- Pinned slots ---------- */
    const build = $("#build");
    if (!reduce && build) {
      // Look these up once: ScrollTrigger can still fire while the page is torn down.
      const bIdx = $("#bIdx")!;
      const oIdx = $("#oIdx")!;
      const barFill = $("#barFill");
      const showB = slotter($$("#slot .w"), (n) => {
        bIdx.textContent = String(n + 1).padStart(2, "0");
        build.dataset.step = String(n);
      });
      buildST = ScrollTrigger.create({
        trigger: build,
        start: "top top",
        end: "+=240%",
        pin: true,
        scrub: true,
        onUpdate: (st) => {
          showB(Math.min(2, Math.floor(st.progress * 3)));
          gsap.set(barFill, { scaleX: 0.02 + st.progress * 0.98 });
        },
      });
      const chips = $$("#ochips .gbtn");
      const showD = slotter($$("#odesc p"));
      const showO = slotter($$("#oslot .w"), (n) => {
        oIdx.textContent = String(n + 1).padStart(2, "0");
        chips.forEach((c, k) => c.classList.toggle("hot", k === n));
        showD(n);
      });
      offST = ScrollTrigger.create({
        trigger: "#off",
        start: "top top",
        end: "+=230%",
        pin: true,
        scrub: true,
        onUpdate: (st) => showO(Math.min(2, Math.floor(st.progress * 3))),
      });
    }

    /* ---------- Text effects ---------- */
    const heroLines = reduce ? [] : $$('[data-fx="hero"]').map((el) => split(el).chars);
    if (!reduce) {
      $$('[data-fx="words"]').forEach((el) => {
        if (el.closest(".slot")) return;
        const { words } = split(el);
        gsap.from(words, {
          yPercent: 60,
          opacity: 0,
          stagger: 0.05,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      $$('[data-fx="scramble"]').forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: () => ctx.add(() => scramble(el)),
        }),
      );
      $$("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const o = { v: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () =>
            ctx.add(() =>
              gsap.to(o, {
                v: end,
                duration: 1.4,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = String(Math.round(o.v));
                },
              }),
            ),
        });
      });
    }

    /* ---------- Preloader + intro ---------- */
    const intro = () => {
      introPlayed = true;
      const tl = gsap.timeline();
      heroLines.forEach((chars, k) =>
        tl.from(chars, { yPercent: 115, stagger: 0.02, duration: 1, ease: "power4.out" }, k * 0.12),
      );
      tl.from(
        ".hello, .hero-foot > *",
        { opacity: 0, y: 12, duration: 0.8, stagger: 0.08 },
        0.4,
      ).from(".top", { yPercent: -100, duration: 0.9, ease: "power3.out" }, 0.1);
      // The cloud is site-wide and must survive this page's teardown, so keep it out of `tl`.
      gathered = gatherCloud();
    };
    const ready = marketReady();
    if (reduce || returning) {
      root.classList.remove("js-loading");
      introPlayed = true;
    } else {
      const t0 = performance.now();
      const lines = [
        "$ build lyb.portfolio",
        "  ✓ 15 shapes · 40,000 particles",
        "  ↓ GET /api/get-all-tbill",
        "  ↓ GET /api/gse/market",
        "  ↓ GET /api/gse/stocks",
      ];
      const log = $("#log")!;
      const count = $("#count")!;
      const rail = $("#rail")!;
      const o = { v: 0 };
      const paint = () => {
        count.firstChild!.textContent = String(Math.round(o.v)).padStart(3, "0");
        rail.style.transform = `scaleX(${o.v / 100})`;
      };
      lenis?.stop();
      // Stage 1: at least 3 seconds, revealing the log up to the API calls.
      gsap.to(o, {
        v: 90,
        duration: 3,
        ease: "power1.inOut",
        onUpdate: () => {
          paint();
          log.textContent = lines
            .slice(0, 1 + Math.floor((o.v / 90) * (lines.length - 1)))
            .join("\n");
        },
        onComplete: () =>
          void ready.then((res) => {
            if (signal.aborted) return;
            // Stage 2: report what actually came back, then finish.
            const k = res.ok;
            const d = res.data;
            log.textContent = lines
              .concat([
                k.bills
                  ? `  ✓ t-bills · ${(d.bills ?? []).length} tenors`
                  : "  ⚠ t-bills unavailable",
                k.market ? "  ✓ GSE market · 200 OK" : "  ⚠ GSE market unavailable",
                k.stocks
                  ? `  ✓ GSE stocks · ${(d.stocks ?? []).length} symbols`
                  : "  ⚠ GSE stocks unavailable",
                `  ✓ ready in ${((performance.now() - t0) / 1000).toFixed(1)}s`,
              ])
              .join("\n");
            ctx.add(() =>
              gsap
                .timeline({
                  onComplete: () => {
                    root.classList.remove("js-loading");
                    lenis?.start();
                    ScrollTrigger.refresh();
                  },
                })
                .to(o, { v: 100, duration: 0.4, ease: "power2.out", onUpdate: paint })
                .to("#loader", { yPercent: -100, duration: 0.9, ease: "power4.inOut", delay: 0.3 })
                .add(intro, "-=.55"),
            );
          }),
      });
    }

    startGlass(env);
  });

  /* ---------- Particles ---------- */
  const rect = (id: string) => document.getElementById(id)?.getBoundingClientRect();
  const enter = (id: string) => {
    const vh = window.innerHeight;
    return smooth(clamp01((vh * 0.8 - (rect(id)?.top ?? vh)) / (vh * 0.55)));
  };
  const steps = (p: number, n: number) => {
    const x = clamp01(p) * n;
    const i = Math.min(n - 1, Math.floor(x));
    return i === n - 1 ? n - 1 : i + smooth(clamp01((x - i - 0.8) / 0.2));
  };
  const scrollInput = (): ScrollInput => {
    const hero = rect("hero");
    const p1 = hero ? smooth(clamp01(-hero.top / (hero.height * 0.85))) : 0;
    const pb = buildST ? steps(buildST.progress, 3) : 0;
    const po = offST ? steps(offST.progress, 3) : 0;
    const offTop = rect("off")?.top ?? window.innerHeight;
    return {
      seg:
        p1 +
        pb +
        enter("work") +
        enter("numbers") +
        enter("about") +
        (offST ? smooth(clamp01((window.innerHeight - offTop) / window.innerHeight)) : 0) +
        po +
        enter("stack") +
        enter("contact"),
      po: offST ? offST.progress : 0,
    };
  };
  setScrollSource(scrollInput);
  cleanups.push(() => setScrollSource(null));
  // Scene loaded after the preloader's intro started (slow network): gather it now instead.
  if (!reduce && !returning)
    void whenParticles().then((p) => {
      if (introPlayed && !gathered && !signal.aborted) gatherCloud(p);
    });

  /* ---------- Back from a case study: land on its row ---------- */
  if (reduce || returning) {
    const { lastCase } = ui.getState();
    const id = location.hash.startsWith("#work-")
      ? decodeURIComponent(location.hash.slice(1))
      : lastCase && `work-${lastCase}`;
    const row = id ? document.getElementById(id) : null;
    if (row) {
      ScrollTrigger.refresh();
      if (lenis) lenis.scrollTo(row, { immediate: true, offset: -window.innerHeight / 3 });
      else row.scrollIntoView({ block: "center" });
      row.querySelector<HTMLElement>(".open")?.focus({ preventScroll: true });
    }
    ui.setState({ lastCase: null });
  }

  const onResize = () => ScrollTrigger.refresh();
  window.addEventListener("resize", onResize, { signal });

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
    ctx.revert();
  };
}
