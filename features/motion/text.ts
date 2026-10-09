import { gsap } from "gsap";

export type Split = { chars: HTMLElement[]; words: HTMLElement[] };

/**
 * Splits an element's text into word and character spans for animation, keeping a single
 * screen-reader copy of the text. Idempotent, so React Strict Mode re-runs reuse the spans.
 */
export function split(el: HTMLElement): Split {
  if (el.dataset.split === "1") {
    return {
      chars: Array.from(el.querySelectorAll<HTMLElement>(".ch")),
      words: Array.from(el.querySelectorAll<HTMLElement>(".wd")),
    };
  }
  const sr = document.createElement("span");
  sr.className = "sr";
  sr.textContent = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const vis = document.createElement("span");
  vis.setAttribute("aria-hidden", "true");
  while (el.firstChild) vis.appendChild(el.firstChild);
  const chars: HTMLElement[] = [];
  const words: HTMLElement[] = [];
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (n.textContent ?? "").split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const w = document.createElement("span");
          w.className = "wd";
          for (const c of part) {
            const s = document.createElement("span");
            s.className = "ch";
            s.textContent = c;
            w.appendChild(s);
            chars.push(s);
          }
          words.push(w);
          frag.appendChild(w);
        });
        (n as ChildNode).replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        walk(n);
      }
    });
  };
  walk(vis);
  el.append(sr, vis);
  el.dataset.split = "1";
  return { chars, words };
}

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

export function scramble(el: HTMLElement, duration = 0.8): gsap.core.Tween {
  const text = el.textContent ?? "";
  const o = { p: 0 };
  return gsap.to(o, {
    p: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      const n = Math.floor(o.p * text.length);
      let out = text.slice(0, n);
      for (let i = n; i < text.length; i++)
        out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = text;
    },
  });
}
