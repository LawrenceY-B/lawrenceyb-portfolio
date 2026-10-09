import { createStore } from "zustand/vanilla";

/**
 * Shared UI state. React components (project rows, theme, inspect) and the imperative
 * motion/particle modules read and write it instead of sharing DOM globals.
 */
export type UiState = {
  /** The hovered/focused project row's particle shape id, or null when none. */
  hoveredShape: number | null;
  /** The resolved colour scheme. */
  theme: "light" | "dark";
  /** Whether inspect mode is on. */
  inspect: boolean;
  /** Particle shape a page holds (case studies, 404), or null to follow scroll (home). */
  sceneShape: number | null;
  /** Slug of the case study last opened from the project list; home scrolls back to its row. */
  lastCase: string | null;
};

export const ui = createStore<UiState>()(() => ({
  hoveredShape: null,
  theme: "light",
  inspect: false,
  lastCase: null,
  sceneShape: null,
}));

/** Calls `fn` whenever `key` changes. Returns an unsubscribe. */
export function watch<K extends keyof UiState>(
  key: K,
  fn: (value: UiState[K]) => void,
): () => void {
  return ui.subscribe((state, prev) => {
    if (state[key] !== prev[key]) fn(state[key]);
  });
}
