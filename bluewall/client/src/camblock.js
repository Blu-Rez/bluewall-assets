// Keeps the camera out of solid things.  Buildings come as oriented boxes {x, z, w, d, h, rot} (the same footprints the battle uses), creatures as spheres.
// When the camera is over (or close beside) one of them it is lifted above it: the lift grows smoothly with how deep the camera is in the margin and is eased
// in time, so the camera glides over a roof instead of popping.  Dead (collapsed) buildings do not count.
const CELL = 40;
const sstep = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

export function createCamBlock({ height = () => 0, margin = 7, clear = 3.5 } = {}) {
  const grid = new Map(); let list = [], spheresFn = null, off = 0;
  const key = (i, j) => i * 4096 + j;
  const api = {
    set(boxes) {
      grid.clear(); list = [];
      for (const b of boxes) {
        if (!(b.h > 2.5) || !(b.w > 0)) continue;
        const rot = b.rot || 0, e = { ref: b, x: b.x, z: b.z, cs: Math.cos(rot), sn: Math.sin(rot), hw: b.w / 2, hd: b.d / 2, top: height(b.x, b.z) + b.h };
        const R = Math.hypot(e.hw, e.hd) + margin; list.push(e);
        for (let i = Math.floor((b.x - R) / CELL); i <= Math.floor((b.x + R) / CELL); i++) for (let j = Math.floor((b.z - R) / CELL); j <= Math.floor((b.z + R) / CELL); j++) {
          const k = key(i, j); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(e);
        }
      }
      return api;
    },
    spheres(fn) { spheresFn = fn; return api; },                      // fn() -> [{ r, center: () => {x, y, z} }]
    // the lowest the camera may be at (x, z)
    need(x, z) {
      let req = 0;
      const a = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
      if (a) for (const e of a) {
        if (e.ref.dead) continue;
        const dx = x - e.x, dz = z - e.z, lx = dx * e.cs - dz * e.sn, lz = dx * e.sn + dz * e.cs;
        const qx = Math.max(0, Math.abs(lx) - e.hw), qz = Math.max(0, Math.abs(lz) - e.hd), q = Math.hypot(qx, qz);
        if (q >= margin) continue;
        const r = (e.top + clear) * sstep(1 - q / margin); if (r > req) req = r;
      }
      if (spheresFn) for (const c of spheresFn()) {
        if (c.vis && !c.vis()) continue;                                 // (a hidden creature — far away, not owned yet — is not in the way)
        const p = c.center(), d = Math.hypot(x - p.x, z - p.z), q = Math.max(0, d - c.r);
        if (q >= margin) continue;
        const r = (p.y + c.r + clear) * sstep(1 - q / margin); if (r > req) req = r;
      }
      return req;
    },
    // y -> y' (>= y); dt eases the lift in and out
    lift(x, y, z, dt = 0.016) {
      const want = Math.max(0, api.need(x, z) - y), k = want > off ? 1 - Math.exp(-dt / 0.1) : 1 - Math.exp(-dt / 0.35);
      off += (want - off) * k; if (off < 0.01) off = 0;
      return y + off;
    },
    reset() { off = 0; },
  };
  return api;
}
