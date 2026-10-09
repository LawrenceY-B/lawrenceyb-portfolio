"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useStore } from "zustand";

import { prefersReducedMotion } from "@/lib/media";
import { ui } from "@/lib/store";

const STORAGE_KEY = "lyb-tilt";

type OrientationPermission = { requestPermission?: () => Promise<"granted" | "denied"> };
const orientation = () =>
  (typeof DeviceOrientationEvent === "undefined" ? undefined : DeviceOrientationEvent) as
    (typeof DeviceOrientationEvent & OrientationPermission) | undefined;

const noop = () => () => {};
const useSupported = () =>
  useSyncExternalStore(
    noop,
    () =>
      !!orientation() && window.matchMedia("(pointer: coarse)").matches && !prefersReducedMotion(),
    () => false,
  );

/**
 * Whether motion access is already granted. iOS only grants it from a tap (requestPermission),
 * so it answers no; Android and desktop Chromium answer through the Permissions API.
 */
async function granted(): Promise<boolean> {
  if (!orientation()?.requestPermission) return true;
  try {
    // Sensor permission names are not in TypeScript's PermissionName yet.
    const query = (name: string) => navigator.permissions.query({ name } as PermissionDescriptor);
    const states = await Promise.all(["accelerometer", "gyroscope"].map(query));
    return states.every((s) => s.state === "granted");
  } catch {
    return false;
  }
}

const remember = (on: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
};

export function TiltToggle() {
  const supported = useSupported();
  const on = useStore(ui, (s) => s.tilt);

  useEffect(() => {
    if (!supported) return;
    let pref: string | null = null;
    try {
      pref = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage blocked: fall back to the default.
    }
    if (pref === "off") return;
    let live = true;
    void granted().then((ok) => live && ok && ui.setState({ tilt: true }));
    return () => {
      live = false;
    };
  }, [supported]);

  if (!supported) return null;

  const toggle = async () => {
    if (on) {
      ui.setState({ tilt: false });
      return remember(false);
    }
    const ask = orientation()?.requestPermission;
    if (ask && (await ask.call(DeviceOrientationEvent).catch(() => "denied")) !== "granted") return;
    ui.setState({ tilt: true });
    remember(true);
  };

  return (
    <button
      type="button"
      className="icon"
      onClick={() => void toggle()}
      aria-pressed={on}
      aria-label="Tilt the particles with your phone"
      title="Tilt"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="8" y="3" width="8" height="18" rx="2" transform="rotate(-15 12 12)" />
        <path d="M3 9a9 9 0 0 1 2-4M21 15a9 9 0 0 1-2 4" />
      </svg>
    </button>
  );
}
