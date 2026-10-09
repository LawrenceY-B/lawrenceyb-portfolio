"use client";

import { useEffect } from "react";

import { initCaseExperience } from "./case";

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
