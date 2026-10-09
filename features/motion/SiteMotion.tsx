"use client";

import { useEffect } from "react";

import { initSiteMotion } from "./site";

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
