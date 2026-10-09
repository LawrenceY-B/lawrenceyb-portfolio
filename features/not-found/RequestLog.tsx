"use client";

import { useSyncExternalStore } from "react";

import { projects } from "@/content/projects";

const noop = () => () => {};
/** The requested path. 404.html is built once, so it is only known in the browser. */
const usePath = () =>
  useSyncExternalStore(
    noop,
    () => decodeURIComponent(window.location.pathname),
    () => "/…",
  );

/** Terminal-style log of the failed request, in the same voice as the home preloader. */
export function RequestLog() {
  const path = usePath();
  return (
    <pre className="log" aria-label={`Request for ${path} returned 404 Not Found`}>
      <span className="muted">$ </span>curl -I {path}
      {"\n"}
      <b>HTTP/2 404</b> Not Found
      {"\n"}
      <span className="muted">x-reason: no route matches this path</span>
      {"\n"}
      <span className="muted">x-hint: </span>/ · /#work · /work/{projects[0]!.slug}
      {"\n"}
      <span className="muted">$ </span>
      <span className="caret" aria-hidden="true" />
    </pre>
  );
}
