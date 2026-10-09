import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { watch } from "@/lib/store";
import { hasFinePointer, prefersReducedMotion } from "@/lib/media";
import { marketReady } from "@/features/market/store";
import { loadHead } from "@/features/particles/data";
import { prepareAsync } from "@/features/particles/prepareAsync";
import type { Particles, ScrollInput } from "@/features/particles/scene";

import { slotter } from "./slots";
import { scramble, split } from "./text";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
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
  let particles: Particles | null = null;
  let introPlayed = false;
  let lenis: Lenis | null = null;
  let buildST: ScrollTrigger | null = null;
  let offST: ScrollTrigger | null = null;

  const ctx = gsap.context(() => {
    /* ---------- Smooth scroll ---------- */
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (t: number) => lenis?.raf(t * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        lenis?.destroy();
        lenis = null;
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
    cleanups.push(watch("sheetOpen", (open) => (open ? lenis?.stop() : lenis?.start())));

    /* ---------- Pinned slots ---------- */
    const build = $("#build");
    if (!reduce && build) {
      const showB = slotter($$("#slot .w"), (n) => {
        $("#bIdx")!.textContent = String(n + 1).padStart(2, "0");
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
          gsap.set("#barFill", { scaleX: 0.02 + st.progress * 0.98 });
        },
      });
      const chips = $$("#ochips .gbtn");
      const showD = slotter($$("#odesc p"));
      const showO = slotter($$("#oslot .w"), (n) => {
        $("#oIdx")!.textContent = String(n + 1).padStart(2, "0");
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
      if (particles)
        tl.fromTo(
          particles.assemble,
          { value: 0 },
          { value: 1, duration: 3, ease: "power2.inOut" },
          0,
        );
    };
    const ready = marketReady();
    if (reduce) {
      root.classList.remove("js-loading");
      introPlayed = true;
    } else {
      const t0 = performance.now();
      const lines = [
        "$ build lyb.portfolio",
        "  ✓ 14 shapes · 40,000 particles",
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

    /* ---------- Glass: shine follows the pointer, blob tracks nav items ---------- */
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

    /* ---------- Cursor ---------- */
    const me = $("#me");
    const meName = $("#meName");
    if (me && meName && hasFinePointer() && !reduce) {
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
      // Any element with data-cursor="Label" shows that label while hovered.
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
  });

  /* ---------- Particles (Three.js is code-split and loaded after first paint) ---------- */
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
  const canvas = $<HTMLCanvasElement>("#gl");
  if (canvas) {
    // Fetch and prepare the point data in a worker while the Three.js chunk downloads.
    void Promise.all([
      import("@/features/particles/scene"),
      loadHead(signal).then((buf) => prepareAsync(buf, signal)),
    ])
      .then(([mod, data]) => {
        if (signal.aborted) return;
        particles = mod.createParticles(canvas, data, {
          reduce,
          narrow: window.innerWidth < 760,
          scroll: scrollInput,
        });
        // Intro already ran (slow network): gather the cloud now instead.
        if (introPlayed && !reduce)
          gsap.fromTo(
            particles.assemble,
            { value: 0 },
            { value: 1, duration: 3, ease: "power2.inOut" },
          );
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        console.error(err);
        canvas.style.display = "none";
      });
  }
  const onResize = () => ScrollTrigger.refresh();
  window.addEventListener("resize", onResize, { signal });

  return () => {
    ac.abort();
    cleanups.forEach((fn) => fn());
    particles?.dispose();
    particles = null;
    ctx.revert();
  };
}
