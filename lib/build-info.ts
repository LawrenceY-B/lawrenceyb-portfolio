import "server-only";

import { execSync } from "node:child_process";

import pkg from "@/package.json";

import { site } from "./site";

function commitSha(): string | null {
  // Vercel exposes the deployed commit; locally fall back to git.
  const fromEnv = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return (
      execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim() || null
    );
  } catch {
    return null;
  }
}

const sha = commitSha();

/** Resolved once at build time (static export). */
export const buildInfo = {
  version: pkg.version,
  commit: sha,
  shortCommit: sha?.slice(0, 7) ?? null,
  builtAt: new Date().toISOString(),
  releaseUrl: `${site.repo}/releases/tag/v${pkg.version}`,
  commitUrl: sha ? `${site.repo}/commit/${sha}` : null,
} as const;
