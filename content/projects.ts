/** Particle shape ids (see features/particles/shapes.ts ORDER, offset by 1 for the head). */
export const SHAPE = { phone: 5, percent: 6, bubbles: 7, cap: 8 } as const;

export type Link = { label: string; href: string };
export type Fact = { label: string; value: string } | { label: string; links: Link[] };

export type Project = {
  /** URL segment: /work/<slug>. */
  slug: string;
  shape: number;
  name: string;
  badge?: string;
  year: string;
  stack: string;
  desc: string;
  lede: string;
  facts: Fact[];
  body: { label: string; text: string }[];
};

export const projects: Project[] = [
  {
    slug: "trade-sim",
    shape: SHAPE.phone,
    name: "Trade Sim",
    badge: "In progress",
    year: "2026",
    stack: "Mobile · Spring Boot",
    desc: "A stock trading simulator. Practise investing with fake money and real decisions.",
    lede: "Investing feels risky when you are starting out. Trade Sim gives you a paper balance and a real market to practise on, so the first mistakes cost nothing.",
    facts: [
      { label: "Role", value: "Solo · design + engineering" },
      { label: "Stack", value: "Java, Spring Boot, Flutter" },
      { label: "Status", value: "In progress" },
    ],
    body: [
      {
        label: "Problem",
        text: "Most first-time investors learn by losing money. There is no low-stakes way to try buying, holding and selling.",
      },
      {
        label: "Architecture",
        text: "A Spring Boot API owns accounts, orders and portfolio valuation. The mobile client stays thin and talks to it over REST.",
      },
      {
        label: "Next",
        text: "Ghana T-bills as a simulated asset, priced from my own Treasury Bills API.",
      },
    ],
  },
  {
    slug: "treasury-bills-api",
    shape: SHAPE.percent,
    name: "Treasury Bills API",
    year: "2026",
    stack: "TypeScript · Express",
    desc: "Live Ghana T-bill rates and stock market data in one API. It powers the ticker at the top of this page.",
    lede: "Ghana publishes treasury bill rates as a web page and stock prices as daily reports. This API collects both and serves them as clean JSON.",
    facts: [
      { label: "Role", value: "Solo" },
      { label: "Stack", value: "TypeScript, Express, MongoDB · hosted on Render" },
      {
        label: "Links",
        links: [
          { label: "GitHub ↗", href: "https://github.com/LawrenceY-B/treasury-bills" },
          {
            label: "API docs ↗",
            href: "https://documenter.getpostman.com/view/21114618/2s9YsDmFRr",
          },
        ],
      },
    ],
    body: [
      {
        label: "Problem",
        text: "T-bill rates for 91, 182 and 364-day bills only exist as a table on bog.gov.gh, and Ghana Stock Exchange prices are spread across daily reports. Neither has a public API.",
      },
      {
        label: "What it serves",
        text: "T-bill rates by tenor, every listed GSE stock with its latest quote, daily price history back to 2007, market summaries for the GSE-CI and GSE-FSI indices, and plain-English market insights for any period.",
      },
      {
        label: "Endpoints",
        text: "/get-all-tbill · /get-tbill?days= · /gse/stocks · /gse/stocks/:symbol · /gse/stocks/:symbol/history · /gse/market · /gse/market/history · /gse/insights",
      },
      {
        label: "On this site",
        text: "The ticker at the top of this page reads from it live. The last good response is cached in your browser, so it shows numbers instantly on repeat visits.",
      },
    ],
  },
  {
    slug: "friendwave",
    shape: SHAPE.bubbles,
    name: "Friendwave",
    year: "2023",
    stack: "Node · MongoDB",
    desc: "A social app with posts, stories and messaging. Real-time chat on the way.",
    lede: "A full social backend built to learn how feeds, stories and messaging fit together. My most-starred repository.",
    facts: [
      { label: "Role", value: "Solo" },
      { label: "Stack", value: "Node, Express, MongoDB, TypeScript, Auth0 + JWT" },
      {
        label: "Links",
        links: [{ label: "GitHub ↗", href: "https://github.com/LawrenceY-B/Friendwave" }],
      },
    ],
    body: [
      {
        label: "Features",
        text: "Follow and unfollow, posts, comments, stories and messaging, with authentication through Auth0 and JWT.",
      },
      { label: "Next", text: "Real-time messaging over WebSockets." },
    ],
  },
  {
    slug: "edusearch",
    shape: SHAPE.cap,
    name: "EduSearch",
    year: "2022",
    stack: "Angular · Node",
    desc: "Finding a school in Ghana shouldn't take a week of phone calls.",
    lede: "A school search engine for parents. Search, compare and shortlist schools in one place.",
    facts: [
      { label: "Role", value: "Full-stack" },
      { label: "Stack", value: "MEAN: MongoDB, Express, Angular, Node" },
      {
        label: "Links",
        links: [{ label: "GitHub ↗", href: "https://github.com/LawrenceY-B/EduSearch-backend" }],
      },
    ],
    body: [
      {
        label: "Problem",
        text: "School information is scattered, so parents rely on calls and word of mouth.",
      },
      {
        label: "Build",
        text: "A REST API with JWT authentication and full CRUD, and an Angular client for search and school profiles.",
      },
    ],
  },
];

export function getProject(slug: string): { project: Project; index: number } | undefined {
  const project = projects.find((p) => p.slug === slug);
  return project && { project, index: projects.indexOf(project) };
}
