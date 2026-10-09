"use client";

import { gsap } from "gsap";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import type { Project } from "@/content/projects";
import { emit } from "@/lib/bus";
import { prefersReducedMotion } from "@/lib/media";

const pad = (n: number) => String(n).padStart(2, "0");
const noop = () => () => {};
/** True after hydration; the sheet portals into <body> so it stays outside the inert <main>. */
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/** While the sheet is open, everything behind it is inert: no Tab stops, hidden from screen readers. */
function setBackgroundInert(on: boolean) {
  document.querySelectorAll<HTMLElement>("main, .top, #gl").forEach((el) => (el.inert = on));
}

export function Work({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closing = useRef(false);

  const openSheet = (i: number) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setActive(i);
    setOpen(true);
  };

  // Animate in once the new content has rendered.
  useLayoutEffect(() => {
    const el = sheet.current;
    if (!open || !el) return;
    const reduce = prefersReducedMotion();
    el.scrollTop = 0;
    el.classList.add("open");
    setBackgroundInert(true);
    emit("sheet-open", true);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: reduce ? 0 : 0.8, ease: "power4.inOut" },
      );
      if (!reduce)
        gsap.from(el.querySelectorAll("h2, .lede, .facts, .chapters"), {
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.06,
          delay: 0.4,
        });
    }, el);
    closeBtn.current?.focus({ preventScroll: true });
    return () => ctx.kill();
  }, [open, active]);

  const close = useCallback(() => {
    const el = sheet.current;
    if (!el || !el.classList.contains("open") || closing.current) return;
    closing.current = true;
    gsap.to(el, {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: prefersReducedMotion() ? 0 : 0.7,
      ease: "power4.inOut",
      onComplete: () => {
        closing.current = false;
        el.classList.remove("open");
        setBackgroundInert(false);
        emit("sheet-open", false);
        setOpen(false);
        lastFocus.current?.focus({ preventScroll: true });
      },
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setBackgroundInert(false);
    };
  }, [close]);

  const mounted = useMounted();
  const p = active === null ? null : projects[active];

  return (
    <>
      <ul className="rows">
        {projects.map((proj, i) => {
          const hover = () => emit("project-hover", proj.shape);
          const leave = () => emit("project-hover", null);
          return (
            <li
              key={proj.name}
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
                <span className="t">{proj.name}</span>
                {proj.badge && <span className="badge">{proj.badge}</span>}
              </span>
              <span className="s mono muted">
                {proj.stack} · {proj.year}
              </span>
              <p className="d">{proj.desc}</p>
              <button
                type="button"
                className="open"
                aria-label={`Open case study: ${proj.name}`}
                aria-haspopup="dialog"
                onClick={() => openSheet(i)}
              />
            </li>
          );
        })}
      </ul>

      {mounted &&
        createPortal(
          <div
            id="sheet"
            ref={sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheetTitle"
            aria-hidden={!open}
          >
            <div className="sheet-in">
              <div className="sheet-top">
                <span className="mono muted">
                  {"// case study"}
                  {active !== null && ` ${pad(active + 1)} / ${pad(projects.length)}`}
                </span>
                <button
                  type="button"
                  className="gbtn"
                  ref={closeBtn}
                  data-cursor="Close"
                  onClick={close}
                >
                  Close · Esc
                </button>
              </div>
              <h2 id="sheetTitle">{p?.name}</h2>
              <p className="lede">{p?.lede}</p>
              <div className="facts">
                {p?.facts.map((f) => (
                  <div key={f.label}>
                    <span className="mono muted">{f.label}</span>
                    {"value" in f
                      ? f.value
                      : f.links.map((l, k) => (
                          <Fragment key={l.href}>
                            {k > 0 && " · "}
                            <a href={l.href} target="_blank" rel="noopener noreferrer">
                              {l.label}
                            </a>
                          </Fragment>
                        ))}
                  </div>
                ))}
              </div>
              <div className="chapters">
                {p?.body.map((b) => (
                  <section key={b.label}>
                    <span className="mono muted">{b.label}</span>
                    <p>{b.text}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
