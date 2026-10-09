"use client";

import { useEffect } from "react";

import { initSiteMotion } from "./site";

/** Starts the site-wide particle scene and cursor once; they persist across navigations. */
export function SiteMotion() {
  useEffect(() => {
    try {
      return initSiteMotion();
    } catch (err) {
      console.error(err);
    }
  }, []);
  return null;
}
