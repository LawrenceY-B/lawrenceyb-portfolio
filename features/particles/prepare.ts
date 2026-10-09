import { HEAD_POINTS, HEAD_SCALE } from "./data";
import { ORDER, buildShapes } from "./shapes";

export const N = 40000;
export const TW = 256;
export const BH = Math.ceil(N / TW);
export const TH = BH * ORDER.length;

/** Everything the GPU needs, as transferable typed arrays. */
type F32 = Float32Array<ArrayBuffer>;
export type Prepared = {
  head: F32;
  hb: F32;
  rnd: F32;
  uv: F32;
  /** All shapes packed into one RGBA float texture, BH rows per shape. */
  tex: F32;
};

/**
 * Decodes the head cloud and samples every procedural shape. CPU-heavy (~1s), so it normally
 * runs in a Web Worker (see prepare.worker.ts).
 */
export function prepare(headData: ArrayBuffer): Prepared {
  const q = new Int16Array(headData, 0, HEAD_POINTS * 3);
  const br = new Uint8Array(headData, HEAD_POINTS * 6, HEAD_POINTS);
  // Deterministic PRNG: the same seed and call order give the same cloud on every load.
  let seed = 3;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const head = new Float32Array(N * 3);
  const hb = new Float32Array(N);
  const rnd = new Float32Array(N * 4);
  const uv = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 3; k++) head[i * 3 + k] = (q[i * 3 + k]! / 32767) * HEAD_SCALE;
    hb[i] = br[i]! / 255;
    for (let k = 0; k < 4; k++) rnd[i * 4 + k] = r();
    uv[i * 2] = i % TW;
    uv[i * 2 + 1] = Math.floor(i / TW);
  }
  const shapes = buildShapes(N, r);
  const tex = new Float32Array(TW * TH * 4);
  ORDER.forEach((k, b) => tex.set(shapes[k], b * BH * TW * 4));
  return { head, hb, rnd, uv, tex };
}

export const transferables = (p: Prepared): ArrayBuffer[] =>
  [p.head, p.hb, p.rnd, p.uv, p.tex].map((a) => a.buffer);
