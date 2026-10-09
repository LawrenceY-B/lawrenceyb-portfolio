import { createStore } from "zustand/vanilla";

export type UiState = {
  hoveredShape: number | null;
  theme: "light" | "dark";
  inspect: boolean;
  tilt: boolean;
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
  tilt: false,
}));

/** Calls `fn` when `key` changes, not on every write. Returns an unsubscribe. */
export function watch<K extends keyof UiState>(
  key: K,
  fn: (value: UiState[K]) => void,
): () => void {
  return ui.subscribe((state, prev) => {
    if (state[key] !== prev[key]) fn(state[key]);
  });
}
