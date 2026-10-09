"use client";

import { useEffect, useRef } from "react";
import { useStore } from "zustand";

import { ui, watch } from "@/lib/store";

const toggleInspect = () => ui.setState((s) => ({ inspect: !s.inspect }));

/** Toggle button for inspect mode (also bound to the I key). Draws labelled boxes over every [data-inspect] element. */
export function InspectToggle() {
  const on = useStore(ui, (s) => s.inspect);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName ?? "";
      if (
        (e.key === "i" || e.key === "I") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !/INPUT|TEXTAREA|SELECT/.test(tag)
      )
        toggleInspect();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.inspect = on ? "on" : "off";
  }, [on]);

  return (
    <button
      type="button"
      className="icon"
      id="inspectBtn"
      aria-pressed={on}
      aria-label="Toggle inspect mode"
      title="Inspect (I)"
      onClick={toggleInspect}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M3 3h7M3 3v7M21 3h-7M21 3v7M3 21h7M3 21v-7" />
        <path d="M13 13l8 3-3.5 1.5L16 21z" fill="currentColor" />
      </svg>
    </button>
  );
}

/** Overlay that follows [data-inspect] elements every frame while inspect mode is on. */
export function InspectOverlay() {
  const boxes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const host = boxes.current;
      if (!host) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const frag = document.createDocumentFragment();
      document.querySelectorAll<HTMLElement>("[data-inspect]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
        const box = document.createElement("div");
        box.className = "box";
        Object.assign(box.style, {
          left: `${r.left}px`,
          top: `${r.top}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
        });
        const tag = document.createElement("i");
        tag.textContent = `<${el.dataset.inspect}> ${Math.round(r.width)}×${Math.round(r.height)}`;
        box.appendChild(tag);
        frag.appendChild(box);
      });
      host.replaceChildren(frag);
      raf = requestAnimationFrame(draw);
    };
    const off = watch("inspect", (active) => {
      cancelAnimationFrame(raf);
      if (active) raf = requestAnimationFrame(draw);
      else boxes.current?.replaceChildren();
    });
    return () => {
      off();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div id="probe" aria-hidden="true">
      <div className="grid12">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div ref={boxes} />
    </div>
  );
}
