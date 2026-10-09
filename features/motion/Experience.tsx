"use client";

import { useEffect } from "react";

import { initExperience } from "./init";

export function Experience() {
  useEffect(() => {
    try {
      return initExperience();
    } catch (err) {
      // Never leave the visitor stuck behind the preloader: fall back to the static layout.
      console.error(err);
      document.documentElement.classList.replace("js-loading", "reduce");
    }
  }, []);
  return null;
}
