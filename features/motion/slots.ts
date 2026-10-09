import { gsap } from "gsap";

import { split } from "./text";

/** Shows one word of a slot at a time, rolling characters in the scroll direction. */
export function slotter(words: HTMLElement[], onShow?: (n: number) => void) {
  const sets = words.map((w) => split(w).chars);
  let cur = 0;
  gsap.set(words, { autoAlpha: 0 });
  gsap.set(words[0]!, { autoAlpha: 1 });
  return function show(n: number) {
    if (n === cur) return;
    const dir = n > cur ? 1 : -1;
    const old = cur;
    cur = n;
    words.forEach((w, k) => {
      if (k !== n && k !== old) gsap.set(w, { autoAlpha: 0 });
    });
    gsap.to(sets[old]!, {
      yPercent: -80 * dir,
      opacity: 0,
      stagger: 0.01,
      duration: 0.3,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        if (cur !== old) gsap.set(words[old]!, { autoAlpha: 0 });
      },
    });
    gsap.set(words[n]!, { autoAlpha: 1 });
    gsap.fromTo(
      sets[n]!,
      { yPercent: 80 * dir, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        stagger: 0.018,
        duration: 0.5,
        ease: "power3.out",
        overwrite: true,
        delay: 0.06,
      },
    );
    onShow?.(n);
  };
}
