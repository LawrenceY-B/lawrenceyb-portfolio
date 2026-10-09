# Versioning and releases

Status: adopted 2026-10-09. Remaining setup steps are listed at the end.

## Goals

- Every production deploy can be traced to a commit, and every release to a tag and a changelog
  entry.
- Versions are calculated from commit history, not edited by hand.
- Any release can be rolled back in under a minute.

## Version scheme: SemVer, applied to a website

A portfolio has no public API, so the version numbers describe what a visitor or a linking site sees.

| Bump  | When                                                                                    | Examples                                                              |
| ----- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| MAJOR | Redesign or a change that breaks links: removed/renamed sections or anchors, new domain | New visual identity, `#work` becomes `/work`, move to a custom domain |
| MINOR | New content or feature                                                                  | New project case study, new section, new ticker data                  |
| PATCH | Fixes, copy edits, performance, dependency updates                                      | Typo, contrast fix, Three.js chunk smaller, Dependabot bump           |

- `0.x` until the first public launch. Ship the launch as **`1.0.0`**; the current `0.1.0` is pre-launch.
- Tags are `vX.Y.Z`. The version lives in `package.json`, which stays the single source of truth.

## How versions are produced

Conventional Commits are already enforced locally (commitlint), so release tooling can read them:

- `feat:` → minor, `fix:` / `perf:` → patch, `feat!:` or a `BREAKING CHANGE:` footer → major.
  While on `0.x`, breaking changes bump the minor instead (`bump-minor-pre-major`).
- `chore:`, `docs:`, `test:`, `ci:`, `refactor:`, `style:` → no release on their own.

**Tool: [release-please](https://github.com/googleapis/release-please-action)** (GitHub Action).

- After each merge to `main` it updates a standing "Release PR" that bumps `package.json`
  and writes `CHANGELOG.md`.
- Merging that PR creates the `vX.Y.Z` tag and a GitHub Release.
- I chose it over semantic-release, which tags on every merge, and Changesets, which needs
  hand-written change files and is built for multi-package repos. With release-please, you decide
  when a batch of changes becomes a release.
- Config: `release-please-config.json` and `.release-please-manifest.json`. Workflow:
  `.github/workflows/release-please.yml`.

## Branching and pull requests

- Trunk-based: short-lived branches off `main` (`feat/…`, `fix/…`), opened as PRs.
- `main` is protected: CI must pass (typecheck, lint, format, unit, build, e2e, Lighthouse), and
  history stays linear.
- **Squash merge only**, so the PR title becomes the commit on `main`. A PR-title check
  (`amannn/action-semantic-pull-request`) enforces the Conventional Commit format there.

## Environments and deploys

Production deploys continuously: **every merge to `main` goes live**. Versions are milestones on
top of that, not deploy gates.

| Event                   | Where it goes                                 |
| ----------------------- | --------------------------------------------- |
| PR opened/updated       | Vercel preview URL (commented on the PR)      |
| Merge to `main`         | **Production** (`lawrenceyb.vercel.app`)      |
| Release PR merged → tag | Production again, now showing the new version |

- Vercel's Git integration handles this; `main` is the production branch. No deploy workflow or
  Vercel token is needed in GitHub.
- CI on the PR is the quality gate, because nothing else stands between a merge and production.
- Between releases the footer shows the last released version plus the live commit, for example
  `v1.2.0 · 9f3e2ab`. That pair always identifies exactly what's deployed.
- **Rollback:** use Vercel "Instant Rollback" to the previous deployment, then merge a revert or
  fix. Never move or delete tags.

## The version on the site

- The footer shows `v<version> · <short sha>`. The version links to its GitHub release and the
  sha to its commit. Both are read at build time in `lib/build-info.ts` from `package.json` and
  `VERCEL_GIT_COMMIT_SHA` (falling back to `git rev-parse` locally).
- `/version.json` (`app/version.json/route.ts`) returns `{ version, commit, builtAt }` for uptime
  checks and scripts.

## Dependencies and contracts

- `pnpm-lock.yaml` is committed and installs use `--frozen-lockfile`. Node 22 is pinned through
  `.nvmrc`, `engines` and `packageManager`.
- `three`, `gsap` and `lenis` keep exact versions. Dependabot opens grouped weekly PRs; `three`
  is excluded until a deliberate upgrade (a `feat`/`perf` release with visual checks).
- The ticker depends on the Treasury Bills API. Responses are already validated with Zod. If the
  response shape changes, bump the browser cache key (`lyb-market-v1` → `v2`) in the same release.
  Long term, version the API itself (`/api/v1`) in its own repo.

## Setup checklist

Done in the repo:

- [x] release-please workflow, config and manifest (starting at `0.1.0`)
- [x] PR-title check (`.github/workflows/pr-title.yml`)
- [x] Footer version, `/version.json`, with an e2e test

Still to do once the repo is on GitHub:

1. Push `main` to `github.com/LawrenceY-B/lawrenceyb-portfolio`.
2. Repo settings: allow squash merging only, and use the PR title as the default commit message.
   Allow GitHub Actions to create pull requests (needed by release-please).
3. Protect `main`: require the `CI` and `PR title` checks, require PRs, and require linear history.
4. Import into Vercel as project `lawrenceyb`, with `main` as the production branch.
5. Launch: merge a PR whose description contains a `Release-As: 1.0.0` footer, then merge the
   release PR → `v1.0.0`.
