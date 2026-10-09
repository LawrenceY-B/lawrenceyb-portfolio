import { buildInfo } from "@/lib/build-info";

// Written to /version.json at build time.
export const dynamic = "force-static";

export function GET() {
  const { version, commit, builtAt } = buildInfo;
  return Response.json({ version, commit, builtAt });
}
