import { gsap } from "gsap";
import * as THREE from "three";

import { watch } from "@/lib/store";

import { fragmentShader, vertexShader } from "./shaders";

import { BH, N, type Prepared, TH, TW } from "./prepare";

/**
 * Shape id per scroll stop. Ids: 0 head, 1 code, 2 braces, 3 bolt, 4 cards, 5 phone, 6 percent,
 * 7 bubbles, 8 cap, 9 bars, 10 git, 11 layers, 12 car, 13 ball, 14 book.
 * Section order: hero, build(3), work, numbers, about, off(4), stack, contact.
 */
const IDS = [0, 1, 2, 3, 4, 9, 10, 12, 13, 14, 11, 0] as const;
const WORK_SHAPE = 4;
const CAR_SHAPE = 12;

export type ScrollInput = { seg: number; po: number };

export type Particles = {
  /** Intro "gather" progress, 0 → 1. Tween `.value`. */
  assemble: { value: number };
  dispose: () => void;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

export function createParticles(
  canvas: HTMLCanvasElement,
  data: Prepared,
  /** `shape` pins the cloud to one shape (case study pages) instead of following scroll. */
  opts: { reduce: boolean; narrow: boolean; scroll: () => ScrollInput; shape?: number },
): Particles {
  const { reduce, narrow, shape: fixed } = opts;
  const { head, hb, rnd, uv, tex } = data;
  const dt = new THREE.DataTexture(tex, TW, TH, THREE.RGBAFormat, THREE.FloatType);
  dt.minFilter = dt.magFilter = THREE.NearestFilter;
  dt.needsUpdate = true;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  const group = new THREE.Group();
  scene.add(group);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(head, 3));
  g.setAttribute("aHB", new THREE.BufferAttribute(hb, 1));
  g.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 4));
  g.setAttribute("aUV", new THREE.BufferAttribute(uv, 2));
  if (narrow) g.setDrawRange(0, Math.floor(N * 0.6));

  const V3 = () => new THREE.Vector3();
  const U = {
    uTex: { value: dt },
    uTH: { value: TH },
    uBH: { value: BH },
    uA: { value: 0 },
    uB: { value: 0 },
    uF: { value: 0 },
    uOffA: { value: V3() },
    uOffB: { value: V3() },
    uSclA: { value: 1 },
    uSclB: { value: 1 },
    uOpA: { value: 1 },
    uOpB: { value: 1 },
    uH: { value: 4 },
    uHMix: { value: 0 },
    uHOff: { value: V3() },
    uHScl: { value: 1 },
    uAssemble: { value: reduce ? 1 : 0 },
    uTime: { value: 0 },
    uMotion: { value: reduce ? 0 : 1 },
    uSpeed: { value: 0 },
    uField: { value: V3() },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uHover: { value: 0 },
    uInk: { value: new THREE.Color() },
    uRed: { value: new THREE.Color() },
    uYel: { value: new THREE.Color() },
    uSize: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    vertexShader,
    fragmentShader,
  });
  group.add(new THREE.Points(g, mat));

  function theme() {
    const s = getComputedStyle(document.documentElement);
    U.uInk.value.set(s.getPropertyValue("--ink").trim());
    U.uRed.value.set(s.getPropertyValue("--red").trim());
    U.uYel.value.set(s.getPropertyValue("--p-yellow").trim());
    const lum = U.uInk.value.r + U.uInk.value.g + U.uInk.value.b;
    mat.blending = lum > 1.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.needsUpdate = true;
  }

  const view = { w: 1, h: 1 };
  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan(THREE.MathUtils.degToRad(16));
    const dist = Math.max(2.75 / 2 / tan, 2.6 / 2 / tan / camera.aspect);
    camera.position.set(0, -0.08, dist);
    camera.updateProjectionMatrix();
    view.h = 2 * dist * tan;
    view.w = view.h * camera.aspect;
    U.uField.value.set(view.w * 1.1, view.h * 1.1, 2.5);
    U.uSize.value = renderer.getPixelRatio() * Math.min(1.25, Math.max(0.8, h / 900)) * 1.4;
  }

  /** [offsetX, offsetY, scale, opacity] for a shape at a scroll stop. */
  function cfg(id: number, k: number, po: number): [number, number, number, number] {
    const W = view.w;
    const wide = W > view.h * 1.05;
    const side = wide ? W * 0.24 : 0;
    const back = wide ? 1 : 0.28;
    if (id === 0) return [wide ? W * 0.2 : 0, k === 0 ? (wide ? -0.2 : 0) : -0.1, 1, back];
    if (id === CAR_SHAPE) {
      const x0 = -W * 0.6;
      const x1 = side;
      return [x0 + (x1 - x0) * smooth(clamp01(po / 0.1)), -0.1, wide ? 0.62 : 0.5, wide ? 1 : 0.4];
    }
    return [side, 0, wide ? 0.9 : 0.7, back];
  }

  theme();
  size();

  const ac = new AbortController();
  const { signal } = ac;
  const target = { rx: 0, ry: 0 };
  let hoverId: number = WORK_SHAPE;
  let hoverOn = false;
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;

  window.addEventListener("resize", size, { signal });
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const m2 = new THREE.Vector2();
  window.addEventListener(
    "pointermove",
    (e) => {
      m2.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      ray.setFromCamera(m2, camera);
      if (ray.ray.intersectPlane(plane, hit)) U.uMouse.value.set(hit.x, hit.y);
      target.ry = m2.x * 0.3;
      target.rx = -m2.y * 0.12;
      gsap.to(U.uHover, { value: 1, duration: 0.4, overwrite: true });
    },
    { signal },
  );
  document.addEventListener(
    "pointerleave",
    () => gsap.to(U.uHover, { value: 0, duration: 0.8, overwrite: true }),
    {
      signal,
    },
  );

  const offTheme = watch("theme", theme);
  // Project hover: fade back to the card stack, then form the hovered project.
  const offHover = watch("hoveredShape", (shape) => {
    clearTimeout(hoverTimer);
    if (shape === null) {
      hoverOn = false;
    } else if (hoverOn && hoverId !== shape) {
      hoverOn = false;
      hoverTimer = setTimeout(() => {
        hoverId = shape;
        hoverOn = true;
      }, 260);
    } else {
      hoverId = shape;
      hoverOn = true;
    }
  });

  const clock = new THREE.Clock();
  let seg: number | null = null;
  let poS = 0;
  let lastCarX: number | null = null;
  let lastT = 0;
  let raf = 0;
  function loop() {
    const t = clock.getElapsedTime();
    U.uTime.value = t;
    const d = Math.min(0.1, t - lastT);
    lastT = t;
    const kk = 1 - Math.exp(-d * 3.2);
    const ts = opts.scroll();
    if (seg === null) seg = ts.seg;
    seg += (ts.seg - seg) * (reduce ? 1 : kk);
    poS += (ts.po - poS) * (reduce ? 1 : kk * 1.5);
    const i = Math.max(0, Math.min(IDS.length - 2, Math.floor(seg)));
    const f = fixed === undefined ? Math.min(1, seg - i) : 0;
    const idA = fixed ?? IDS[i]!;
    const idB = fixed ?? IDS[i + 1]!;
    const A = cfg(idA, i, poS);
    const B = cfg(idB, i + 1, poS);
    U.uA.value = idA;
    U.uB.value = idB;
    U.uF.value = f;
    U.uOffA.value.set(A[0], A[1], 0);
    U.uOffB.value.set(B[0], B[1], 0);
    U.uSclA.value = A[2];
    U.uSclB.value = B[2];
    U.uOpA.value = A[3];
    U.uOpB.value = B[3];
    const H = cfg(hoverId, 0, 0);
    U.uH.value = hoverId;
    U.uHOff.value.set(H[0], H[1], 0);
    U.uHScl.value = H[2];
    // Hover only applies while the work shape is showing.
    const inWork = (idA === WORK_SHAPE && f < 0.5) || (idB === WORK_SHAPE && f >= 0.5);
    const hTarget = hoverOn && inWork ? 1 : 0;
    U.uHMix.value += (hTarget - U.uHMix.value) * (reduce ? 1 : 1 - Math.exp(-d * 5));
    const carX = cfg(CAR_SHAPE, 0, poS)[0];
    const sp = lastCarX === null ? 0 : (Math.abs(carX - lastCarX) / Math.max(d, 0.001)) * 0.25;
    lastCarX = carX;
    U.uSpeed.value += (Math.min(1, sp) - U.uSpeed.value) * 0.1;
    const spin = (idA === 0 && f < 0.5) || (idB === 0 && f > 0.5) ? 1 : 0.5;
    const idle = reduce ? 0 : Math.sin(t * 0.3) * 0.05;
    group.rotation.y += ((target.ry + idle) * spin - group.rotation.y) * 0.05;
    group.rotation.x += (target.rx * spin - group.rotation.x) * 0.05;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    assemble: U.uAssemble,
    dispose() {
      cancelAnimationFrame(raf);
      clearTimeout(hoverTimer);
      ac.abort();
      offTheme();
      offHover();
      gsap.killTweensOf(U.uHover);
      gsap.killTweensOf(U.uAssemble);
      g.dispose();
      mat.dispose();
      dt.dispose();
      renderer.dispose();
    },
  };
}
