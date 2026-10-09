/** Public repo count, fetched once at build time. Falls back so a GitHub outage never breaks the build. */
export async function getPublicRepoCount(user: string, fallback = 25): Promise<number> {
  try {
    const res = await fetch(`https://api.github.com/users/${user}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { public_repos?: unknown };
    return typeof data.public_repos === "number" ? data.public_repos : fallback;
  } catch {
    return fallback;
  }
}
