/**
 * A tiny typed event bus. React components (ticker, case sheet, theme, inspect) and the
 * imperative motion/particle modules talk through it instead of sharing DOM globals.
 */
export type BusEvents = {
  /** A project row is hovered/focused (its particle shape id), or null when left. */
  "project-hover": number | null;
  /** The case-study sheet opened or closed; smooth scroll pauses while it is open. */
  "sheet-open": boolean;
  /** The resolved colour scheme changed. */
  theme: "light" | "dark";
  /** Inspect mode toggled. */
  inspect: boolean;
};

type Handler<T> = (payload: T) => void;

const handlers = new Map<keyof BusEvents, Set<Handler<never>>>();

export function on<K extends keyof BusEvents>(type: K, fn: Handler<BusEvents[K]>): () => void {
  let set = handlers.get(type);
  if (!set) handlers.set(type, (set = new Set()));
  set.add(fn as Handler<never>);
  return () => set.delete(fn as Handler<never>);
}

export function emit<K extends keyof BusEvents>(type: K, payload: BusEvents[K]): void {
  handlers.get(type)?.forEach((fn) => (fn as Handler<BusEvents[K]>)(payload));
}
