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
- Case studies are their own statically exported routes (`app/work/[slug]`), not an overlay.
- The particle scene and custom cursor are site-wide: the root layout renders the canvas and
  `<SiteMotion />` (`features/motion/site.ts`) starts them once, so they survive navigations and
  the cloud morphs between pages instead of reloading. Pages steer it through the store: home
  plugs in its scroll input (`setScrollSource`), case studies and the 404 hold a shape
  (`sceneShape`). Per-page effects (smooth scroll, glass, pinned sections, intro) stay in each
  page's own init (`init.ts`, `case.ts`), built from `features/motion/shared.ts`.
- Page transitions use React's `<ViewTransition>`: project titles morph between the list, the case
  heading and the previous/next links on navigations tagged `nav-forward`/`nav-back`
  (`features/case-study/transitions.ts`); everything else crossfades over the live canvas.
- UI with real state (ticker, theme, inspect mode, copy-email, deploy button) are
  React client components.
- Everything frame-driven lives in plain TypeScript modules under `features/motion` and
  `features/particles`, started once by `<Experience />` in a `useEffect` and torn down by the
  cleanup it returns (`gsap.context().revert()`, an `AbortController` for listeners,
  `lenis.destroy()`, renderer/geometry disposal). This keeps React Strict Mode's double mount safe.
- The two sides talk only through the Zustand vanilla store in `lib/store.ts` (`ui.setState` to write, `watch(key, fn)` or `useStore` to read).
- Three.js and the particle data load after first paint via dynamic `import()` and `fetch`.

## Consequences

- Imperative code must never mutate DOM that React re-renders. Static sections are safe; client
  components keep their own markup and expose state through attributes (for example
  `#build[data-step]`) instead of having classes toggled on them.
- Tweens on site-wide objects (the cloud's `assemble`, the cursor) must belong to the site's gsap
  context, never a page's: GSAP runs callbacks in the context that created them, so a page's
  `ctx.revert()` would undo them on navigation. Use `gatherCloud()`; it calls `ctx.ignore()`
  before `ctx.add()`, because adding while a page context is active nests the whole site context
  inside that page's.
- Home lands on the opened project's row in a passive effect, after the view transition has
  measured the page, so titles don't morph on the way back (they crossfade).
- `three` stays pinned at r128 (shader and geometry APIs used here change in later versions).
