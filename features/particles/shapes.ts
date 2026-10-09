/**
 * Procedural 3D shapes sampled into lit particles.
 * Each shape is a Float32Array(N * 4) of x, y, z, w where w = colorIndex + brightness * 0.9
 * (colorIndex: 0 ink, 1 red, 2 yellow).
 */
import * as THREE from "three";

export const ORDER = [
  "code",
  "braces",
  "bolt",
  "cards",
  "phone",
  "notes",
  "bubbles",
  "cap",
  "bars",
  "git",
  "layers",
  "car",
  "ball",
  "book",
  "bulb",
] as const;
export type ShapeName = (typeof ORDER)[number];

type Vec3 = [number, number, number];
type Part = {
  g: THREE.BufferGeometry;
  m?: THREE.Matrix4;
  /** Colour index: 0 ink, 1 red, 2 yellow. */
  c?: number;
  /** Sampling weight relative to surface area. */
  w?: number;
  /** Double-sided: flip back-facing normals towards the camera. */
  ds?: boolean;
};
type SampleOpts = { view?: THREE.Matrix4; w?: number; h?: number };
type Tri = {
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  n: THREE.Vector3;
  color: number;
};

export function buildShapes(N: number, rand: () => number): Record<ShapeName, Float32Array> {
  const M = () => new THREE.Matrix4();
  const T = (x: number, y: number, z: number) => M().makeTranslation(x, y, z);
  const R = (x: number, y: number, z: number) =>
    M().makeRotationFromEuler(new THREE.Euler(x, y, z));
  const S = (x: number, y: number, z: number) => M().makeScale(x, y, z);
  /** C(T, R, S) applies S, then R, then T. */
  const C = (...ms: THREE.Matrix4[]) => ms.reduce((a, b) => a.multiply(b), M());
  const L = new THREE.Vector3(-0.45, 0.6, 0.75).normalize();

  function sample(parts: Part[], opt: SampleOpts): Float32Array {
    const view = opt.view ?? M();
    const tri: Tri[] = [];
    const area: number[] = [];
    let total = 0;
    for (const p of parts) {
      const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
      g.applyMatrix4(p.m ?? M());
      g.applyMatrix4(view);
      const a = g.attributes.position!.array as ArrayLike<number>;
      for (let i = 0; i < a.length; i += 9) {
        const A = new THREE.Vector3(a[i], a[i + 1], a[i + 2]);
        const B = new THREE.Vector3(a[i + 3], a[i + 4], a[i + 5]);
        const Cc = new THREE.Vector3(a[i + 6], a[i + 7], a[i + 8]);
        const n = new THREE.Vector3().crossVectors(B.clone().sub(A), Cc.clone().sub(A));
        const ar = n.length() / 2;
        if (ar < 1e-9) continue;
        n.normalize();
        if (p.ds && n.z < 0) n.negate();
        tri.push({ a: A, b: B, c: Cc, n, color: p.c ?? 0 });
        total += ar * (p.w ?? 1);
        area.push(total);
      }
    }
    const out = new Float32Array(N * 4);
    const mn = [1e9, 1e9, 1e9];
    const mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < N; i++) {
      const x = rand() * total;
      let lo = 0;
      let hi = area.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (area[mid]! < x) lo = mid + 1;
        else hi = mid;
      }
      const { a: A, b: B, c: Cc, n, color } = tri[lo]!;
      let u = rand();
      let v = rand();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const px = A.x + (B.x - A.x) * u + (Cc.x - A.x) * v;
      const py = A.y + (B.y - A.y) * u + (Cc.y - A.y) * v;
      const pz = A.z + (B.z - A.z) * u + (Cc.z - A.z) * v;
      let b = 0.26 + 0.74 * Math.max(0, n.dot(L)) + 0.22 * Math.pow(1 - Math.abs(n.z), 2);
      if (n.z < -0.05) b *= 0.5;
      b = Math.min(1, b) * (0.88 + 0.12 * rand());
      out[i * 4] = px;
      out[i * 4 + 1] = py;
      out[i * 4 + 2] = pz;
      out[i * 4 + 3] = color + b * 0.9;
      mn[0] = Math.min(mn[0]!, px);
      mn[1] = Math.min(mn[1]!, py);
      mn[2] = Math.min(mn[2]!, pz);
      mx[0] = Math.max(mx[0]!, px);
      mx[1] = Math.max(mx[1]!, py);
      mx[2] = Math.max(mx[2]!, pz);
    }
    const cx = (mn[0]! + mx[0]!) / 2;
    const cy = (mn[1]! + mx[1]!) / 2;
    const cz = (mn[2]! + mx[2]!) / 2;
    const s = Math.min((opt.w ?? 2.6) / (mx[0]! - mn[0]!), (opt.h ?? 2.2) / (mx[1]! - mn[1]!));
    for (let i = 0; i < N; i++) {
      out[i * 4] = (out[i * 4]! - cx) * s;
      out[i * 4 + 1] = (out[i * 4 + 1]! - cy) * s;
      out[i * 4 + 2] = (out[i * 4 + 2]! - cz) * s;
    }
    return out;
  }

  const ext = (shape: THREE.Shape, depth: number, bevel: number, segs = 24) =>
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel * 0.8,
      bevelSegments: 4,
      curveSegments: segs,
    });
  const poly = (pts: [number, number][]) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    return s;
  };
  const rrect = (w: number, h: number, r: number) => {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt: number, rb: number, h: number, seg = 32) =>
    new THREE.CylinderGeometry(rt, rb, h, seg, 1);
  const sph = (r: number) => new THREE.SphereGeometry(r, 32, 20);
  const tube = (pts: Vec3[], r: number) =>
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))),
      120,
      r,
      16,
      false,
    );

  const out = {} as Record<ShapeName, Float32Array>;

  // 1. </>
  {
    const chev = poly([
      [0.55, 1],
      [-0.45, 0],
      [0.55, -1],
      [0.98, -1],
      [-0.02, 0],
      [0.98, 1],
    ]);
    const slash = poly([
      [-0.42, -1.12],
      [0.0, -1.12],
      [0.42, 1.12],
      [0.0, 1.12],
    ]);
    const d = 0.45;
    const bv = 0.07;
    out.code = sample(
      [
        { g: ext(chev, d, bv), m: T(-1.75, 0, -d / 2) },
        { g: ext(chev, d, bv), m: C(T(1.75, 0, d / 2), R(0, Math.PI, 0)) },
        { g: ext(slash, d, bv), m: T(0, 0, -d / 2), c: 1 },
      ],
      { view: R(-0.18, 0.42, 0), w: 3.0, h: 2.0 },
    );
  }
  // 2. {.}
  {
    const brace: Vec3[] = (
      [
        [0.42, 1.15],
        [0.12, 1.05],
        [0.02, 0.75],
        [0.02, 0.3],
        [-0.12, 0.08],
        [-0.34, 0],
        [-0.12, -0.08],
        [0.02, -0.3],
        [0.02, -0.75],
        [0.12, -1.05],
        [0.42, -1.15],
      ] as const
    ).map(([x, y]) => [x, y, 0]);
    out.braces = sample(
      [
        { g: tube(brace, 0.13), m: T(-1.1, 0, 0) },
        {
          g: tube(
            brace.map(([x, y, z]) => [-x, y, z]),
            0.13,
          ),
          m: T(1.1, 0, 0),
        },
        { g: sph(0.24), m: T(0, -0.78, 0), c: 1, w: 1.4 },
      ],
      { view: R(-0.15, -0.45, 0), w: 2.6, h: 2.1 },
    );
  }
  // 3. Lightning bolt
  {
    const bolt = poly([
      [0.25, 1.5],
      [-0.75, -0.1],
      [-0.08, -0.1],
      [-0.42, -1.5],
      [0.78, 0.25],
      [0.1, 0.25],
      [0.55, 1.5],
    ]);
    out.bolt = sample([{ g: ext(bolt, 0.4, 0.08), m: T(0, 0, -0.2), c: 2 }], {
      view: R(-0.1, 0.5, 0.08),
      w: 1.8,
      h: 2.4,
    });
  }
  // 4. Project card stack
  {
    const parts: Part[] = [];
    for (let k = 0; k < 4; k++) {
      parts.push({
        g: ext(rrect(2.2, 1.4, 0.12), 0.05, 0.025),
        m: C(T(k * 0.22, k * 0.26, -k * 0.5), R(0, 0, -0.06 * k)),
        c: 0,
        w: k === 0 ? 1.3 : 0.8,
      });
    }
    parts.push({ g: box(0.9, 0.12, 0.04), m: T(-0.45, 0.4, 0.09), c: 1, w: 2 });
    parts.push({ g: box(1.6, 0.06, 0.03), m: T(-0.15, 0.1, 0.09), c: 0, w: 2 });
    parts.push({ g: box(1.3, 0.06, 0.03), m: T(-0.3, -0.08, 0.09), c: 0, w: 2 });
    out.cards = sample(parts, { view: R(-0.3, 0.75, 0), w: 2.6, h: 2.1 });
  }
  // 5. Trade Sim: phone with candlesticks
  {
    const parts: Part[] = [{ g: ext(rrect(1.15, 2.3, 0.18), 0.12, 0.05), m: T(0, 0, -0.06), c: 0 }];
    let y = 0;
    for (let k = 0; k < 9; k++) {
      const up = rand() > 0.35;
      const h = 0.12 + rand() * 0.28;
      y += (up ? 1 : -0.6) * 0.07;
      const x = -0.4 + k * 0.1;
      parts.push({ g: box(0.06, h, 0.05), m: T(x, y - 0.1, 0.13), c: up ? 1 : 0, w: 3 });
      parts.push({ g: box(0.012, h + 0.14, 0.02), m: T(x, y - 0.1, 0.12), c: up ? 1 : 0, w: 3 });
    }
    parts.push({ g: box(0.7, 0.08, 0.03), m: T(-0.12, 0.85, 0.12), c: 0, w: 2 });
    parts.push({ g: box(0.45, 0.14, 0.03), m: T(-0.24, 0.66, 0.12), c: 0, w: 2 });
    parts.push({ g: ext(rrect(0.8, 0.18, 0.09), 0.03, 0.01), m: T(0, -0.85, 0.1), c: 1, w: 2 });
    out.phone = sample(parts, { view: R(-0.08, 0.5, 0.05), w: 1.6, h: 2.3 });
  }
  // 6. Treasury Bills: a 3D percent sign (interest rates)
  {
    const ring = new THREE.TorusGeometry(0.36, 0.14, 24, 64);
    out.notes = sample(
      [
        { g: ring, m: T(-0.62, 0.68, 0), c: 0 },
        { g: ring, m: T(0.62, -0.68, 0), c: 0 },
        { g: ext(rrect(0.3, 2.5, 0.12), 0.3, 0.06), m: C(T(0, 0, -0.15), R(0, 0, -0.6)), c: 1 },
      ],
      { view: R(-0.15, 0.5, 0), w: 2.0, h: 2.2 },
    );
  }
  // 7. Friendwave: chat bubbles
  {
    const bub = (w: number, h: number, tailLeft: boolean): [THREE.Shape, THREE.Shape] => {
      const s = rrect(w, h, h / 2.2);
      const t = new THREE.Shape();
      const x = tailLeft ? -w / 2 + 0.25 : w / 2 - 0.25;
      t.moveTo(x - 0.12, -h / 2 + 0.05);
      t.lineTo(x + (tailLeft ? -0.2 : 0.2), -h / 2 - 0.28);
      t.lineTo(x + 0.12, -h / 2 + 0.05);
      t.closePath();
      return [s, t];
    };
    const [b1, t1] = bub(1.9, 0.9, true);
    const [b2, t2] = bub(1.4, 0.75, false);
    const parts: Part[] = [
      { g: ext(b1, 0.22, 0.07), m: T(-0.35, 0.45, -0.3), c: 0 },
      { g: ext(t1, 0.22, 0.04), m: T(-0.35, 0.45, -0.3), c: 0 },
      { g: ext(b2, 0.22, 0.07), m: T(0.55, -0.5, 0.25), c: 1 },
      { g: ext(t2, 0.22, 0.04), m: T(0.55, -0.5, 0.25), c: 1 },
    ];
    [-0.3, 0, 0.3].forEach((x) =>
      parts.push({ g: sph(0.09), m: T(0.55 + x, -0.5, 0.58), c: 2, w: 3 }),
    );
    out.bubbles = sample(parts, { view: R(-0.1, -0.45, 0), w: 2.5, h: 2.0 });
  }
  // 8. EduSearch: graduation cap
  {
    const parts: Part[] = [
      { g: box(2.0, 0.07, 2.0), m: C(T(0, 0.45, 0), R(0, Math.PI / 4, 0)), c: 0 },
      { g: cyl(0.72, 0.62, 0.55, 48), m: T(0, 0.12, 0), c: 0 },
      { g: cyl(0.1, 0.1, 0.06, 20), m: T(0, 0.52, 0), c: 1, w: 3 },
      {
        g: tube(
          [
            [0, 0.52, 0],
            [0.5, 0.5, 0.5],
            [0.95, 0.46, 0.95],
            [1.0, 0.2, 1.0],
            [1.0, -0.15, 1.0],
          ],
          0.022,
        ),
        c: 1,
        w: 3,
      },
      { g: cyl(0.06, 0.12, 0.32, 16), m: T(1.0, -0.3, 1.0), c: 2, w: 3 },
    ];
    out.cap = sample(parts, { view: R(0.5, 0.35, 0), w: 2.5, h: 1.9 });
  }
  // 9. Numbers: rising bars
  {
    const hs = [0.45, 0.8, 1.15, 1.6, 2.2];
    const parts: Part[] = [{ g: box(3.0, 0.06, 1.0), m: T(0, -0.03, 0), c: 0, w: 0.5 }];
    hs.forEach((h, k) =>
      parts.push({ g: box(0.4, h, 0.4), m: T(-1.1 + k * 0.55, h / 2, 0), c: k === 4 ? 1 : 0 }),
    );
    out.bars = sample(parts, { view: R(0.32, -0.6, 0), w: 2.6, h: 2.1 });
  }
  // 10. About: git graph
  {
    const parts: Part[] = [];
    const main: Vec3[] = [];
    for (let k = 0; k < 6; k++) main.push([-1.5 + k * 0.6, 0, 0]);
    parts.push({ g: tube(main, 0.045), c: 0, w: 1.4 });
    main.forEach((p, k) =>
      parts.push({ g: sph(k === 5 ? 0.2 : 0.14), m: T(...p), c: k === 5 ? 1 : 0, w: 2 }),
    );
    const br: Vec3[] = [
      [-0.9, 0, 0],
      [-0.6, 0.45, 0.25],
      [-0.1, 0.62, 0.35],
      [0.5, 0.6, 0.35],
      [0.95, 0.35, 0.2],
      [1.2, 0, 0],
    ];
    parts.push({ g: tube(br, 0.04), c: 2, w: 1.4 });
    (
      [
        [-0.1, 0.62, 0.35],
        [0.5, 0.6, 0.35],
      ] as Vec3[]
    ).forEach((p) => parts.push({ g: sph(0.12), m: T(...p), c: 2, w: 2 }));
    const br2: Vec3[] = [
      [-0.3, 0, 0],
      [0.0, -0.4, -0.2],
      [0.4, -0.55, -0.3],
      [0.8, -0.55, -0.3],
    ];
    parts.push({ g: tube(br2, 0.035), c: 0, w: 1.2 });
    parts.push({ g: sph(0.11), m: T(0.8, -0.55, -0.3), c: 0, w: 2 });
    out.git = sample(parts, { view: R(-0.25, 0.5, 0), w: 2.8, h: 1.6 });
  }
  // 11. Stack: stacked layers
  {
    const parts: Part[] = [];
    for (let k = 0; k < 4; k++)
      parts.push({
        g: ext(rrect(1.8, 1.8, 0.2), 0.08, 0.03),
        m: C(T(0, k * 0.55, 0), R(-Math.PI / 2, 0, 0)),
        c: k === 3 ? 1 : 0,
        w: k === 3 ? 1.4 : 1,
      });
    out.layers = sample(parts, { view: R(0.42, 0.78, 0), w: 2.4, h: 2.2 });
  }
  // 12. F1 car (x forward, y up, z lateral; metres)
  {
    const P: Part[] = [];
    const side = (
      pts: [number, number][],
      w: number,
      z: number,
      c: number,
      wt: number,
      bev = 0.05,
    ) => P.push({ g: ext(poly(pts), w, bev, 32), m: T(0, 0, z), c, w: wt });
    // Main body / engine cover / airbox
    side(
      [
        [1.45, 0.18],
        [1.45, 0.46],
        [0.95, 0.53],
        [0.55, 0.6],
        [0.25, 0.6],
        [0.02, 0.86],
        [-0.3, 0.92],
        [-0.62, 0.78],
        [-1.3, 0.54],
        [-1.8, 0.42],
        [-1.85, 0.18],
      ],
      0.66,
      -0.33,
      1,
      1,
    );
    // Sidepods (both sides)
    const pod: [number, number][] = [
      [0.55, 0.16],
      [0.55, 0.5],
      [0.3, 0.56],
      [-0.5, 0.5],
      [-1.3, 0.3],
      [-1.35, 0.16],
    ];
    side(pod, 0.36, 0.33, 1, 1, 0.07);
    side(pod, 0.36, -0.69, 1, 1, 0.07);
    // Nose cone
    P.push({
      g: cyl(0.07, 0.19, 1.25, 40),
      m: C(T(2.05, 0.3, 0), R(0, 0, -Math.PI / 2 - 0.1), S(1, 1, 1.25)),
      c: 1,
    });
    // Floor
    P.push({ g: box(3.9, 0.03, 1.5), m: T(-0.25, 0.12, 0), c: 0, w: 0.25 });
    // Shark fin
    side(
      [
        [-0.35, 0.9],
        [-1.55, 0.74],
        [-1.55, 0.56],
        [-0.4, 0.7],
      ],
      0.03,
      -0.015,
      1,
      0.6,
      0.01,
    );
    // Helmet + halo
    P.push({ g: sph(0.15), m: T(0.32, 0.68, 0), c: 2, w: 2 });
    P.push({
      g: new THREE.TorusGeometry(0.33, 0.035, 12, 48, Math.PI),
      m: C(T(0.3, 0.84, 0), R(-Math.PI / 2, 0, -Math.PI / 2)),
      c: 0,
      w: 2,
    });
    P.push({ g: cyl(0.03, 0.03, 0.28, 12), m: C(T(0.66, 0.72, 0), R(0, 0, 0.35)), c: 0, w: 2 });
    // Front wing: three elements + endplates
    (
      [
        [2.6, 0.1, 0.0],
        [2.46, 0.15, -0.12],
        [2.33, 0.2, -0.22],
      ] as Vec3[]
    ).forEach(([x, y, a]) =>
      P.push({ g: box(0.32, 0.025, 1.9), m: C(T(x, y, 0), R(0, 0, a)), c: 0, w: 0.9 }),
    );
    [-0.97, 0.97].forEach((z) =>
      P.push({ g: box(0.5, 0.22, 0.025), m: T(2.45, 0.2, z), c: 1, w: 1 }),
    );
    // Rear wing
    P.push({ g: box(0.36, 0.045, 1.1), m: C(T(-2.12, 0.92, 0), R(0, 0, 0.12)), c: 0 });
    P.push({ g: box(0.26, 0.035, 1.1), m: C(T(-2.0, 1.04, 0), R(0, 0, 0.45)), c: 0 });
    [-0.57, 0.57].forEach((z) => P.push({ g: box(0.62, 0.62, 0.03), m: T(-2.08, 0.78, z), c: 1 }));
    P.push({ g: box(0.3, 0.035, 0.9), m: T(-2.05, 0.42, 0), c: 0 });
    P.push({ g: box(0.08, 0.5, 0.06), m: T(-2.0, 0.66, 0), c: 0 });
    // Mirrors
    [-0.42, 0.42].forEach((z) =>
      P.push({ g: box(0.12, 0.06, 0.16), m: T(0.6, 0.66, z), c: 1, w: 2 }),
    );
    // Wheels: tyre torus + yellow sidewall band + rim, front and rear
    (
      [
        [1.75, 0.33, 0.33, 0.86],
        [-1.62, 0.36, 0.4, 0.84],
      ] as const
    ).forEach(([x, r, wdt, z0]) =>
      [-z0, z0].forEach((z) => {
        P.push({
          g: new THREE.TorusGeometry(r * 0.72, r * 0.3, 20, 64),
          m: C(T(x, r, z), S(1, 1, wdt / (r * 0.6))),
          c: 0,
          w: 1.2,
        });
        P.push({
          g: new THREE.TorusGeometry(r * 0.78, 0.012, 8, 64),
          m: T(x, r, z + Math.sign(z) * wdt * 0.5),
          c: 2,
          w: 3,
        });
        P.push({
          g: cyl(r * 0.45, r * 0.45, wdt * 0.9, 32),
          m: C(T(x, r, z), R(Math.PI / 2, 0, 0)),
          c: 0,
          w: 0.5,
        });
      }),
    );
    // Suspension arms
    (
      [
        [1.75, 0.86],
        [-1.62, 0.84],
      ] as const
    ).forEach(([x, z0]) =>
      [-1, 1].forEach((s) =>
        [0.26, 0.42].forEach((y) =>
          P.push({
            g: cyl(0.018, 0.018, z0 - 0.3, 8),
            m: C(T(x + (x > 0 ? -0.15 : 0.15), y, (s * (z0 + 0.3)) / 2), R(Math.PI / 2, 0, 0)),
            c: 0,
            w: 2,
          }),
        ),
      ),
    );
    out.car = sample(P, { view: R(0.3, -0.62, 0), w: 3.3, h: 1.7 });
  }
  // 13. Basketball: solid shaded sphere, seams are grooves (no particles), pebbled shading
  {
    const o = new Float32Array(N * 4);
    const view = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.3, -0.5, 0.15));
    const v = new THREE.Vector3();
    let i = 0;
    while (i < N) {
      const u = rand() * 2 - 1;
      const th = rand() * 6.2832;
      const s = Math.sqrt(1 - u * u);
      const x = s * Math.cos(th);
      const y = u;
      const z = s * Math.sin(th);
      const sw = 0.035;
      const seam =
        Math.abs(x) < sw || Math.abs(y) < sw || Math.abs(Math.abs(z) - (0.66 - 0.3 * y * y)) < sw;
      if (seam) continue;
      v.set(x, y, z).applyMatrix4(view);
      if (v.z < -0.3) continue;
      let b = 0.22 + 0.78 * Math.max(0, v.dot(L)) + 0.18 * Math.pow(1 - Math.abs(v.z), 2);
      if (v.z < -0.05) b *= 0.45;
      b = Math.min(1, b) * (0.8 + 0.2 * rand());
      o[i * 4] = v.x * 0.98;
      o[i * 4 + 1] = v.y * 0.98;
      o[i * 4 + 2] = v.z * 0.98;
      o[i * 4 + 3] = 1 + b * 0.9;
      i++;
    }
    out.ball = o;
  }
  // 14. Open book
  {
    const parts: Part[] = [];
    const page = (s: number) => {
      const g = new THREE.PlaneGeometry(1.1, 1.5, 40, 1);
      const a = g.attributes.position!;
      for (let i = 0; i < a.count; i++) {
        const u = Math.max(0, (a.getX(i) + 0.55) / 1.1);
        a.setX(i, s * (0.03 + u * 1.1));
        a.setZ(i, 0.32 * Math.sqrt(u) - 0.24 * u);
      }
      g.computeVertexNormals();
      return g;
    };
    parts.push({ g: page(1), c: 0, ds: true }, { g: page(-1), c: 0, ds: true });
    for (let k = 0; k < 11; k++)
      [-1, 1].forEach((s) => {
        const g = new THREE.PlaneGeometry(0.85, 0.035, 30, 1);
        const a = g.attributes.position!;
        for (let i = 0; i < a.count; i++) {
          const u = Math.max(0, (a.getX(i) + 0.425) / 1.1 + 0.12);
          a.setX(i, s * (0.03 + u * 1.1));
          a.setZ(i, 0.32 * Math.sqrt(u) - 0.24 * u + 0.006);
        }
        parts.push({ g, m: T(0, 0.55 - k * 0.11, 0), c: 0, w: 3, ds: true });
      });
    parts.push({ g: box(2.4, 1.62, 0.06), m: T(0, 0, -0.06), c: 1, w: 0.35 });
    [-1, 1].forEach((s) =>
      parts.push({ g: box(0.06, 1.5, 0.1), m: T(s * 1.16, 0, -0.01), c: 0, w: 0.8 }),
    );
    out.book = sample(parts, { view: R(-0.6, 0.2, 0.04), w: 2.7, h: 1.9 });
  }
  // 15. 404: a smashed light bulb
  {
    const profile = new THREE.SplineCurve(
      (
        [
          [0.27, -0.42],
          [0.3, -0.28],
          [0.44, -0.06],
          [0.66, 0.18],
          [0.78, 0.46],
          [0.75, 0.78],
          [0.58, 1.03],
          [0.32, 1.16],
          [0.001, 1.2],
        ] as const
      ).map(([x, y]) => new THREE.Vector2(x, y)),
    ).getPoints(72);
    /** Point on the glass at height y and lathe angle a (0 faces the camera). */
    const onGlass = (y: number, a: number): Vec3 => {
      let k = 1;
      while (k < profile.length - 1 && profile[k]!.y < y) k++;
      const p0 = profile[k - 1]!;
      const p1 = profile[k]!;
      const r = p0.x + ((p1.x - p0.x) * (y - p0.y)) / (p1.y - p0.y || 1);
      return [r * Math.sin(a) * 1.004, y, r * Math.cos(a) * 1.004];
    };
    /** Signed angle from a to b, wrapped to [-π, π]. */
    const dAng = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
    /** Jagged edge: a few sines at odd frequencies read as broken glass. */
    const jag = (y: number, s: number) =>
      0.22 * Math.sin(y * 29 + s) + 0.14 * Math.sin(y * 71 + s * 2) + 0.08 * Math.sin(y * 151);

    const full = new THREE.LatheGeometry(profile, 140).toNonIndexed();
    const src = full.attributes.position!.array as ArrayLike<number>;
    const kept: number[] = [];
    for (let i = 0; i < src.length; i += 9) {
      const cx = (src[i]! + src[i + 3]! + src[i + 6]!) / 3;
      const cy = (src[i + 1]! + src[i + 4]! + src[i + 7]!) / 3;
      const cz = (src[i + 2]! + src[i + 5]! + src[i + 8]!) / 3;
      const a = Math.atan2(cx, cz);
      // The big hole, centred on the right-hand silhouette and reaching over the top.
      const t = (cy - 0.08) / 1.14;
      if (t > 0 && t < 1 && Math.abs(dAng(a, 1.25)) < Math.sin(Math.PI * t) * (1.05 + jag(cy, 0)))
        continue;
      // A smaller chip out of the upper left edge.
      const u = (cy - 0.72) / 0.32;
      if (u > 0 && u < 1 && Math.abs(dAng(a, -1.6)) < Math.sin(Math.PI * u) * (0.42 + jag(cy, 3)))
        continue;
      // Glass reads at its edges: keep faces seen side-on (the outline) and a sparse fill.
      const ux = src[i + 3]! - src[i]!;
      const uy = src[i + 4]! - src[i + 1]!;
      const uz = src[i + 5]! - src[i + 2]!;
      const vx = src[i + 6]! - src[i]!;
      const vy = src[i + 7]! - src[i + 1]!;
      const vz = src[i + 8]! - src[i + 2]!;
      const nz = ux * vy - uy * vx;
      const nl = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, nz) || 1;
      if (Math.abs(nz / nl) > 0.42 && (i / 9) % 7 !== 0) continue;
      for (let k = 0; k < 9; k++) kept.push(src[i + k]!);
    }
    const glass = new THREE.BufferGeometry();
    glass.setAttribute("position", new THREE.Float32BufferAttribute(kept, 3));
    full.dispose();

    // Cracks: zig-zag lines on the glass running from the hole across the front.
    const crack = (y0: number, a0: number, steps: number, dy: number, da: number, s: number) =>
      tube(
        Array.from({ length: steps }, (_, k) =>
          onGlass(
            y0 + dy * k + 0.035 * Math.sin(k * 2.3 + s),
            a0 + da * k + 0.06 * Math.sin(k * 3.7 + s),
          ),
        ),
        0.006,
      );
    const cracks = [
      crack(0.62, 0.55, 9, 0.02, -0.16, 0),
      crack(0.86, 0.5, 8, 0.03, -0.17, 1),
      crack(0.36, 0.6, 8, -0.035, -0.14, 2),
      crack(0.7, -0.15, 5, 0.06, -0.09, 3),
      crack(0.98, -0.6, 4, -0.05, -0.14, 4),
    ];

    const parts: Part[] = [
      { g: glass, c: 0, w: 1.6, ds: true },
      ...cracks.map((g) => ({ g, c: 0, w: 7 })),
      // Filament supports, one bent by the impact.
      {
        g: tube(
          [
            [-0.08, -0.36, 0],
            [-0.1, 0.05, 0],
            [-0.2, 0.45, 0],
          ],
          0.014,
        ),
        c: 0,
        w: 4,
      },
      {
        g: tube(
          [
            [0.08, -0.36, 0],
            [0.12, 0.0, 0.02],
            [0.24, 0.3, 0.05],
            [0.3, 0.42, 0.04],
          ],
          0.014,
        ),
        c: 0,
        w: 4,
      },
      // What's left of the filament: a stub still glowing, the rest drooping off the bent wire.
      {
        g: tube(
          [
            [-0.2, 0.45, 0],
            [-0.15, 0.58, 0.02],
            [-0.07, 0.6, 0.03],
            [-0.04, 0.52, 0.04],
          ],
          0.02,
        ),
        c: 2,
        w: 10,
      },
      {
        g: tube(
          [
            [0.3, 0.42, 0.04],
            [0.31, 0.26, 0.07],
            [0.25, 0.1, 0.1],
            [0.18, 0.02, 0.09],
          ],
          0.02,
        ),
        c: 1,
        w: 10,
      },
      // Threaded base and contact.
      ...Array.from({ length: 5 }, (_, i) => ({
        g: cyl(i % 2 ? 0.27 : 0.29, i % 2 ? 0.29 : 0.27, 0.1, 48),
        m: T(0, -0.48 - i * 0.1, 0),
        c: 0,
        w: 0.8,
      })),
      { g: cyl(0.2, 0.1, 0.1, 32), m: T(0, -1.01, 0), c: 0, w: 1.2 },
    ];
    // Shards: [x, y, z, spin, size]. Flying out of the hole, falling, and lying below.
    const shards: [number, number, number, number, number][] = [
      [0.86, 0.95, 0.15, 0.5, 0.16],
      [1.05, 1.18, 0.05, 1.9, 0.12],
      [1.2, 0.86, 0.1, 3.1, 0.1],
      [0.98, 0.58, 0.2, 4.2, 0.09],
      [1.32, 1.08, -0.05, 5.3, 0.07],
      [1.12, 1.38, 0.0, 2.4, 0.06],
      [1.05, 0.12, 0.12, 0.9, 0.08],
      [-0.85, 0.98, 0.1, 2.0, 0.07],
      [0.55, -1.08, 0.2, 0, 0.14],
      [0.85, -1.1, -0.1, 0, 0.1],
      [-0.5, -1.1, 0.25, 0, 0.11],
      [1.15, -1.09, 0.15, 0, 0.07],
    ];
    shards.forEach(([x, y, z, r, size]) => {
      const tri = poly([
        [0, 0],
        [size, size * 0.2],
        [size * 0.65, size * 0.55],
        [size * 0.25, size * 0.95],
      ]);
      // Shards on the floor lie flat; the rest tumble.
      const rot = r === 0 ? R(-Math.PI / 2 + 0.25, x * 2, 0) : R(r, r * 0.7, r * 1.3);
      parts.push({ g: ext(tri, 0.006, 0), m: C(T(x, y, z), rot), c: 0, w: 3, ds: true });
    });
    out.bulb = sample(parts, { view: R(0.1, -0.15, -0.14), w: 2.3, h: 2.05 });
  }
  return out;
}
