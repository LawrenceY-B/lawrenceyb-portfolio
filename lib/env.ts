import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("https://lawrenceyb.vercel.app"),
  NEXT_PUBLIC_API_URL: z.url().default("https://treasury-bills.onrender.com/api"),
});

// NEXT_PUBLIC_* values are inlined at build time, so they must be referenced explicitly.
export const env = schema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
});
