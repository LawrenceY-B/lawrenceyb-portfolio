import { createStore } from "zustand/vanilla";

/**
 * Shared UI state. React components (ticker, case sheet, theme, inspect) and the imperative
 * motion/particle modules read and write it instead of sharing DOM globals.
 */
export type UiState = {
  /** The hovered/focused project row's particle shape id, or null when none. */
  hoveredShape: number | null;
  /** Whether the case-study sheet is open; smooth scroll pauses while it is. */
  sheetOpen: boolean;
  /** The resolved colour scheme. */
  theme: "light" | "dark";
  /** Whether inspect mode is on. */
  inspect: boolean;
};

export const ui = createStore<UiState>()(() => ({
  hoveredShape: null,
  sheetOpen: false,
  theme: "light",
  inspect: false,
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
