import { env } from "./env";

export const site = {
  url: env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
  name: "Lawrence Yirenkyi-Boafo",
  shortName: "LYB.",
  title: "Lawrence Yirenkyi-Boafo · Frontend Engineer",
  description:
    "Frontend engineer in Accra building web and mobile products people actually use, from the interface down to the API.",
  email: "lawrencekybj@gmail.com",
  github: "https://github.com/LawrenceY-B",
  githubUser: "LawrenceY-B",
  repo: "https://github.com/LawrenceY-B/lawrenceyb-portfolio",
  linkedin: "https://www.linkedin.com/in/lawrence-yirenkyi-boafo-4a6a74204/",
  resume: "/resume.pdf",
  themeColor: "#0b0b0b",
} as const;
