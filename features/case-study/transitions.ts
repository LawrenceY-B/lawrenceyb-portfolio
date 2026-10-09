import type { ViewTransitionClass } from "react";

export const titleName = (slug: string) => `case-title-${slug}`;

/**
 * Morph only on navigations tagged with a direction (row → case, previous/next). Untagged ones,
 * like Back (history) or the browser's back button, crossfade instead: home lands on the row
 * after the transition has measured the page, so a morph would aim at the wrong place.
 */
export const MORPH: ViewTransitionClass = {
  "nav-forward": "morph",
  "nav-back": "morph",
  default: "none",
};
