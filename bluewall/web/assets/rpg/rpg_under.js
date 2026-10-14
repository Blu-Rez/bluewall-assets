// RP3 — the underworld hub «Heart of the Mountain» (دل کوه), Blue Wall · RPG phase 1.  (RP1's 200 m test area is replaced; the module contract with rpg.js is kept.)
// One walkable basin ≈ 210 m across (a shallow bowl: the camp lies at the bottom, the roads climb to the rim), a rock wall ~100 m high that disappears into the haze, cold turquoise light.
// Centre = the camp (fire, tents, vendor stall, quest board, crates, benches); eight roads leave it: seven sealed mouths in the rim (N, NE, E, SE, S, NW, W = the book's regions) and the stair up to the castle (SW).
// A plain ES module: it gets THREE from the host (rpg.js) and imports nothing.  opts = { parse(buf,path)->gltf, base, v }: the library pieces (web/assets/rpg/under/*.glb, 1.4 MB, only the picked nodes) are fetched
// through the game's own GLB parser; without `parse` (headless test) boxes of the same size stand in, so the layout / colliders / counters are identical.
// Budget: draw calls ≈ 45, ≈ 300 k triangles, 9 shader programs (all in this scene), 3 real lights (hemisphere, camp fire, the hero's lamp), no shadows, no post-processing.
export async function buildUnder(T, opts = {}) {
  const seed = (opts.seed == null ? 11 : opts.seed) >>> 0;
  const RAD = Math.PI / 180;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (t) => t * t * (3 - 2 * t);
  let rs = seed;
  const rnd = () => { rs = (rs + 0x6d2b79f5) >>> 0; let t = rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash = (i, j) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = sm(x - i), fz = sm(z - j), a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz; };
  const fbm = (x, z) => vn(x, z) * 0.55 + vn(x * 2.1 + 11, z * 2.1 + 5) * 0.28 + vn(x * 4.3 + 3, z * 4.3 + 9) * 0.17;

  // ------------------------------------------------------------------ the shape of the hub (N = +z, E = +x; a bearing is measured from N towards E)
  const R_BOWL = 100, BOWL_H = 10;   // the floor is a shallow bowl: 0 m at the camp, +10 m at the rim
  const R_WALL = 100;                // the rock wall starts to rise here
  const R_CLAMP = 101.6;             // the soft edge for the hero (a circle: she slides along it)
  const R_OUT = 176;                 // radius of the ground mesh (everything beyond is fog)
  const NOTCH_W = 6.8;               // half width of a road mouth cut into the wall
  const BOUND = R_CLAMP;
  const REGIONS = [
    { key: 'sepidsar', b: 0, accent: 0xcfefff, motif: 'ogive' },
    { key: 'black_mountain', b: 45, accent: 0x7a6cff, motif: 'megalith' },
    { key: 'black_citadel', b: 90, accent: 0xff5a3a, motif: 'crenel' },
    { key: 'salt_flats', b: 135, accent: 0xffd0e4, motif: 'teeth' },
    { key: 'white_fortress', b: 180, accent: 0xe6eef5, motif: 'towers' },
    { key: 'golden_city', b: 270, accent: 0xffc23a, motif: 'dome' },
    { key: 'simorgh', b: 315, accent: 0x6dff8a, motif: 'wings' },
  ];
  const PORTAL_B = 225;              // SW: the stair up to the castle
  const mkGate = (key, b, extra) => { const dx = Math.sin(b * RAD), dz = Math.cos(b * RAD); return { key, b, dx, dz, tx: dz, tz: -dx, ...extra }; };
  const GATES = REGIONS.map((r) => mkGate(r.key, r.b, r)).concat([mkGate('portal', PORTAL_B, { accent: 0x2fe8d8, motif: 'stair' })]);
  const PORTAL_G = GATES[GATES.length - 1];
  const RAMP0 = 82, RAMP1 = 97, RAMP_UP = 3.4;   // the stair: the floor climbs RAMP_UP m between these radii on the SW spoke
  const bowl = (r) => BOWL_H * (r / R_BOWL) * (r / R_BOWL);

  function hgt(x, z) {
    const r = Math.hypot(x, z);
    let h = bowl(r);
    // rolling ground, flat at the camp, calmer along the roads and in front of the mouths
    let k = sm(clamp((r - 16) / 26, 0, 1));
    for (let i = 0; i < GATES.length; i++) { const g = GATES[i], al = x * g.dx + z * g.dz; if (al > 14) { const lat = Math.abs(x * g.tx + z * g.tz); k *= 0.25 + 0.75 * sm(clamp((lat - 3) / 8, 0, 1)); } }
    h += ((fbm(x * 0.021 + 9, z * 0.021) - 0.5) * 9 + (fbm(x * 0.08 + 3, z * 0.08 + 5) - 0.5) * 1.8) * k;
    // the stair up (SW)
    { const g = PORTAL_G, al = x * g.dx + z * g.dz, lat = Math.abs(x * g.tx + z * g.tz); if (al > RAMP0 - 6 && lat < 14) { const tgt = bowl(RAMP0) + RAMP_UP * sm(clamp((al - RAMP0) / (RAMP1 - RAMP0), 0, 1)); const w = 1 - sm(clamp((lat - 7) / 6, 0, 1)); h += (tgt - h) * w * sm(clamp((al - (RAMP0 - 6)) / 6, 0, 1)); } }
    // the rock wall, with the mouths cut into it
    if (r > R_WALL) {
      let notch = 0;
      for (let i = 0; i < GATES.length; i++) { const g = GATES[i], al = x * g.dx + z * g.dz; if (al < R_WALL - 3) continue; const lat = Math.abs(x * g.tx + z * g.tz); const m = (1 - sm(clamp((lat - NOTCH_W) / 3, 0, 1))) * (1 - sm(clamp((al - 150) / 18, 0, 1))); if (m > notch) notch = m; }
      const u = (r - R_WALL) / 12, th = Math.atan2(x, z), rib = 0.82 + 0.3 * vn(th * 16 + 3, r * 0.09) + 0.1 * vn(th * 70, r * 0.4);
      h += (98 * Math.pow(sm(clamp(u, 0, 1)), 1.15) + Math.max(0, u - 1) * 14) * rib * (1 - notch);
    }
    return h;
  }

  // ------------------------------------------------------------------ materials, textures, bookkeeping
  const scene = new T.Scene();
  const FOG = 0x0a4352;
  scene.fog = new T.FogExp2(FOG, 0.0072);
  scene.background = new T.Color(FOG);
  const disposables = [];
  const mkTex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; } disposables.push(t); return t; };
  const glowTex = mkTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const flameTex = mkTex(64, 96, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h * 0.68, 0, w / 2, h * 0.68, h * 0.5); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.beginPath(); g.moveTo(w / 2, 2); g.bezierCurveTo(w * 0.95, h * 0.35, w * 0.98, h * 0.72, w / 2, h - 2); g.bezierCurveTo(w * 0.02, h * 0.72, w * 0.05, h * 0.35, w / 2, 2); g.fill();
  });
  const swirlTex = mkTex(256, 256, (g, w, h) => {
    g.translate(w / 2, h / 2);
    for (let k = 0; k < 7; k++) { g.save(); g.rotate((k / 7) * Math.PI * 2); const r = g.createLinearGradient(0, 0, w / 2, 0); r.addColorStop(0, 'rgba(180,255,245,.0)'); r.addColorStop(0.35, 'rgba(60,230,215,.55)'); r.addColorStop(1, 'rgba(20,120,170,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w * 0.22, -h * 0.16, w * 0.5, h * 0.02); g.quadraticCurveTo(w * 0.22, -h * 0.02, 0, 0); g.fill(); g.restore(); }
    const c = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); c.addColorStop(0, 'rgba(255,255,255,.95)'); c.addColorStop(0.3, 'rgba(120,255,240,.45)'); c.addColorStop(1, 'rgba(0,80,120,0)'); g.fillStyle = c; g.fillRect(-w / 2, -h / 2, w, h);
  });
  const stripTex = mkTex(64, 128, (g, w, h) => { const a = g.createLinearGradient(0, 0, w, 0); a.addColorStop(0, 'rgba(40,220,210,0)'); a.addColorStop(0.5, 'rgba(160,255,245,.95)'); a.addColorStop(1, 'rgba(40,220,210,0)'); g.fillStyle = a; g.fillRect(0, 0, w, h); const b = g.createLinearGradient(0, 0, 0, h); b.addColorStop(0, 'rgba(0,0,0,.0)'); b.addColorStop(0.5, 'rgba(0,0,0,.55)'); b.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = b; g.fillRect(0, 0, w, h); }, true);
  stripTex.repeat.set(1, 1);
  const veinTex = mkTex(64, 16, (g, w, h) => { const a = g.createLinearGradient(0, 0, w, 0); a.addColorStop(0, 'rgba(60,240,225,0)'); a.addColorStop(0.5, 'rgba(210,255,250,1)'); a.addColorStop(1, 'rgba(60,240,225,0)'); g.fillStyle = a; g.fillRect(0, 0, w, h); });
  const mistTex = mkTex(256, 256, (g, w, h) => {   // soft cloud blobs, wrapped so it tiles
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { const x = rnd() * w, y = rnd() * h, r = 22 + rnd() * 46; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, 'rgba(255,255,255,.34)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } }
  }, true);
  const curtainTex = mkTex(128, 256, (g, w, h) => {   // vertical streaks of slow mist
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 38; i++) { const x = rnd() * w, wd = 5 + rnd() * 18, a = 0.1 + rnd() * 0.3; for (const ox of [-w, 0, w]) { const gr = g.createLinearGradient(x + ox - wd, 0, x + ox + wd, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x + ox - wd, 0, wd * 2, h); } }
    const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  }, true);

  // one vertex-coloured standard material for all the dark rock / stone / wood (ground, arches, board, spires ...), one for crystals (same shader program, other emissive)
  const rockMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0.02, emissive: 0x08323c, emissiveIntensity: 0.5 });
  const stoneMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02, emissive: 0x0f4452, emissiveIntensity: 0.55 });   // built stone: a little more own light than the rock, so frames and the board read in the haze
  const crystalMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.15, emissive: 0x10b0a0, emissiveIntensity: 0.9 });
  const glowMat = (map, op) => new T.MeshBasicMaterial({ map, vertexColors: true, transparent: true, opacity: op == null ? 1 : op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });

  // ------------------------------------------------------------------ small geometry helpers
  const tmpM = new T.Matrix4(), tmpQ = new T.Quaternion(), tmpE = new T.Euler(), tmpV = new T.Vector3(), tmpS = new T.Vector3(), tmpC = new T.Color();
  const xf = (x, y, z, yaw, sx, sy, sz, rx, rz) => { tmpE.set(rx || 0, yaw || 0, rz || 0, 'YXZ'); tmpQ.setFromEuler(tmpE); return new T.Matrix4().compose(new T.Vector3(x, y, z), tmpQ.clone(), new T.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz)); };
  const newAcc = () => ({ pos: [], nrm: [], col: [] });
  const addTo = (acc, geo, M, colFn) => {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); if (M) g.applyMatrix4(M); g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); acc.pos.push(x, y, z); acc.nrm.push(n.getX(i), n.getY(i), n.getZ(i)); const c = colFn(x, y, z, n.getX(i), n.getY(i), n.getZ(i)); acc.col.push(c.r, c.g, c.b); }
    g.dispose(); geo.dispose();
  };
  const accGeo = (acc) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(acc.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(acc.nrm, 3)); g.setAttribute('color', new T.Float32BufferAttribute(acc.col, 3)); return g; };
  const flat = (hex, jit) => { const base = new T.Color(hex); return (x, y, z) => { const j = 1 + (jit == null ? 0.16 : jit) * (vn(x * 1.3 + 7, z * 1.3 + y * 0.8) - 0.5) * 2; tmpC.copy(base).multiplyScalar(j); return tmpC; }; };
  const stoneCol = (hex, gain) => { const base = new T.Color(hex); return (x, y, z, nx, ny) => { const j = (gain || 1) * (0.78 + 0.5 * vn(x * 0.6 + 3, z * 0.6 + y * 0.5) * (0.6 + 0.4 * ny) + 0.1 * clamp(y / 14, 0, 1)); tmpC.copy(base).multiplyScalar(j); return tmpC; }; };
  const stone = newAcc();    // everything static and dark: arches, board, benches, fire ring, rim spires, stair treads  (ONE draw call, rockMat)
  const crystalAcc = newAcc();
  const glowAcc = { pos: [], uv: [], col: [], idx: [] };   // additive quads (pools of light, veins, road lamps) with glowTex / stripTex
  const colliders = [];
  const col1 = (x, z, r) => { colliders.push([x, z, r]); };

  // ------------------------------------------------------------------ the eight spokes (roads) from the camp: seven to the sealed mouths, one to the stair
  const SPOKES = GATES.map((g, gi) => {
    const rEnd = g.key === 'portal' ? RAMP1 - 2 : 99, pts = [];
    for (let r = 22; r <= rEnd + 0.01; r += 4) { const f = (r - 22) / (rEnd - 22), lat = 3.6 * Math.sin(r * 0.05 + gi * 1.7) * Math.sin(Math.PI * f); pts.push([g.dx * r + g.tx * lat, g.dz * r + g.tz * lat]); }
    return pts;
  });
  const roadD = (x, z) => { let m = 1e9; for (const P of SPOKES) for (let i = 0; i < P.length - 1; i++) { const ax = P[i][0], az = P[i][1], bx = P[i + 1][0] - ax, bz = P[i + 1][1] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz), 0, 1), dx = x - ax - bx * t, dz = z - az - bz * t, d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
  const freeSpot = (x, z, pad) => { if (Math.hypot(x, z) < 26 + pad) return false; if (roadD(x, z) < 5.5 + pad) return false; return true; };

  // ------------------------------------------------------------------ sky (the cavern roof is lost in the haze) and ground
  const sky = (() => {
    const g = new T.SphereGeometry(900, 24, 16), p = g.attributes.position, col = new Float32Array(p.count * 3), top = new T.Color(0x03101c), hor = new T.Color(0x0a4352), low = new T.Color(0x062c38), c = new T.Color();
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 900; if (y >= 0) c.copy(hor).lerp(top, Math.pow(y, 0.5)); else c.copy(hor).lerp(low, clamp(-y * 3, 0, 1)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; m.frustumCulled = false; return m;
  })();
  scene.add(sky);

  {   // the ground: a polar grid (fine where the wall rises), vertex colours, the roads a little brighter
    const rings = []; for (let r = 0; r < R_OUT; r += r < 20 ? 2.4 : r < 98 ? 2.1 : r < 134 ? 0.9 : 3.5) rings.push(r); rings.push(R_OUT);
    const SEG = 360, nR = rings.length, pos = new Float32Array(nR * SEG * 3), col = new Float32Array(nR * SEG * 3), idx = [];
    for (let i = 0; i < nR; i++) for (let j = 0; j < SEG; j++) { const r = rings[i], a = (j / SEG) * Math.PI * 2, x = Math.sin(a) * r, z = Math.cos(a) * r, o = (i * SEG + j) * 3; pos[o] = x; pos[o + 1] = hgt(x, z); pos[o + 2] = z; }
    for (let i = 0; i < nR - 1; i++) for (let j = 0; j < SEG; j++) { const a = i * SEG + j, b = i * SEG + ((j + 1) % SEG), c = (i + 1) * SEG + j, d = (i + 1) * SEG + ((j + 1) % SEG); idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const nr = g.attributes.normal, c0 = new T.Color(0x07161d), c1 = new T.Color(0x0d2d35), c2 = new T.Color(0x14505a), rk = new T.Color(0x1d4552), rk2 = new T.Color(0x2a6470), camp = new T.Color(0x2a3a3a), c = new T.Color();
    for (let i = 0; i < nR * SEG; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], r = Math.hypot(x, z), ny = nr.getY(i), slope = 1 - clamp(ny, 0, 1);
      const n = fbm(x * 0.06 + 40, z * 0.06), d = r < 132 ? roadD(x, z) : 99;
      c.copy(c0).lerp(c1, clamp(n * 1.5 - 0.3, 0, 1)).lerp(c2, clamp(1 - d / 5, 0, 1) * 0.3);
      c.lerp(rk, clamp(slope * 2.4, 0, 1)).lerp(rk2, clamp(slope * 2.0 - 0.7, 0, 1) * (0.3 + 0.7 * vn(x * 0.35, y * 0.55 + z * 0.2)));   // steep = bare rock with strata
      c.lerp(camp, (1 - sm(clamp((r - 12) / 8, 0, 1))) * 0.8);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.Mesh(g, rockMat); m.frustumCulled = false; scene.add(m);
  }

  // ------------------------------------------------------------------ the library pieces (instanced) — or boxes of the same size in the headless test
  const PC = {   // file = web/assets/rpg/under/<file>.glb, node = the library node, h = height in metres, fr = footprint radius (metres, for the collider and the stand-in box), ry = turn so the model's front looks along +z
    tent: { file: 'camp', node: 'tent', h: 2.9, fr: 2.3, ry: Math.PI / 2 },
    pot: { file: 'camp', node: 'cooking_pot', h: 1.9, fr: 0.9, ry: 0 },
    bowl: { file: 'fire', node: 'fire_bowl_stone', h: 1.2, fr: 0.6, ry: 0 },
    beacon: { file: 'beacon', node: 'beacon_cauldron', h: 2.3, fr: 0.9, ry: 0 },
    stall: { file: 'stall', node: 'stall_cloth', h: 3.2, fr: 2.2, ry: 0 },
    flag: { file: 'street', node: 'flag', h: 5.4, fr: 0.35, ry: 0 },
    crates: { file: 'town', node: 'crates', h: 1.5, fr: 1.0, ry: 0 },
    barrels: { file: 'town', node: 'barrels', h: 1.3, fr: 0.95, ry: 0 },
    granite: { file: 'boulder', node: 'granite', h: 2.2, fr: 1.2, ry: 0 },
    cliff: { file: 'cliffs', node: 'cliff', h: 8, fr: 3.6, ry: 0 },
    spire: { file: 'cliffs', node: 'spire', h: 12, fr: 2.4, ry: 0 },
    crystalB: { file: 'ore', node: 'crystal_blue', h: 3.6, fr: 1.5, ry: 0 },
  };
  const kit = {};   // key -> { geo, mat, fix (Matrix4: node scale + base to the origin) , hN (height after fix) }
  const dbg = { kit: 'none', fails: [] };
  if (opts.parse) {
    try {
      const base = opts.base || '', v = opts.v || '', files = [...new Set(Object.values(PC).map((p) => p.file))], gl = {};
      await Promise.all(files.map(async (f) => { const res = await fetch(base + f + '.glb' + v); if (!res.ok) throw new Error('under/' + f + '.glb ' + res.status); gl[f] = await opts.parse(await res.arrayBuffer(), base); }));
      for (const [k, p] of Object.entries(PC)) {
        const root = gl[p.file].scene; root.updateMatrixWorld(true); let mesh = null; const n = root.getObjectByName(p.node); if (n) n.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
        if (!mesh) { dbg.fails.push(k); continue; }
        const geo = mesh.geometry; geo.computeBoundingBox(); const bb = geo.boundingBox, M = mesh.matrixWorld.clone().setPosition(0, 0, 0), mn = new T.Vector3(1e9, 1e9, 1e9), mx = new T.Vector3(-1e9, -1e9, -1e9), q = new T.Vector3();
        for (let i = 0; i < 8; i++) { q.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(M); mn.min(q); mx.max(q); }
        const fix = new T.Matrix4().makeTranslation(-(mn.x + mx.x) / 2, -mn.y, -(mn.z + mx.z) / 2).multiply(M);
        if (mesh.material.emissive) { mesh.material.emissive.set(0x0b3039); mesh.material.emissiveIntensity = 0.5; } if (mesh.material.color) mesh.material.color.set(0x8fa4a8); kit[k] = { geo, mat: mesh.material, fix, hN: mx.y - mn.y };
      }
      dbg.kit = Object.keys(kit).length + '/' + Object.keys(PC).length;
    } catch (e) { console.warn('under kit', e); dbg.kit = 'ERR ' + (e && e.message); }
  }
  const placed = {}; for (const k in PC) placed[k] = [];
  const standIn = (p) => { const g = new T.BoxGeometry(p.fr * 1.6, p.h, p.fr * 1.6); g.translate(0, p.h / 2, 0); return g; };
  const put = (k, x, z, yaw, mul, yOff, noCol) => {
    const p = PC[k], m = mul == null ? 1 : mul; placed[k].push([x, z, yaw || 0, m, yOff || 0]);
    if (!noCol) col1(x, z, p.fr * m);
  };

  // ------------------------------------------------------------------ crystals (static, merged) — clusters in the basin, veins and clusters at the foot of the wall
  const clusterParts = [[0, 0, 0, 0, 3.4, 0.6], [0.55, 0.2, 0.35, -0.2, 2.2, 0.36], [-0.5, 0.3, -0.3, -0.35, 2.0, 0.34], [0.2, -0.55, 0.05, 0.45, 1.7, 0.3], [-0.25, -0.5, -0.1, 0.5, 2.5, 0.32], [0.7, -0.3, 0.5, 0.3, 1.2, 0.26], [-0.7, -0.05, -0.55, 0.0, 1.35, 0.27]];
  const clusterGeos = clusterParts.map(([dx, dz, tx, tz, h, r]) => { const g = new T.CylinderGeometry(0, r, h, 6, 1); g.translate(0, h / 2, 0); g.applyMatrix4(xf(dx, 0, dz, 0, 1, 1, 1, tz, -tx)); return g; });
  const crystalPal = [0x1fc9b8, 0x3a9ee6, 0x6fe8dc, 0x1fc9b8, 0x3366e6, 0x5fd2e8].map((h) => new T.Color(h));
  const halo = { pos: [], col: [] };
  const addCluster = (x, y, z, s, sy, yaw, c) => {
    const M = xf(x, y, z, yaw, s, s * sy, s, (rnd() - 0.5) * 0.18, (rnd() - 0.5) * 0.18);
    for (const g of clusterGeos) addTo(crystalAcc, g.clone(), M, (px, py) => { tmpC.copy(c).multiplyScalar(0.55 + 0.45 * clamp((py - y) / (3.4 * s * sy), 0, 1)); return tmpC; });
    halo.pos.push(x, y + 1.6 * s * sy, z); halo.col.push(c.r * 0.9, c.g * 0.9, c.b * 0.9);
  };
  {
    let k = 0, guard = 0;
    while (k < 130 && guard++ < 6000) {
      const a = rnd() * 6.283, r = 30 + rnd() * 70, x = Math.sin(a) * r, z = Math.cos(a) * r;
      const big = k < 12, s = big ? 2.4 + rnd() * 1.6 : 0.7 + rnd() * 1.4;
      if (!freeSpot(x, z, 0.9 * s + 1)) continue;
      addCluster(x, hgt(x, z) - 0.15, z, s, 0.8 + rnd() * 0.7, rnd() * 6.283, crystalPal[(rnd() * crystalPal.length) | 0]); col1(x, z, 0.95 * s); k++;
    }
  }

  // ------------------------------------------------------------------ glowing veins in the wall (additive ribbons that follow the rock)
  const wallPoint = (th, H) => {   // the point on the wall at bearing th and height H (binary search along the radius)
    const dx = Math.sin(th), dz = Math.cos(th); let lo = R_WALL - 2, hi = R_WALL + 40;
    for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (hgt(dx * mid, dz * mid) < H) lo = mid; else hi = mid; }
    return [dx * lo, dz * lo];
  };
  const quad = (a, b, c, d, col, uv) => {   // a,b = start edge, c,d = end edge; uv = [v0,v1]
    const i0 = glowAcc.pos.length / 3; for (const p of [a, b, c, d]) glowAcc.pos.push(p[0], p[1], p[2]);
    glowAcc.uv.push(0, uv[0], 1, uv[0], 0, uv[1], 1, uv[1]); for (let i = 0; i < 4; i++) glowAcc.col.push(col[0], col[1], col[2]);
    glowAcc.idx.push(i0, i0 + 1, i0 + 2, i0 + 2, i0 + 1, i0 + 3);
  };
  {
    const veinAcc = { pos: [], uv: [], col: [], idx: [] };
    for (let n = 0; n < 46; n++) {
      let th = rnd() * 6.283, H = 4 + rnd() * 30, pts = []; const segs = 6 + ((rnd() * 6) | 0), w = 0.35 + rnd() * 0.5, pw = [];
      for (let s = 0; s <= segs; s++) {
        const [x, z] = wallPoint(th, H); let ok = true; for (const g of GATES) { const al = x * g.dx + z * g.dz, lat = Math.abs(x * g.tx + z * g.tz); if (al > R_WALL - 4 && lat < NOTCH_W + 6) ok = false; }
        if (!ok) { pts = []; break; }
        const rr = Math.hypot(x, z), ox = (x / rr) * -0.25, oz = (z / rr) * -0.25; pts.push([x + ox, H, z + oz]); pw.push(w * Math.sin(Math.PI * (s / segs)) + 0.08);
        th += (rnd() - 0.5) * 0.045; H += 2.5 + rnd() * 4.5;
      }
      if (pts.length < 3) continue;
      const tc = [0.1, 0.95, 0.85], k = 0.55 + rnd() * 0.5;
      for (let s = 0; s < pts.length - 1; s++) {
        const p = pts[s], q = pts[s + 1], rr = Math.hypot(p[0], p[2]) || 1, tx = p[2] / rr, tz = -p[0] / rr, w0 = pw[s], w1 = pw[s + 1];   // tangent (horizontal) = the width direction
        const i0 = veinAcc.pos.length / 3; veinAcc.pos.push(p[0] + tx * w0, p[1], p[2] + tz * w0, p[0] - tx * w0, p[1], p[2] - tz * w0, q[0] + tx * w1, q[1], q[2] + tz * w1, q[0] - tx * w1, q[1], q[2] - tz * w1);
        veinAcc.uv.push(0, 0, 1, 0, 0, 1, 1, 1); for (let i = 0; i < 4; i++) veinAcc.col.push(tc[0] * k, tc[1] * k, tc[2] * k); veinAcc.idx.push(i0, i0 + 1, i0 + 2, i0 + 2, i0 + 1, i0 + 3);
      }
      // a crystal bloom at the vein's foot
      const [bx, bz] = wallPoint(th - 0.0, 1.2 + rnd() * 3), bh = hgt(bx, bz); let okb = true; for (const g of GATES) { const al = bx * g.dx + bz * g.dz, lat = Math.abs(bx * g.tx + bz * g.tz); if (al > R_WALL - 8 && lat < NOTCH_W + 9) okb = false; }
      if (okb && rnd() < 0.7) addCluster(bx * 0.985, bh - 0.2, bz * 0.985, 1.4 + rnd() * 2.2, 1 + rnd(), rnd() * 6.283, crystalPal[(rnd() * crystalPal.length) | 0]);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(veinAcc.pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(veinAcc.uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(veinAcc.col, 3)); g.setIndex(veinAcc.idx);
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: veinTex, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, opacity: 1 })); m.frustumCulled = false; scene.add(m);
  }

  // ------------------------------------------------------------------ rim spires (silhouettes in the haze), merged
  {
    const spireCol = stoneCol(0x0c1c25); let k = 0, guard = 0;
    while (k < 34 && guard++ < 5000) {
      const a = rnd() * 6.283, r = 48 + rnd() * 52, x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (!freeSpot(x, z, 3)) continue;
      const s = 0.55 + rnd() * 0.8, hs = 0.55 + rnd() * 0.8;
      addTo(stone, new T.ConeGeometry(2.1, 16, 5), xf(x, hgt(x, z) - 0.5 + 8 * hs, z, rnd() * 6.283, s, hs, s, (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12), spireCol);
      col1(x, z, 1.5 * s); k++;
    }
  }

  // ------------------------------------------------------------------ the camp (centre): fire, tents, vendor stall, quest board, crates, benches
  const faceC = (x, z) => Math.atan2(-x, -z);   // the yaw that makes local +z look at the centre
  const polar = (b, r) => [Math.sin(b * RAD) * r, Math.cos(b * RAD) * r];
  const wood = stoneCol(0x4a3320), darkw = stoneCol(0x2c2118), paper = flat(0x7a6f55, 0.14), iron = stoneCol(0x1b2226);
  const POI = [], flames = [];   // flames: {x,y,z,kind,n}
  const pools = [];              // {x,z,r,c:[r,g,b],a}
  const camp = { x: 0, z: 0 };
  {
    // the fire: a ring of stones, a pile of logs (the library's cooking pot stands beside it), the flames are sprites, ONE real light
    const ringC = stoneCol(0x2d3b40);
    for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283 + rnd() * 0.2, r = 1.55 + rnd() * 0.15; addTo(stone, new T.DodecahedronGeometry(0.42 + rnd() * 0.14, 0), xf(Math.sin(a) * r, hgt(0, 0) + 0.2, Math.cos(a) * r, rnd() * 6, 1, 0.7, 1), ringC); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + 0.3; const g = new T.CylinderGeometry(0.13, 0.15, 1.7, 7); addTo(stone, g, xf(Math.sin(a) * 0.35, 0.34, Math.cos(a) * 0.35, a, 1, 1, 1, 0, 0).multiply(new T.Matrix4().makeRotationZ(1.12)), darkw); }
    col1(0, 0, 1.9);
    flames.push({ x: 0, y: 0.4, z: 0, kind: 'camp' });
    pools.push({ x: 0, z: 0, r: 13, c: [1.0, 0.5, 0.18], a: 0.11 }, { x: 0, z: 0, r: 30, c: [0.3, 0.5, 0.45], a: 0.1 });
    POI.push({ id: 'camp', x: 0, z: 0, r: 16 });
    // a cooking pot beside the fire
    { const [x, z] = polar(250, 3.9); put('pot', x, z, 1.2, 1, 0, false); }
    // log benches around the fire
    for (const b of [30, 120, 300]) {
      const [x, z] = polar(b, 4.6), yaw = b * RAD;
      addTo(stone, new T.CylinderGeometry(0.3, 0.3, 3.0, 8), xf(x, hgt(x, z) + 0.5, z, yaw, 1, 1, 1, 0, 0).multiply(new T.Matrix4().makeRotationZ(Math.PI / 2)), wood);
      for (const o of [-1.1, 1.1]) addTo(stone, new T.BoxGeometry(0.4, 0.4, 0.5), xf(x + Math.cos(yaw) * o, hgt(x, z) + 0.2, z - Math.sin(yaw) * o, yaw), darkw);
      col1(x, z, 1.5);
    }
    // four tents, the entrance towards the fire
    for (const b of [22.5, 67.5, 292.5, 337.5]) { const [x, z] = polar(b, 13.5); put('tent', x, z, faceC(x, z), 1 + rnd() * 0.12, -0.02); }
    // the vendor stall (SE of the fire, in the camp) — the stall's front looks at the fire
    { const [x, z] = polar(112.5, 14.5); put('stall', x, z, faceC(x, z), 1, 0); POI.push({ id: 'vendor', x: x * 0.8, z: z * 0.8, r: 4.5 }); pools.push({ x: x * 0.85, z: z * 0.85, r: 6, c: [1.0, 0.6, 0.3], a: 0.25 }); }
    // crates and barrels by the stall and the tents
    { const [x, z] = polar(125, 17.2); put('crates', x, z, 0.4, 1, 0); put('barrels', x + 2.0, z + 1.6, 1.9, 1, 0); const [x2, z2] = polar(52, 16.2); put('crates', x2, z2, 2.4, 0.9, 0); put('barrels', x2 - 2.2, z2 + 1.0, 0.7, 1, 0); const [x3, z3] = polar(305, 17); put('barrels', x3, z3, 0.3, 1, 0); put('crates', x3 + 1.9, z3 + 1.4, 1.2, 0.85, 0); }
    // the quest board (S of the fire): two posts, a slanted board with pinned notes, a small roof, a lantern — an object only, no text
    {
      const [x, z] = polar(157.5, 12.6), yaw = faceC(x, z), gy = hgt(x, z), R = (lx, ly, lz) => { const c = Math.cos(yaw), s = Math.sin(yaw); return [x + lx * c + lz * s, gy + ly, z - lx * s + lz * c]; };
      for (const sx of [-1.7, 1.7]) { const p = R(sx, 1.7, 0); addTo(stone, new T.BoxGeometry(0.38, 3.4, 0.38), xf(p[0], p[1], p[2], yaw), wood); }
      { const p = R(0, 1.75, 0.12); addTo(stone, new T.BoxGeometry(3.4, 2.1, 0.16), xf(p[0], p[1], p[2], yaw, 1, 1, 1, -0.08, 0), darkw); }
      { const p = R(0, 3.55, 0.1); addTo(stone, new T.BoxGeometry(4.3, 0.2, 1.5), xf(p[0], p[1], p[2], yaw, 1, 1, 1, -0.22, 0), wood); }
      for (let i = 0; i < 9; i++) { const lx = -1.25 + (i % 3) * 1.2 + (rnd() - 0.5) * 0.25, ly = 1.15 + Math.floor(i / 3) * 0.62 + (rnd() - 0.5) * 0.12, p = R(lx, ly, 0.24); addTo(stone, new T.BoxGeometry(0.62 + rnd() * 0.2, 0.46 + rnd() * 0.12, 0.03), xf(p[0], p[1], p[2], yaw + (rnd() - 0.5) * 0.12, 1, 1, 1, -0.08, 0), paper); }
      col1(x, z, 2.4); POI.push({ id: 'board', x: x * 0.82, z: z * 0.82, r: 3.5 });
    }
    // flags at the camp's edge
    for (const b of [0, 90, 180, 270]) { const [x, z] = polar(b + 22.5, 25.5); put('flag', x, z, faceC(x, z) + 0.6, 1, 0); }
    // beacon cauldrons where the roads leave the camp, bowls along the roads
    for (const g of GATES) { const lx = 3.4, [x, z] = [g.dx * 20.5 + g.tx * lx, g.dz * 20.5 + g.tz * lx]; put('beacon', x, z, faceC(x, z), 1, 0); flames.push({ x, y: hgt(x, z) + 2.5, z, kind: 'lamp' }); pools.push({ x, z, r: 7.5, c: [0.15, 0.9, 0.85], a: 0.3 }); }
    for (const g of GATES) { const rr = g.key === 'portal' ? 60 : 62; const [x, z] = [g.dx * rr - g.tx * 3.6, g.dz * rr - g.tz * 3.6]; put('bowl', x, z, faceC(x, z), 1, 0); flames.push({ x, y: hgt(x, z) + 1.25, z, kind: 'lamp' }); pools.push({ x, z, r: 6, c: [0.15, 0.9, 0.85], a: 0.25 }); }
  }

  // ------------------------------------------------------------------ rocks and big crystals in the basin (library pieces), off the roads
  {
    let k = 0, guard = 0; while (k < 12 && guard++ < 3000) { const a = rnd() * 6.283, r = 34 + rnd() * 62, x = Math.sin(a) * r, z = Math.cos(a) * r; if (!freeSpot(x, z, 2.4)) continue; put('granite', x, z, rnd() * 6.283, 0.8 + rnd() * 1.1, -0.15); k++; }
    k = 0; guard = 0; while (k < 8 && guard++ < 3000) { const a = rnd() * 6.283, r = 42 + rnd() * 54, x = Math.sin(a) * r, z = Math.cos(a) * r; if (!freeSpot(x, z, 3)) continue; put('crystalB', x, z, rnd() * 6.283, 0.8 + rnd() * 1.4, -0.2); k++; }
    k = 0; guard = 0; while (k < 12 && guard++ < 3000) { const a = rnd() * 6.283, r = 88 + rnd() * 12, x = Math.sin(a) * r, z = Math.cos(a) * r; if (!freeSpot(x, z, 4)) continue; if (rnd() < 0.5) put('cliff', x, z, rnd() * 6.283, 0.9 + rnd() * 1.0, -0.6); else put('spire', x, z, rnd() * 6.283, 0.8 + rnd() * 0.9, -0.6); k++; }
  }

  // ------------------------------------------------------------------ the seven sealed mouths and the stair up
  // frame outline for the extruded arch: outer leg -> apex -> outer leg, then the inner edge back (the opening reaches the ground); 'arch' is pointed (ogive), 'flat' a lintel
  const archPath = (sh, a, hs, apex, kind, up) => {   // adds the arch curve between the two springing points (-a,hs) .. (a,hs) over the apex; up = true goes left->right
    const dy = apex - hs;
    if (kind === 'flat') return;
    if (up) { sh.bezierCurveTo(-a, hs + dy * 0.5, -a * 0.3, apex - 0.42 * a, 0, apex); sh.bezierCurveTo(a * 0.3, apex - 0.42 * a, a, hs + dy * 0.5, a, hs); }
    else { sh.bezierCurveTo(a, hs + dy * 0.5, a * 0.3, apex - 0.42 * a, 0, apex); sh.bezierCurveTo(-a * 0.3, apex - 0.42 * a, -a, hs + dy * 0.5, -a, hs); }
  };
  const frameShape = (s) => {
    const A = s.a + s.t, top = s.apex + s.t * 1.2, sh = new T.Shape();
    sh.moveTo(-A, 0); sh.lineTo(-A, s.hs);
    if (s.kind === 'flat') { sh.lineTo(-A, s.hs + s.t * 0.9); sh.lineTo(A, s.hs + s.t * 0.9); } else archPath(sh, A, s.hs, top, 'arch', true);
    sh.lineTo(A, 0); sh.lineTo(s.a, 0); sh.lineTo(s.a, s.hs);
    if (s.kind === 'flat') sh.lineTo(-s.a, s.hs); else archPath(sh, s.a, s.hs, s.apex, 'arch', false);
    sh.lineTo(-s.a, 0); sh.lineTo(-A, 0); return sh;
  };
  const openShape = (s) => { const sh = new T.Shape(); sh.moveTo(-s.a, 0); sh.lineTo(-s.a, s.hs); if (s.kind === 'flat') sh.lineTo(s.a, s.hs); else archPath(sh, s.a, s.hs, s.apex, 'arch', true); sh.lineTo(s.a, 0); sh.lineTo(-s.a, 0); return sh; };
  const extr = (shape, d) => new T.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 10 });
  const SH = {   // the frame of each mouth: opening half width a, springing height hs, apex height, frame thickness t
    ogive: { a: 6.4, hs: 9, apex: 17, t: 3.0, kind: 'arch', col: 0x1d3f4b },
    megalith: { a: 6.2, hs: 9.5, apex: 9.5, t: 3.2, kind: 'flat', col: 0x141c2a },
    crenel: { a: 6.4, hs: 9, apex: 15, t: 3.0, kind: 'arch', col: 0x2a1d22 },
    teeth: { a: 7.2, hs: 7.5, apex: 12.5, t: 2.8, kind: 'arch', col: 0x5d636d },
    towers: { a: 6.2, hs: 8.5, apex: 12, t: 2.9, kind: 'arch', col: 0x7d8791 },
    dome: { a: 6.4, hs: 8.5, apex: 14, t: 3.0, kind: 'arch', col: 0x4a3a22 },
    wings: { a: 6.4, hs: 9, apex: 15.5, t: 3.0, kind: 'arch', col: 0x1d3a2c },
    stair: { a: 6.6, hs: 9.5, apex: 15.5, t: 3.4, kind: 'arch', col: 0x24424a },
  };
  const curtainAcc = { pos: [], uv: [], col: [], idx: [] };
  const GY = (g, al, lat) => [g.dx * al + g.tx * lat, g.dz * al + g.tz * lat];
  const AL = 103.4;   // the centre of a mouth frame (its depth is 4.2: 101.3 .. 105.5)
  for (const g of GATES) {
    const s = SH[g.motif], yaw = Math.atan2(-g.dx, -g.dz), gy = hgt(g.dx * (R_WALL - 2), g.dz * (R_WALL - 2));
    // local frame of the mouth: x = across (to the left when facing the centre), y up, z = towards the centre
    const M = (lx, ly, lz, ryaw, sx, sy, sz, rx, rz) => { const p = GY(g, AL - lz, -lx); return xf(p[0], gy + ly, p[1], yaw + (ryaw || 0), sx, sy, sz, rx, rz); };
    const box = (lx, ly, lz, w, h, d, col, ryaw, rx, rz) => addTo(stone, new T.BoxGeometry(w, h, d), M(lx, ly + h / 2, lz, ryaw, 1, 1, 1, rx, rz), col);
    const gm = extr(frameShape(s), 4.2); gm.translate(0, 0, -2.1); addTo(stone, gm, M(0, 0, 0), stoneCol(s.col, 1.7));
    switch (g.motif) {
      case 'ogive': for (let i = -2; i <= 2; i++) addTo(stone, new T.ConeGeometry(0.9, 4 + (2 - Math.abs(i)) * 1.8, 5), M(i * 1.7, 20.2 + (2 - Math.abs(i)) * 0.9, 0.3), stoneCol(0xdde9ef, 1.3)); break;
      case 'megalith': box(0, 12.6, 0, 22, 2.4, 4.8, stoneCol(0x0f1622, 1.6)); box(-9.6, 0, 0, 3.4, 14, 4.6, stoneCol(0x101826, 1.6)); box(9.6, 0, 0, 3.4, 14, 4.6, stoneCol(0x101826, 1.6)); box(0, 15, 0, 8, 2.6, 4.4, stoneCol(0x182234, 1.6)); break;
      case 'crenel': for (let i = -3; i <= 3; i++) box(i * 2.4, 17.6 - Math.abs(i) * 1.5, 0, 1.5, 2.2, 3.6, stoneCol(0x332329, 1.6)); for (const sd of [-1, 1]) addTo(stone, new T.ConeGeometry(1.5, 8, 6), M(sd * 10.8, 17, 0), stoneCol(0x201418, 1.6)); break;
      case 'teeth': for (let i = -5; i <= 5; i++) addTo(stone, new T.ConeGeometry(0.8 + (i % 2 ? 0.2 : 0.5), 3.2 + ((i * 7) % 4) * 0.8, 4), M(i * 1.55, 14.2 - Math.abs(i) * 0.55 + 1.9 + (i % 2) * 0.6, 0.5), stoneCol(0xe9ccd8, 1.6)); break;
      case 'towers': for (const sd of [-1, 1]) { box(sd * 11.4, 0, 0, 4.2, 17, 4.2, stoneCol(0x8e98a2, 1.6)); for (let m = -1; m <= 1; m++) box(sd * 11.4 + m * 1.35, 17, 0, 0.95, 1.4, 4.2, stoneCol(0x8e98a2, 1.6)); } break;
      case 'dome': addTo(stone, new T.SphereGeometry(2.6, 14, 9, 0, 6.283, 0, 1.5), M(0, 17.6, 0, 0, 1, 1.3, 1), stoneCol(0xb4862a, 1.6)); addTo(stone, new T.ConeGeometry(0.35, 3.6, 6), M(0, 22.0, 0), stoneCol(0xe0b447, 1.6)); break;
      case 'wings': for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const hh = 5.6 - i * 0.6; addTo(stone, new T.BoxGeometry(0.5, hh, 1.3), M(sd * (10.0 + i * 1.5), 8 + i * 1.6 + hh / 2, 0, 0, 1, 1, 1, 0, sd * (0.52 + i * 0.1)), stoneCol(0x2b5a40, 1.6)); } break;
      case 'stair': for (let i = 0; i < 3; i++) addTo(stone, new T.BoxGeometry(15 - i * 1.2, 0.35, 3.6 - i * 0.6), M(0, 0.17 + i * 0.35, -1.2 + i * 0.55), stoneCol(0x356a72, 1.6)); break;
    }
    // the accent plate (a glowing band in the mouth's own colour) on the face of the frame, so the mouths can be told apart
    { const a = new T.Color(g.accent), y0 = (s.kind === 'flat' ? s.hs + 0.4 : s.apex + 0.5), p0 = GY(g, AL - 2.25, 1.6), p1 = GY(g, AL - 2.25, -1.6);
      quad([p0[0], gy + y0, p0[1]], [p1[0], gy + y0, p1[1]], [p0[0], gy + y0 + 1.5, p0[1]], [p1[0], gy + y0 + 1.5, p1[1]], [a.r * 0.85, a.g * 0.85, a.b * 0.85], [0.25, 0.75]); }
    // the mist curtain (solid for the collider, soft for the eye): the shape of the opening, in the middle of the frame's depth
    if (g.key !== 'portal') {
      const cg = new T.ShapeGeometry(openShape(s), 10), cp = cg.attributes.position, a = new T.Color(g.accent).lerp(new T.Color(0x35e8d8), 0.72), i0 = curtainAcc.pos.length / 3;
      for (let i = 0; i < cp.count; i++) { const p = GY(g, AL - 0.2, -cp.getX(i)); curtainAcc.pos.push(p[0], gy + cp.getY(i), p[1]); curtainAcc.uv.push(cp.getX(i) * 0.09 + 0.5, cp.getY(i) * 0.06); curtainAcc.col.push(a.r * 0.3, a.g * 0.3, a.b * 0.3); }
      for (let i = 0; i < cg.index.count; i++) curtainAcc.idx.push(i0 + cg.index.getX(i)); cg.dispose();
      for (let i = -3; i <= 3; i++) { const p = GY(g, AL - 2.9, i * 2.3); col1(p[0], p[1], 1.45); }   // collision chain across the opening
    }
    for (const sd of [-1, 1]) { const p = GY(g, AL, sd * (s.a + s.t * 0.5 + 1.2)); col1(p[0], p[1], 2.4); }   // the legs
    // a marker beside the pad: a stone stele with a glowing orb in the mouth's colour (no icon, no text) + a pool of light on the ground
    { const p = GY(g, 92.5, 11.4), py = hgt(p[0], p[1]), a = new T.Color(g.accent);
      addTo(stone, new T.CylinderGeometry(0.7, 0.95, 1.4, 6), xf(p[0], py + 0.7, p[1], 0), stoneCol(0x2c4651)); addTo(stone, new T.BoxGeometry(0.9, 2.6, 0.9), xf(p[0], py + 2.7, p[1], yaw), stoneCol(0x1c2f38));
      addTo(stone, new T.OctahedronGeometry(0.55, 0), xf(p[0], py + 4.4, p[1], 0, 1, 1.4, 1), () => tmpC.copy(a).multiplyScalar(1.6)); col1(p[0], p[1], 0.9);
      flames.push({ x: p[0], y: py + 4.4, z: p[1], kind: 'orb', c: [a.r, a.g, a.b] });
      pools.push({ x: p[0], z: p[1], r: 5, c: [a.r * 0.8, a.g * 0.8, a.b * 0.8], a: 0.5 }); }
    const front = GY(g, 97.6, 0);
    if (g.key === 'portal') pools.push({ x: front[0], z: front[1], r: 11, c: [0.15, 0.9, 0.9], a: 0.5 });
    else { POI.push({ id: 'region:' + g.key, x: front[0], z: front[1], r: 6 }); pools.push({ x: front[0], z: front[1], r: 9, c: [0.2, 0.85, 0.85], a: 0.28 }); }
  }

  // ------------------------------------------------------------------ the way home: the swirl in the SW mouth, a ring of light on the ground at the foot of the stair
  const gp = PORTAL_G, pPos = GY(gp, AL - 0.4, 0), pGy = hgt(pPos[0], pPos[1]);
  const portal = (() => {
    const grp = new T.Group(); grp.position.set(pPos[0], pGy, pPos[1]); grp.rotation.y = Math.atan2(-gp.dx, -gp.dz);
    const disc = new T.Mesh(new T.CircleGeometry(5.3, 40), new T.MeshBasicMaterial({ map: swirlTex, vertexColors: false, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); disc.position.set(0, 7.1, 0); grp.add(disc);
    scene.add(grp);
    const ax = GY(gp, RAMP1 - 3, 0);
    return { grp, disc, x: ax[0], z: ax[1], y: hgt(ax[0], ax[1]) + 1.2, r: 3.2 };
  })();
  POI.push({ id: 'portal', x: portal.x, z: portal.z, r: portal.r + 1 });
  const spawnP = GY(gp, RAMP0 - 3, 0), spawn = { x: spawnP[0], z: spawnP[1], yaw: Math.atan2(-gp.dx, -gp.dz) };
  // treads on the stair (flat strips, a hair above the ramp so it reads as steps)
  for (let i = 0; i < 10; i++) { const al = RAMP0 + 0.6 + i * 1.5, c = GY(gp, al, 0), h = hgt(c[0], c[1]); addTo(stone, new T.BoxGeometry(11.5, 0.05, 0.22), xf(c[0], h + 0.03, c[1], Math.atan2(-gp.dx, -gp.dz)), stoneCol(0x2c5a60)); }

  // ------------------------------------------------------------------ meshes from the accumulators
  const stoneMesh = new T.Mesh(accGeo(stone), stoneMat); stoneMesh.frustumCulled = false; scene.add(stoneMesh);
  const crystalMesh = new T.Mesh(accGeo(crystalAcc), crystalMat); crystalMesh.frustumCulled = false; scene.add(crystalMesh);
  {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(halo.pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(halo.col, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ size: 9, map: glowTex, vertexColors: true, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); pts.frustumCulled = false; scene.add(pts);
  }
  // library pieces
  for (const k in PC) {
    const list = placed[k]; if (!list.length) continue; const p = PC[k], kk = kit[k];
    const geo = kk ? kk.geo : standIn(p), mat = kk ? kk.mat : new T.MeshStandardMaterial({ color: 0x405058, roughness: 0.9 });
    const im = new T.InstancedMesh(geo, mat, list.length); im.frustumCulled = false; im.name = 'piece:' + k;
    const mm = new T.Matrix4(), sc = new T.Vector3();
    list.forEach(([x, z, yaw, mul, yOff], i) => {
      const gy = hgt(x, z) + yOff, k2 = kk ? (p.h * mul) / kk.hN : mul;
      mm.compose(tmpV.set(x, gy, z), tmpQ.setFromEuler(tmpE.set(0, yaw + p.ry * RAD, 0)), sc.set(k2, k2, k2)); if (kk) mm.multiply(kk.fix);
      im.setMatrixAt(i, mm);
    });
    im.instanceMatrix.needsUpdate = true; scene.add(im);
  }
  // glow quads: veins are separate; pools of light on the ground follow the terrain
  for (const P of pools) {
    const N = 6, n0 = glowAcc.pos.length / 3;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const x = P.x + ((i / N) * 2 - 1) * P.r, z = P.z + ((j / N) * 2 - 1) * P.r; glowAcc.pos.push(x, hgt(x, z) + 0.14, z); glowAcc.uv.push(i / N, j / N); glowAcc.col.push(P.c[0] * P.a * 0.55, P.c[1] * P.a * 0.55, P.c[2] * P.a * 0.55); }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const a = n0 + i * (N + 1) + j, b = a + 1, c = a + N + 1, d = c + 1; glowAcc.idx.push(a, b, c, c, b, d); }
  }
  {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(glowAcc.pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(glowAcc.uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(glowAcc.col, 3)); g.setIndex(glowAcc.idx);
    const m = new T.Mesh(g, glowMat(glowTex)); m.frustumCulled = false; scene.add(m);
  }
  // the roads: a faint luminous ribbon along each spoke, a light pulse runs along it
  {
    const pos = [], uv = [], col = [], idx = [], W = 1.15;
    for (const P of SPOKES) {
      const n0 = pos.length / 3;
      for (let i = 0; i < P.length; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl, p = P[i], f = 0.75 * sm(clamp(i / 2, 0, 1)) * sm(clamp((P.length - 1 - i) / 2, 0, 1)) + 0.25;
        for (const s of [-1, 1]) { const x = p[0] + nx * W * s, z = p[1] + nz * W * s; pos.push(x, hgt(x, z) + 0.1, z); uv.push(s < 0 ? 0 : 1, i * 0.35); col.push(0.1 * f, 0.21 * f, 0.2 * f); }
        if (i > 0) { const j = n0 + i * 2; idx.push(j - 2, j - 1, j, j, j - 1, j + 1); }
      }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    const m = new T.Mesh(g, glowMat(stripTex)); m.frustumCulled = false; scene.add(m);
  }
  // the curtains of the seven sealed mouths
  const curtainMat = glowMat(curtainTex, 0.8);
  {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(curtainAcc.pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(curtainAcc.uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(curtainAcc.col, 3)); g.setIndex(curtainAcc.idx);
    const m = new T.Mesh(g, curtainMat); m.frustumCulled = false; m.name = 'curtains'; scene.add(m);
  }
  // low mist: two sheets that follow the ground (0.35 m and 1.1 m above it), absent over the camp, thickest in the outer basin; quality steps drop the upper sheet by draw range
  const mistLayers = [[0.35, 3.6, 0.14], [1.1, 5.0, 0.09]], mistIdxPer = [];
  const mistMat = glowMat(mistTex);
  {
    const pos = [], uv = [], col = [], idx = [], SEGm = 72, RINGS = 16, R = 150;
    for (const [dy, rep, a] of mistLayers) {
      const n0 = pos.length / 3;
      for (let i = 0; i <= RINGS; i++) for (let j = 0; j < SEGm; j++) {
        const r = (i / RINGS) * R, t = (j / SEGm) * 6.283, x = Math.sin(t) * r, z = Math.cos(t) * r; pos.push(x, hgt(x, z) + dy, z); uv.push(0.5 + (x / R) * 0.5 * rep, 0.5 + (z / R) * 0.5 * rep);
        const f = a * sm(clamp((r - 48) / 32, 0, 1)) * (1 - sm(clamp((r - 88) / 12, 0, 1))); col.push(0.3 * f, 0.62 * f, 0.62 * f);
      }
      const i0 = idx.length; for (let i = 0; i < RINGS; i++) for (let j = 0; j < SEGm; j++) { const a0 = n0 + i * SEGm + j, b0 = n0 + i * SEGm + ((j + 1) % SEGm), c0 = n0 + (i + 1) * SEGm + j, d0 = n0 + (i + 1) * SEGm + ((j + 1) % SEGm); idx.push(a0, c0, b0, b0, c0, d0); }
      mistIdxPer.push(idx.length - i0);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    const m = new T.Mesh(g, mistMat); m.frustumCulled = false; m.name = 'mist'; scene.add(m);
  }
  // flames (sprites, ONE Points per colour family) — the camp fire is bigger and warm, the lamps and orbs cool
  const campFlames = []; const lampFlames = [];
  {
    for (const f of flames) {
      if (f.kind === 'camp') { for (let i = 0; i < 7; i++) campFlames.push({ x: f.x + (rnd() - 0.5) * 0.7, y: f.y + i * 0.22, z: f.z + (rnd() - 0.5) * 0.7, ph: rnd() * 6.28, k: 0.8 + rnd(), r: 0.5, g: 0.3 - i * 0.02, b: 0.08 }); }
      else for (let i = 0; i < (f.kind === 'orb' ? 1 : 2); i++) lampFlames.push({ x: f.x + (rnd() - 0.5) * 0.15, y: f.y + i * 0.3, z: f.z + (rnd() - 0.5) * 0.15, ph: rnd() * 6.28, k: 0.8 + rnd(), r: f.c ? f.c[0] : 0.25, g: f.c ? f.c[1] : 0.95, b: f.c ? f.c[2] : 0.9, big: f.kind === 'orb' });
    }
  }
  const mkPoints = (list, size, op) => {
    const n = list.length, p = new Float32Array(n * 3), c = new Float32Array(n * 3); list.forEach((f, i) => { p[i * 3] = f.x; p[i * 3 + 1] = f.y; p[i * 3 + 2] = f.z; c[i * 3] = f.r; c[i * 3 + 1] = f.g; c[i * 3 + 2] = f.b; });
    const g = new T.BufferGeometry(), a = new T.BufferAttribute(p, 3); a.setUsage(T.DynamicDrawUsage); g.setAttribute('position', a); g.setAttribute('color', new T.BufferAttribute(c, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ size, map: flameTex, vertexColors: true, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); pts.frustumCulled = false; scene.add(pts); return { pts, a, list };
  };
  const campPts = mkPoints(campFlames, 1.45, 0.85), lampPts = mkPoints(lampFlames, 1.25, 0.95);
  // floating light motes (ONE Points)
  const MOTES = 520, motePos = new Float32Array(MOTES * 3), moteV = new Float32Array(MOTES * 2), moteB = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 100; motePos[i * 3] = Math.sin(a) * r; motePos[i * 3 + 2] = Math.cos(a) * r; moteB[i] = hgt(motePos[i * 3], motePos[i * 3 + 2]) + 0.3; motePos[i * 3 + 1] = moteB[i] + rnd() * 15; moteV[i * 2] = 0.25 + rnd() * 0.7; moteV[i * 2 + 1] = rnd() * 6.283; }
  const moteGeo = new T.BufferGeometry(), moteAttr = new T.BufferAttribute(motePos, 3); moteAttr.setUsage(T.DynamicDrawUsage); moteGeo.setAttribute('position', moteAttr);
  const moteMesh = new T.Points(moteGeo, new T.PointsMaterial({ size: 0.5, map: glowTex, color: 0x9ffff0, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); moteMesh.frustumCulled = false; scene.add(moteMesh);

  // ------------------------------------------------------------------ lights: a cool hemisphere, the camp fire (the only real light that flickers), the hero's own lamp (rpg.js moves it)
  scene.add(new T.HemisphereLight(0x3a86a8, 0x0f5f68, 0.85));
  const fireL = new T.PointLight(0xff8a3a, 55, 55, 2); fireL.position.set(0, 2.4, 0); scene.add(fireL);
  const fill = new T.PointLight(0x7ff4ff, 9, 14, 2); fill.position.set(spawn.x, hgt(spawn.x, spawn.z) + 3, spawn.z); scene.add(fill);

  // ------------------------------------------------------------------ the module's contract
  const regions = REGIONS.map((r) => { const g = GATES.find((q) => q.key === r.key), p = GY(g, 97.6, 0); return { key: r.key, x: p[0], z: p[1], dir: r.b, open: false }; });
  let quality = 0, flick = true, moteN = MOTES;
  const setQuality = (step) => {
    quality = clamp(step | 0, 0, 3); moteN = [MOTES, 340, 160, 40][quality]; moteGeo.setDrawRange(0, moteN); flick = quality < 2;
    const layers = [2, 1, 1, 1][quality], mm = scene.getObjectByName('mist'); let cnt = 0; for (let i = 0; i < layers; i++) cnt += mistIdxPer[i]; mm.geometry.setDrawRange(0, cnt); mm.visible = quality < 3;
    if (!flick) fireL.intensity = 55;
  };
  setQuality(0);
  const tmpP = moteAttr.array;
  const stats = () => {
    let calls = 0, tris = 0; scene.traverse((o) => { if ((o.isMesh || o.isPoints || o.isLine) && o.visible) { calls++; const g = o.geometry; if (!g) return; let n = g.index ? g.index.count : g.attributes.position.count; const dr = g.drawRange; if (dr && isFinite(dr.count)) n = Math.min(n, dr.count); if (o.isMesh) tris += (n / 3) * (o.isInstancedMesh ? o.count : 1); } });
    return { calls, tris: Math.round(tris), colliders: colliders.length, crystals: halo.pos.length / 3, motes: moteN, quality, kit: dbg.kit, lights: 3, pois: POI.length };
  };
  return {
    scene, hgt, heightAt: hgt, BOUND, colliders, portal, fill, pois: POI, regions, spawn, setQuality, stats, camp,
    clampXZ: (x, z) => { const r = Math.hypot(x, z); return r > R_CLAMP ? [(x / r) * R_CLAMP, (z / r) * R_CLAMP] : [x, z]; },
    update(t, dt, cam) {
      sky.position.copy(cam);
      stripTex.offset.y -= dt * 0.22; mistTex.offset.x += dt * 0.004; mistTex.offset.y += dt * 0.0025; curtainTex.offset.y -= dt * 0.035; curtainTex.offset.x += dt * 0.006; portal.disc.rotation.z += dt * 0.7;
      if (flick) fireL.intensity = 55 * (0.9 + 0.1 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1) + 0.04 * Math.sin(t * 23));
      { const a = campPts.list, p = campPts.a.array; for (let i = 0; i < a.length; i++) { const f = a[i], s = Math.sin(t * 7 * f.k + f.ph); p[i * 3] = f.x + s * 0.18; p[i * 3 + 1] = f.y + (flick ? 0.25 * Math.abs(Math.sin(t * 5 * f.k + f.ph)) : 0); p[i * 3 + 2] = f.z + Math.cos(t * 6 * f.k + f.ph) * 0.18; } campPts.a.needsUpdate = true; }
      { const a = lampPts.list, p = lampPts.a.array; for (let i = 0; i < a.length; i++) { const f = a[i]; p[i * 3 + 1] = f.y + (flick ? 0.12 * Math.abs(Math.sin(t * 6 * f.k + f.ph)) : 0); } lampPts.a.needsUpdate = true; }
      for (let i = 0; i < moteN; i++) { const j = i * 3, v = moteV[i * 2], ph = moteV[i * 2 + 1]; tmpP[j + 1] += v * dt; if (tmpP[j + 1] > moteB[i] + 15) tmpP[j + 1] = moteB[i]; tmpP[j] += Math.sin(t * 0.5 + ph) * 0.35 * dt; tmpP[j + 2] += Math.cos(t * 0.43 + ph * 1.3) * 0.35 * dt; }
      moteAttr.needsUpdate = true;
    },
    dispose() {
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); } });
      for (const t of disposables) t.dispose();
      for (const k in kit) { kit[k].geo.dispose(); if (kit[k].mat) { for (const q in kit[k].mat) { const v = kit[k].mat[q]; if (v && v.isTexture) v.dispose(); } kit[k].mat.dispose(); } }
    },
  };
}
