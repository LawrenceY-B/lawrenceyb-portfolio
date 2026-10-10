/** Particle shape ids (see features/particles/shapes.ts ORDER, offset by 1 for the head). `bulb` is the 404 page. */
export const SHAPE = { phone: 5, percent: 6, bubbles: 7, cap: 8, bulb: 15 } as const;

export type Link = { label: string; href: string };
export type Fact = { label: string; value: string } | { label: string; links: Link[] };

export type Project = {
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
  shots?: { src: string; alt: string }[];
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
    year: "2026",
    stack: "Next.js · Node",
    desc: "An Instagram-style social app. Feed, stories, chat and notifications, all live.",
    lede: "A full social app, from API to phone screen. Likes, comments, chats and notifications update as they happen, so it behaves like a real product rather than a demo.",
    facts: [
      { label: "Role", value: "Solo · design + engineering" },
      {
        label: "Stack",
        value: "Next.js 16, React 19, Node, Express, MongoDB, socket.io, Auth0, S3",
      },
      {
        label: "Links",
        links: [
          { label: "Live app ↗", href: "https://friendwave-web.vercel.app" },
          {
            label: "API docs ↗",
            href: "https://documenter.getpostman.com/view/21114618/2s9YeD9DWK",
          },
          { label: "API on GitHub ↗", href: "https://github.com/LawrenceY-B/Friendwave" },
          { label: "Web on GitHub ↗", href: "https://github.com/LawrenceY-B/friendwave-web" },
        ],
      },
    ],
    body: [
      {
        label: "Features",
        text: "Posts, comments and replies, stories, follows and search. Chats with photos, typing indicators and unread counts. Notifications, and deleting your account.",
      },
      {
        label: "Live",
        text: "One socket.io connection per tab carries messages, like and comment counts, new posts in the feed, notifications and who is online. The client only subscribes to the posts on screen.",
      },
      {
        label: "API",
        text: "44 endpoints over 7 resources. One OpenAPI spec generates the frontend's types and the Postman collection. 36 tests cover every endpoint, auth, permissions and realtime.",
      },
      {
        label: "Frontend",
        text: "Server Components fetch on the server. Likes and follows are Server Actions with optimistic UI. GSAP and Lenis handle the motion: the double-tap heart, stories that swing in 3D, counts that roll like an odometer.",
      },
    ],
    shots: [
      { src: "/work/friendwave/feed.jpg", alt: "Home feed" },
      { src: "/work/friendwave/stories.jpg", alt: "Watching a story" },
      { src: "/work/friendwave/post.jpg", alt: "A post with comments and replies" },
      { src: "/work/friendwave/chats.jpg", alt: "Your chats" },
      { src: "/work/friendwave/chat.jpg", alt: "A chat, with a photo message" },
      { src: "/work/friendwave/notifications.jpg", alt: "Notifications" },
      { src: "/work/friendwave/search.jpg", alt: "Search" },
      { src: "/work/friendwave/profile.jpg", alt: "Your profile" },
      { src: "/work/friendwave/edit-profile.jpg", alt: "Edit profile" },
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
