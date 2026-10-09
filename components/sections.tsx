import { DeployButton } from "@/components/DeployButton";
import { MailCopy } from "@/components/MailCopy";
import { SecHead } from "@/components/ui";
import { builds, commits, hobbies, stack } from "@/content/profile";
import type { Project } from "@/content/projects";
import { Work } from "@/features/case-study/Work";
import { buildInfo } from "@/lib/build-info";
import { site } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

export function Hero() {
  return (
    <section id="hero" className="wrap" data-inspect="Hero">
      <div className="hero-type">
        <span className="mono muted hello">
          <span className="dot" />
          Hello, world
        </span>
        <h1 data-inspect="HeroTitle">
          <span className="line" data-fx="hero">
            I&apos;m Lawrence
          </span>
          <span className="line" data-fx="hero">
            Yirenkyi-Boafo<span className="dotred">.</span>
          </span>
          <span className="line role" data-fx="hero">
            Frontend Engineer.
          </span>
        </h1>
      </div>
      <div className="hero-foot">
        <p className="lead">
          I build web and mobile products people actually use, from the interface down to the API.
        </p>
        <div className="mono muted hero-meta">
          Currently @ Stanbic Bank Ghana
          <br />
          Accra, GH · press I to inspect
        </div>
      </div>
    </section>
  );
}

export function Build() {
  return (
    <section id="build" className="wrap pinsec" data-inspect="WhatIBuild">
      <SecHead
        className="lc"
        label="what I build"
        aside={
          <>
            <span id="bIdx">01</span> / {pad(builds.length)}
          </>
        }
      />
      <h2 className="big lc">
        <span className="stem" data-fx="words">
          Building
        </span>
        <span className="slot" id="slot">
          {builds.map((w) => (
            <span key={w} className="w">
              {w}
            </span>
          ))}
        </span>
        <span className="static-list">{builds.join(", ").replace(/\.,/g, ",")}</span>
      </h2>
      <div className="build-row lc">
        <div className="bar">
          <i id="barFill" />
        </div>
        <DeployButton />
      </div>
    </section>
  );
}

export function SelectedWork({ projects }: { projects: Project[] }) {
  return (
    <section id="work" className="wrap" data-inspect="SelectedWork">
      <div className="lc">
        <SecHead label="selected work" aside={`${pad(projects.length)} projects`} />
        <Work projects={projects} />
        <p className="mono muted hint">Hover a project to see it · click to open</p>
      </div>
    </section>
  );
}

export function Numbers({ repos }: { repos: number }) {
  const nums = [
    { n: 3, plus: true, label: "years building banking software" },
    { n: 17, plus: true, label: "projects shipped at Stanbic Bank" },
    { n: repos, plus: false, label: "public repositories on GitHub" },
    { n: 2, plus: false, label: "upcoming projects" },
  ];
  return (
    <section id="numbers" className="wrap" data-inspect="Numbers">
      <div className="lc">
        <SecHead label="by the numbers" aside="since 2022" />
        <div className="nums">
          {nums.map((x) => (
            <div key={x.label} className="num">
              <b>
                <span data-count={x.n}>{x.n}</span>
                {x.plus && <em>+</em>}
              </b>
              <span>{x.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="wrap" data-inspect="About">
      <div className="lc">
        <div className="about-copy">
          <div className="mono muted" data-fx="scramble">
            {"// about"}
          </div>
          <h2 className="h2" data-fx="words">
            Banking software by day. Side projects by night.
          </h2>
          <p>
            I&apos;m a Frontend Engineer at Stanbic Bank Ghana, where I&apos;ve shipped 17+
            projects: moving branch services online, onboarding investment customers, and automating
            statements for business clients. Mostly Angular, often microfrontends with Nx and NgRx.
          </p>
          <p>
            Outside work I build the tools I wish existed, like a Treasury Bills API for Ghana and
            Trade Sim, a paper-trading app for first-time investors.
          </p>
          <p className="small">
            I also mentor interns in Angular and programming fundamentals, because someone once did
            that for me.
          </p>
        </div>
        <div className="gitwrap" data-inspect="GitLog">
          <div className="mono muted gitwrap-cmd">$ git log --oneline</div>
          <ol className="gitlog">
            {commits.map((c) => (
              <li key={c.hash} className={"head" in c && c.head ? "head" : undefined}>
                <div className="graph">
                  <span className="c" />
                </div>
                <div className="commit">
                  <span className="h">{c.hash}</span>
                  {"head" in c && c.head && (
                    <>
                      {" "}
                      <span className="ref">(HEAD → main)</span>
                    </>
                  )}{" "}
                  · {c.when}
                  <span className="msg">{c.msg}</span>
                  <span className="body">{c.body}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function OffTheClock() {
  return (
    <section id="off" className="wrap pinsec" data-inspect="OffTheClock">
      <SecHead
        className="lc"
        label="off the clock"
        aside={
          <>
            <span id="oIdx">01</span> / {pad(hobbies.length)}
          </>
        }
      />
      <h2 className="big lc">
        <span className="stem" data-fx="words">
          When I&apos;m not shipping
        </span>
        <span className="slot" id="oslot">
          {hobbies.map((h) => (
            <span key={h.word} className="w">
              {h.word}
            </span>
          ))}
        </span>
        <span className="static-list">Formula 1, basketball, reading.</span>
      </h2>
      <div className="off-desc lc" id="odesc">
        {hobbies.map((h) => (
          <p key={h.word}>{h.desc}</p>
        ))}
      </div>
      <ul className="chips" id="ochips">
        {hobbies.map((h, i) => (
          <li key={h.chip}>
            <span className={i === 0 ? "gbtn hot" : "gbtn"}>{h.chip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Stack() {
  return (
    <section id="stack" className="wrap" data-inspect="Stack">
      <div className="lc">
        <div className="mono muted" data-fx="scramble">
          {"// stack"}
        </div>
        <h2 className="h2" data-fx="words">
          Tools I reach for
        </h2>
        <div className="stack">
          {stack.map((s) => (
            <div key={s.group}>
              <div className="mono muted">{s.group}</div>
              <ul>
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="wrap" data-inspect="Contact">
      <div className="mono muted" data-fx="scramble">
        {"// contact"}
      </div>
      <h2 className="big" data-fx="words">
        Let&apos;s build something people actually use.
      </h2>
      <MailCopy email={site.email} />
      <div className="links">
        <a className="gbtn" href={site.github} target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
        <a className="gbtn" href={site.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn ↗
        </a>
        <a className="gbtn" href={site.resume} target="_blank" rel="noopener noreferrer">
          Résumé ↓
        </a>
      </div>
    </section>
  );
}

export function Footer({ year }: { year: number }) {
  return (
    <footer className="wrap mono muted">
      <span>
        © {year} {site.name}
      </span>
      <span>Built with Three.js, GSAP and my own market API</span>
      <span className="build" data-inspect="Version">
        <a href={buildInfo.releaseUrl} target="_blank" rel="noopener noreferrer">
          v{buildInfo.version}
        </a>
        {buildInfo.shortCommit && buildInfo.commitUrl && (
          <>
            {" · "}
            <a href={buildInfo.commitUrl} target="_blank" rel="noopener noreferrer">
              {buildInfo.shortCommit}
            </a>
          </>
        )}
      </span>
    </footer>
  );
}
