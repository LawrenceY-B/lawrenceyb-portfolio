export const commits = [
  {
    hash: "a1f3c09",
    head: true,
    when: "Nov 2023 – present",
    msg: "Frontend Engineer, Stanbic Bank Ghana",
    body: "17+ projects across client apps and staff tools. Nx microfrontends, NgRx, Azure CI/CD.",
  },
  {
    hash: "5c92e1a",
    when: "2023",
    msg: "BSc Information Technology, University of Ghana",
    body: "Plus a finance dashboard for the UG finance office.",
  },
  {
    hash: "e40b7f2",
    when: "Nov 2022",
    msg: "Junior Frontend Developer, Stanbic",
    body: "Built an internal staff portal with four other interns.",
  },
  {
    hash: "9d1c3b8",
    when: "Jun 2021",
    msg: "Software Engineer Intern, IT Consortium",
    body: "First production website: HTML, CSS, vanilla JS on AWS.",
  },
  { hash: "0000001", when: "2019", msg: "init", body: "Started IT at the University of Ghana." },
] as const;

export const stack = [
  { group: "Daily", items: ["Angular", "TypeScript", "RxJS · NgRx", "Nx"] },
  { group: "Also fluent", items: ["React", "Next.js", "Node · Express", "Tailwind"] },
  { group: "Exploring", items: ["Flutter · Dart", "Java", "Spring Boot"] },
  { group: "Ship", items: ["Azure DevOps", "AWS · Vercel", "MongoDB · SQL", "Figma"] },
  { group: "Other", items: ["Git · GitHub", "Jest"] },
] as const;

export const builds = ["web apps.", "APIs.", "things that ship."] as const;

export const hobbies = [
  {
    chip: "F1",
    word: "Formula 1.",
    desc: "Tifosi for life. Race weekends are blocked on the calendar, and red is the only acceptable colour.",
  },
  {
    chip: "Basketball",
    word: "Basketball.",
    desc: "Pickup runs and late-night games. Always down for a run.",
  },
  { chip: "Reading", word: "Reading.", desc: "Always one book in progress, usually more." },
] as const;
