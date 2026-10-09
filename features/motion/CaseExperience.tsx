"use client";

import { useEffect } from "react";

import { initCaseExperience } from "./case";

/** Mounts the case study page's imperative effects once the static markup has hydrated. */
export function CaseExperience({ shape }: { shape: number }) {
  useEffect(() => {
    try {
      return initCaseExperience(shape);
    } catch (err) {
      console.error(err);
    }
  }, [shape]);
  return null;
}
