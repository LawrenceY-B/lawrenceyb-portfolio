"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SHAPE } from "@/content/projects";
import { site } from "@/lib/site";
import { ui } from "@/lib/store";

const BOLT = 3; // particle shape id: lightning bolt (features/particles/shapes.ts)
const noop = () => () => {};
/** The requested path. 404.html is built once, so it is only known in the browser. */
const usePath = () =>
  useSyncExternalStore(
    noop,
    () => decodeURIComponent(window.location.pathname),
    () => "/…",
  );

type Line = { id: number; cmd?: string; out: ReactNode };
const HELP = [
  ["cd ~", "go home (also: home, exit)"],
  ["ls", "list what is here"],
  ["whoami", "who built this"],
  ["sudo fix", "try to fix the bulb"],
  ["clear", "clear the screen"],
] as const;
// Scrollback kept on screen.
const MAX_LINES = 24;
const HOME = new Set(["cd", "cd ~", "cd /", "cd ..", "cd ~/", "home", "exit", "logout"]);

/**
 * The 404's request log, as a working prompt. Commands only ever lead home: this page is a
 * dead end on purpose. `sudo fix` restores power to the bulb, briefly.
 */
export function Terminal() {
  const path = usePath();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const history = useRef<string[]>([]);
  const cursor = useRef(0);
  const nextId = useRef(0);
  const fixTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Typing anywhere on the page goes to the prompt, as in a real terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const el = document.activeElement as HTMLElement | null;
      if (el === input.current || /INPUT|TEXTAREA|SELECT/.test(el?.tagName ?? "")) return;
      input.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(fixTimer.current);
    };
  }, []);

  const print = (cmd: string | undefined, out: ReactNode) =>
    setLines((l) => [...l, { id: nextId.current++, cmd, out }].slice(-MAX_LINES));

  const run = (raw: string) => {
    const cmd = raw.trim().replace(/\s+/g, " ");
    if (cmd) history.current.push(cmd);
    cursor.current = history.current.length;
    if (!cmd) return print("", null);
    if (HOME.has(cmd)) {
      print(cmd, <span className="muted">→ /</span>);
      router.push("/");
      return;
    }
    switch (cmd) {
      case "help":
        return print(
          cmd,
          HELP.map(([name, what], k) => (
            <span key={name}>
              <b>{name.padEnd(10)}</b>
              {what}
              {k < HELP.length - 1 && "\n"}
            </span>
          )),
        );
      case "ls":
        return print(
          cmd,
          <>
            <span className="muted">drwxr-xr-x</span> ~{"\n"}
            <span className="muted">-rw-r--r--</span> bulb.broken{"\n"}
            <span className="muted">-rw-r--r--</span> 404.html{"\n"}
            <span className="muted">nothing else here. cd ~ for everything that works.</span>
          </>,
        );
      case "whoami":
        return print(cmd, `visitor · ${path} · built by ${site.name}`);
      case "clear":
        return setLines([]);
      case "sudo fix":
      case "sudo fix bulb": {
        clearTimeout(fixTimer.current);
        ui.setState({ sceneShape: BOLT });
        fixTimer.current = setTimeout(() => {
          ui.setState({ sceneShape: SHAPE.bulb });
          print(
            undefined,
            <span className="muted">…and it blew again. Some routes stay broken.</span>,
          );
        }, 2600);
        return print(cmd, <b>⚡ power restored</b>);
      }
      case "fix":
        return print(cmd, <span className="muted">permission denied. try sudo?</span>);
      default:
        return print(
          cmd,
          <span className="muted">
            command not found: {cmd.split(" ")[0]}. try <b>help</b>
          </span>,
        );
    }
  };

  return (
    <div className="log term" onClick={() => input.current?.focus({ preventScroll: true })}>
      <pre aria-label={`Request for ${path} returned 404 Not Found`}>
        <span className="muted">$ </span>curl -I {path}
        {"\n"}
        <b>HTTP/2 404</b> Not Found
        {"\n"}
        <span className="muted">x-reason: no route matches this path</span>
        {"\n"}
        <span className="muted">x-hint: </span>type <b>help</b>, or <b>cd ~</b> to go home
      </pre>
      <pre aria-live="polite">
        {lines.map((l) => (
          <span key={l.id}>
            {l.cmd !== undefined && (
              <>
                <span className="muted">$ </span>
                {l.cmd}
                {"\n"}
              </>
            )}
            {l.out}
            {l.out !== null && "\n"}
          </span>
        ))}
      </pre>
      <form
        className="prompt"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <span className="muted" aria-hidden="true">
          ${" "}
        </span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            const h = history.current;
            if (e.key === "ArrowUp" && h.length) {
              e.preventDefault();
              cursor.current = Math.max(0, cursor.current - 1);
              setValue(h[cursor.current] ?? "");
            } else if (e.key === "ArrowDown" && h.length) {
              e.preventDefault();
              cursor.current = Math.min(h.length, cursor.current + 1);
              setValue(h[cursor.current] ?? "");
            }
          }}
          aria-label="Terminal command"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
        {!value && <span className="caret" aria-hidden="true" />}
      </form>
    </div>
  );
}
