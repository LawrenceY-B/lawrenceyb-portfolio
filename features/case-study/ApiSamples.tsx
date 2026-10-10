"use client";

import { type KeyboardEvent, useId, useMemo, useRef, useState } from "react";

import type { ApiSample } from "@/content/projects";

import { tokenizeJson } from "./json";

/** Recorded API responses as tabs, one highlighted JSON body per endpoint. */
export function ApiSamples({ samples }: { samples: ApiSample[] }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const sample = samples[active]!;
  const tokens = useMemo(() => tokenizeJson(sample.response), [sample]);

  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    let next: number | undefined;
    if (step) next = (active + step + samples.length) % samples.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = samples.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="api" aria-label="Sample API responses">
      <span className="mono muted">Responses</span>
      <div className="api-box">
        <div className="api-tabs" role="tablist" aria-label="Endpoints" onKeyDown={onKey}>
          {samples.map((s, i) => (
            <button
              key={s.path}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel`}
              tabIndex={i === active ? 0 : -1}
              className="mono"
              onClick={() => setActive(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="api-req">
          <span className="api-get">GET</span>
          <code>/api{sample.path}</code>
          <span className="api-ok">200 OK</span>
        </div>
        <pre
          className="api-body"
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${active}`}
          tabIndex={0}
          data-lenis-prevent
        >
          <code>
            {tokens.map((t, i) =>
              t.kind === "space" ? (
                t.text
              ) : (
                <span key={i} className={`j-${t.kind}`}>
                  {t.text}
                </span>
              ),
            )}
          </code>
        </pre>
        <div className="api-foot">
          <p>{sample.note}</p>
          <a href={sample.href} target="_blank" rel="noopener noreferrer" className="mono">
            Try it live ↗
          </a>
        </div>
      </div>
    </section>
  );
}
