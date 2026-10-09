# lawrenceyb-portfolio

Portfolio of Lawrence Yirenkyi-Boafo: [lawrenceyb.vercel.app](https://lawrenceyb.vercel.app).

Next.js (App Router, static export), TypeScript, GSAP + ScrollTrigger, Lenis and a Three.js particle
scene. The ticker reads live Ghana T-bill and GSE data from my
[Treasury Bills API](https://github.com/LawrenceY-B/treasury-bills).

## Getting started

```bash
nvm use            # Node 22
corepack enable    # pnpm from package.json#packageManager
pnpm install
cp .env.example .env.local
pnpm dev
```

## Scripts

| Script                     | What it does                                                      |
| -------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                 | Dev server with Strict Mode                                       |
| `pnpm build`               | Static export to `out/`                                           |
| `pnpm serve`               | Serve `out/` on :3000                                             |
| `pnpm check`               | Typecheck, lint, format check and unit tests                      |
| `pnpm test` / `test:watch` | Vitest unit tests (`tests/unit`)                                  |
| `pnpm test:e2e`            | Playwright against the built `out/` (`tests/e2e`), incl. axe a11y |
| `pnpm format`              | Prettier                                                          |

Locally you can run e2e tests with your installed Chrome: `PW_CHANNEL=chrome pnpm test:e2e`.
Otherwise run `pnpm exec playwright install chromium` once.

## Environment

| Variable               | Default                                   | Used for                               |
| ---------------------- | ----------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://lawrenceyb.vercel.app`           | Canonical, Open Graph, sitemap, robots |
| `NEXT_PUBLIC_API_URL`  | `https://treasury-bills.onrender.com/api` | Market ticker                          |

Both are validated at build time in `lib/env.ts`. When a custom domain is added, set
`NEXT_PUBLIC_SITE_URL` in Vercel and redeploy.

## Project layout

```
app/                 layout (metadata, fonts, boot script), page, manifest/robots/sitemap, OG images
components/          static sections and small client components
content/             projects, git log, stack, hobbies (edit copy here)
features/
  market/            API client (Zod-validated), cache, store, <Ticker />
  case-study/        project list + modal sheet
  motion/            GSAP/Lenis/text effects/preloader/cursor, started by <Experience />
  particles/         Three.js scene, procedural shapes, shaders, head point data loader
  inspect/           inspect mode (press I)
lib/                 env, site config, UI store (Zustand), browser helpers
public/shapes.bin    head point cloud (50k points)
tests/unit, tests/e2e
docs/adr/            architecture decisions
```

See [ADR 0001](docs/adr/0001-imperative-motion-inside-react.md) for why animation code is imperative, and
[docs/versioning.md](docs/versioning.md) for the release plan.

## Deploying (Vercel)

1. Push to GitHub (repo `lawrenceyb-portfolio`) and import it in Vercel. Name the Vercel project
   `lawrenceyb` so the production URL stays `lawrenceyb.vercel.app`.
2. Vercel picks up `vercel.json` (pnpm install, build, security headers).
3. Add the site origin to the API's CORS list so the ticker can show **● Live**.
4. Add `public/resume.pdf`, or the Résumé button 404s.

The free Render API sleeps when idle. The ticker waits at most 7s, retries in the background and
shows cached numbers on repeat visits.

## Conventions

- Branch from `main`, open a PR; CI must pass (typecheck, lint, format, unit, build, e2e, Lighthouse).
- [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `chore:` …), enforced
  by commitlint. Pre-commit runs ESLint and Prettier on staged files.
