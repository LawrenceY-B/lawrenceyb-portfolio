# 1. Keep animation and WebGL imperative, behind React

- Status: accepted
- Date: 2026-10-09

## Context

The site started as a single static `index.html` whose script drove GSAP timelines, ScrollTrigger
pins, Lenis smooth scrolling, split-text effects, a custom cursor and a Three.js particle scene
directly against the DOM. Rewriting all of that as React state would add re-renders on every
animation frame and risk visual regressions in a design that already works.

## Decision

- Markup is server-rendered (static export) from typed content in `content/`.
- UI with real state (ticker, case-study sheet, theme, inspect mode, copy-email, deploy button) are
  React client components.
- Everything frame-driven lives in plain TypeScript modules under `features/motion` and
  `features/particles`, started once by `<Experience />` in a `useEffect` and torn down by the
  cleanup it returns (`gsap.context().revert()`, an `AbortController` for listeners,
  `lenis.destroy()`, renderer/geometry disposal). This keeps React Strict Mode's double mount safe.
- The two sides talk only through the typed event bus in `lib/bus.ts`.
- Three.js and the particle data load after first paint via dynamic `import()` and `fetch`.

## Consequences

- Imperative code must never mutate DOM that React re-renders. Static sections are safe; client
  components keep their own markup and expose state through attributes (for example
  `#build[data-step]`) instead of having classes toggled on them.
- `three` stays pinned at r128 (shader and geometry APIs used here change in later versions).
