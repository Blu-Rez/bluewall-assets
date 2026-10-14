// RP1 — the underworld test area (≈ 200 x 200 m): uneven dark ground, exponential fog (navy sky -> turquoise haze), a turquoise glow from deep below (fissures + crystal halos),
// 150 crystal clusters (ONE InstancedMesh), floating light motes (ONE Points), a glowing path to a return portal.  No enemies, no story yet.
// A plain ES module: it gets THREE from the host (rpg.js), it imports nothing.  Draw calls: sky, ground, crystals, halos, motes, fissures, path, spires, ring, disc, 2 pillars ≈ 12.
export function buildUnder(T, { seed = 7, crystals = 150, motes = 520 } = {}) {
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (t) => t * t * (3 - 2 * t);
  let rs = seed >>> 0;
  const rnd = () => { rs = (rs + 0x6d2b79f5) >>> 0; let t = rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash = (i, j) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = sm(x - i), fz = sm(z - j), a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz; };
  const fbm = (x, z) => vn(x, z) * 0.55 + vn(x * 2.1 + 11, z * 2.1 + 5) * 0.28 + vn(x * 4.3 + 3, z * 4.3 + 9) * 0.17;
  const BOUND = 94;

  // ---- the glowing path (spawn at the south end, the return portal at the north end)
  const curve = new T.CatmullRomCurve3([[0, -72], [20, -50], [-12, -26], [12, -2], [-20, 24], [10, 50], [0, 74]].map(([x, z]) => new T.Vector3(x, 0, z)), false, 'catmullrom', 0.5);
  const PS = curve.getSpacedPoints(180);
  const pathD = (x, z) => { let m = 1e9; for (let i = 0; i < PS.length; i++) { const dx = x - PS[i].x, dz = z - PS[i].z, d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
  const rawH = (x, z) => (fbm(x * 0.028, z * 0.028) - 0.5) * 11 + (fbm(x * 0.09 + 20, z * 0.09 + 7) - 0.5) * 2.4;
  const hgt = (x, z) => rawH(x, z) * (0.1 + 0.9 * sm(clamp((pathD(x, z) - 3) / 10, 0, 1)));
  const pathPt = (i) => PS[clamp(i, 0, PS.length - 1)];
  const S = PS[0], Pt = PS[PS.length - 1], tS = PS[2].clone().sub(PS[0]).setY(0).normalize(), tP = PS[PS.length - 1].clone().sub(PS[PS.length - 4]).setY(0).normalize();

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x0a3f50, 0.017);
  scene.background = new T.Color(0x0a3f50);
  const disposables = [];
  const mkTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; disposables.push(t); return t; };
  const glowTex = mkTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const swirlTex = mkTex(256, 256, (g, w, h) => {
    g.translate(w / 2, h / 2);
    for (let k = 0; k < 7; k++) { g.save(); g.rotate((k / 7) * Math.PI * 2); const r = g.createLinearGradient(0, 0, w / 2, 0); r.addColorStop(0, 'rgba(180,255,245,.0)'); r.addColorStop(0.35, 'rgba(60,230,215,.55)'); r.addColorStop(1, 'rgba(20,120,170,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w * 0.22, -h * 0.16, w * 0.5, h * 0.02); g.quadraticCurveTo(w * 0.22, -h * 0.02, 0, 0); g.fill(); g.restore(); }
    const c = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); c.addColorStop(0, 'rgba(255,255,255,.95)'); c.addColorStop(0.3, 'rgba(120,255,240,.45)'); c.addColorStop(1, 'rgba(0,80,120,0)'); g.fillStyle = c; g.fillRect(-w / 2, -h / 2, w, h);
  });
  const stripTex = mkTex(64, 128, (g, w, h) => { const a = g.createLinearGradient(0, 0, w, 0); a.addColorStop(0, 'rgba(40,220,210,0)'); a.addColorStop(0.5, 'rgba(160,255,245,.95)'); a.addColorStop(1, 'rgba(40,220,210,0)'); g.fillStyle = a; g.fillRect(0, 0, w, h); const b = g.createLinearGradient(0, 0, 0, h); b.addColorStop(0, 'rgba(0,0,0,.0)'); b.addColorStop(0.5, 'rgba(0,0,0,.55)'); b.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = b; g.fillRect(0, 0, w, h); });
  stripTex.wrapT = T.RepeatWrapping; stripTex.repeat.set(1, 30);

  // ---- sky: navy overhead, turquoise haze at the horizon (the fog colour), a dark floor under the horizon
  const sky = (() => {
    const g = new T.SphereGeometry(900, 24, 16), p = g.attributes.position, col = new Float32Array(p.count * 3), top = new T.Color(0x030821), hor = new T.Color(0x0a4a5c), low = new T.Color(0x06222c), c = new T.Color();
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 900; if (y >= 0) c.copy(hor).lerp(top, Math.pow(y, 0.55)); else c.copy(hor).lerp(low, clamp(-y * 3, 0, 1)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; m.frustumCulled = false; return m;
  })();
  scene.add(sky);

  // ---- ground
  {
    const g = new T.PlaneGeometry(300, 300, 150, 150); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c0 = new T.Color(0x07161d), c1 = new T.Color(0x0c2b33), c2 = new T.Color(0x10404a), c = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = hgt(x, z); p.setY(i, h);
      const n = fbm(x * 0.06 + 40, z * 0.06), d = pathD(x, z);
      c.copy(c0).lerp(c1, clamp(n * 1.5 - 0.3, 0, 1)).lerp(c2, clamp(1 - d / 7, 0, 1) * 0.55 + clamp((h - 2.2) / 4, 0, 0.35));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    scene.add(new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02, emissive: 0x08323c, emissiveIntensity: 0.6 })));
  }

  // ---- the turquoise light from deep below: glowing fissures in the ground (one merged mesh)
  {
    const pos = [], col = [], tc = new T.Color();
    for (let f = 0; f < 18; f++) {
      let x, z, tries = 0; do { x = (rnd() * 2 - 1) * 84; z = (rnd() * 2 - 1) * 84; tries++; } while ((pathD(x, z) < 9 || pathD(x, z) > 46) && tries < 40);
      let a = rnd() * Math.PI * 2; const n = 6 + ((rnd() * 4) | 0), w0 = 0.45 + rnd() * 0.6; let px = x, pz = z, py = hgt(px, pz) + 0.07;
      for (let s = 0; s < n; s++) {
        a += (rnd() - 0.5) * 1.1; const L = 2 + rnd() * 2.6, nx = px + Math.cos(a) * L, nz = pz + Math.sin(a) * L, ny = hgt(nx, nz) + 0.07;
        const k0 = Math.sin((s / n) * Math.PI) * w0 + 0.08, k1 = Math.sin(((s + 1) / n) * Math.PI) * w0 + 0.08, sx = -Math.sin(a), sz = Math.cos(a);
        const q = [[px + sx * k0, py, pz + sz * k0], [px - sx * k0, py, pz - sz * k0], [nx + sx * k1, ny, nz + sz * k1], [nx - sx * k1, ny, nz - sz * k1]];
        for (const id of [0, 1, 2, 2, 1, 3]) pos.push(...q[id]);
        for (const id of [0, 1, 2, 2, 1, 3]) { tc.setRGB(0.06, 0.95, 0.85).lerp(new T.Color(1, 1, 1), id === 2 || id === 3 ? 0.25 : 0.05); col.push(tc.r * 0.9, tc.g * 0.9, tc.b * 0.9); }
        px = nx; pz = nz; py = ny;
      }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, blending: T.AdditiveBlending, transparent: true, depthWrite: false, side: T.DoubleSide })); m.frustumCulled = false; scene.add(m);
  }

  // ---- crystal clusters (ONE InstancedMesh) + their halos (ONE Points)
  const colliders = [];
  const clusterGeo = (() => {
    const parts = [[0, 0, 0, 0, 3.4, 0.6], [0.55, 0.2, 0.35, -0.2, 2.2, 0.36], [-0.5, 0.3, -0.3, -0.35, 2.0, 0.34], [0.2, -0.55, 0.05, 0.45, 1.7, 0.3], [-0.25, -0.5, -0.1, 0.5, 2.5, 0.32], [0.7, -0.3, 0.5, 0.3, 1.2, 0.26], [-0.7, -0.05, -0.55, 0.0, 1.35, 0.27]];
    const P = [], N = [], m = new T.Matrix4(), e = new T.Euler(), q = new T.Quaternion(), v = new T.Vector3(), n3 = new T.Matrix3();
    for (const [dx, dz, tx, tz, h, r] of parts) {
      const g = new T.CylinderGeometry(0, r, h, 6, 1).toNonIndexed(); g.translate(0, h / 2, 0);
      e.set(tz, 0, -tx); q.setFromEuler(e); m.compose(v.set(dx, 0, dz), q, new T.Vector3(1, 1, 1)); g.applyMatrix4(m); g.computeVertexNormals();
      P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); void n3; return g;
  })();
  const cMat = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x14c8b8, emissiveIntensity: 1.35, roughness: 0.22, metalness: 0.15, flatShading: true });
  const crystalsMesh = new T.InstancedMesh(clusterGeo, cMat, crystals); crystalsMesh.frustumCulled = false;
  const halo = { pos: [], col: [] };
  {
    const palette = [0x2de6d0, 0x4bb8ff, 0xa9fff2, 0x2de6d0, 0x3f7dff, 0x7ff0ff].map((h) => new T.Color(h));
    const mm = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
    let k = 0, guard = 0;
    while (k < crystals && guard++ < 4000) {
      const x = (rnd() * 2 - 1) * 92, z = (rnd() * 2 - 1) * 92;
      if (pathD(x, z) < 6.5 || Math.hypot(x - S.x, z - S.z) < 10 || Math.hypot(x - Pt.x, z - Pt.z) < 10) continue;
      const big = k < 10, s = big ? 2.6 + rnd() * 1.8 : 0.7 + rnd() * 1.5, y = hgt(x, z) - 0.15;
      e.set((rnd() - 0.5) * 0.18, rnd() * 6.283, (rnd() - 0.5) * 0.18); q.setFromEuler(e); mm.compose(v.set(x, y, z), q, sc.set(s, s * (0.8 + rnd() * 0.7), s));
      crystalsMesh.setMatrixAt(k, mm); const c = palette[(rnd() * palette.length) | 0]; crystalsMesh.setColorAt(k, c);
      colliders.push([x, z, 0.95 * s]);
      halo.pos.push(x, y + 1.6 * s, z); halo.col.push(c.r * 0.9, c.g * 0.9, c.b * 0.9); halo.size = halo.size || [];
      k++;
    }
    crystalsMesh.count = k; crystalsMesh.instanceMatrix.needsUpdate = true; if (crystalsMesh.instanceColor) crystalsMesh.instanceColor.needsUpdate = true;
  }
  scene.add(crystalsMesh);
  {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(halo.pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(halo.col, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ size: 9, map: glowTex, vertexColors: true, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); pts.frustumCulled = false; scene.add(pts);
  }

  // ---- dark spires (one InstancedMesh) — silhouettes in the fog, and the edge of the area
  {
    const g = new T.ConeGeometry(2.2, 16, 5); g.translate(0, 8, 0);
    const mesh = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: 0x0b1a22, emissive: 0x031c25, roughness: 0.95, flatShading: true }), 72), mm = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3();
    let k = 0, guard = 0;
    while (k < 72 && guard++ < 4000) {
      const ang = rnd() * 6.283, rad = k < 30 ? 98 + rnd() * 18 : 20 + rnd() * 78, x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      if (pathD(x, z) < 11) continue;
      const s = 0.7 + rnd() * 1.4, hs = 0.6 + rnd() * 1.5; e.set((rnd() - 0.5) * 0.12, rnd() * 6.283, (rnd() - 0.5) * 0.12); q.setFromEuler(e);
      mm.compose(v.set(x, hgt(x, z) - 0.6, z), q, sc.set(s, hs, s)); mesh.setMatrixAt(k++, mm); if (rad < 96) colliders.push([x, z, 1.5 * s]);
    }
    mesh.count = k; mesh.frustumCulled = false; scene.add(mesh);
  }

  // ---- the glowing path (a ribbon that follows the ground, a light pulse runs along it)
  {
    const pos = [], uv = [], idx = [], W = 1.5;
    for (let i = 0; i < PS.length; i++) {
      const a = PS[Math.max(0, i - 1)], b = PS[Math.min(PS.length - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl, p = PS[i];
      for (const s of [-1, 1]) { const x = p.x + nx * W * s, z = p.z + nz * W * s; pos.push(x, hgt(x, z) + 0.09, z); uv.push(s < 0 ? 0 : 1, i / PS.length); }
      if (i > 0) { const j = i * 2; idx.push(j - 2, j - 1, j, j, j - 1, j + 1); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: stripTex, color: 0x9ffff0, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); m.frustumCulled = false; scene.add(m);
  }

  // ---- arrival dais (south end) + the return portal (north end)
  {
    const g = new T.CircleGeometry(4.2, 40); g.rotateX(-Math.PI / 2);
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: glowTex, color: 0x2fc8e0, transparent: true, opacity: 0.32, blending: T.AdditiveBlending, depthWrite: false })); m.position.set(S.x, hgt(S.x, S.z) + 0.12, S.z); scene.add(m);
  }
  const portal = (() => {
    const gy = hgt(Pt.x, Pt.z), grp = new T.Group(); grp.position.set(Pt.x, gy, Pt.z); grp.rotation.y = Math.atan2(tP.x, tP.z);
    const ring = new T.Mesh(new T.TorusGeometry(3.7, 0.3, 10, 44), new T.MeshStandardMaterial({ color: 0x12303a, emissive: 0x1de0d0, emissiveIntensity: 1.5, roughness: 0.4 })); ring.position.y = 4.1; grp.add(ring);
    const disc = new T.Mesh(new T.CircleGeometry(3.5, 40), new T.MeshBasicMaterial({ map: swirlTex, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); disc.position.y = 4.1; grp.add(disc);
    for (const s of [-1, 1]) { const p = new T.Mesh(clusterGeo, cMat); p.position.set(s * 5.2, -0.2, 0); p.scale.set(1.9, 2.2, 1.9); grp.add(p); }
    scene.add(grp); return { grp, disc, x: Pt.x, z: Pt.z, y: gy + 1.2, r: 2.5 };
  })();

  // ---- floating light motes (ONE Points)
  const motePos = new Float32Array(motes * 3), moteV = new Float32Array(motes * 2);
  for (let i = 0; i < motes; i++) { motePos[i * 3] = (rnd() * 2 - 1) * 98; motePos[i * 3 + 1] = 0.4 + rnd() * 15; motePos[i * 3 + 2] = (rnd() * 2 - 1) * 98; moteV[i * 2] = 0.25 + rnd() * 0.7; moteV[i * 2 + 1] = rnd() * 6.283; }
  const moteGeo = new T.BufferGeometry(); const moteAttr = new T.BufferAttribute(motePos, 3); moteAttr.setUsage(T.DynamicDrawUsage); moteGeo.setAttribute('position', moteAttr);
  const moteMesh = new T.Points(moteGeo, new T.PointsMaterial({ size: 0.5, map: glowTex, color: 0x9ffff0, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); moteMesh.frustumCulled = false; scene.add(moteMesh);

  // ---- lights: a cool hemisphere (turquoise from below), a faint moon, two turquoise pools
  scene.add(new T.HemisphereLight(0x3aa0c4, 0x138a82, 1.5));
  const moon = new T.DirectionalLight(0x7fd8ff, 0.85); moon.position.set(-30, 60, 20); scene.add(moon);
  const lp = new T.PointLight(0x2fe8d8, 260, 70, 2); lp.position.set(Pt.x, gy4(Pt.x, Pt.z), Pt.z); scene.add(lp);
  const ls = new T.PointLight(0x35a8ff, 170, 55, 2); ls.position.set(S.x, gy4(S.x, S.z) - 0 + 3.5, S.z); scene.add(ls);
  function gy4(x, z) { return hgt(x, z) + 4.2; }
  lp.position.y = gy4(Pt.x, Pt.z);

  const fill = new T.PointLight(0x7ff4ff, 60, 18, 2); fill.position.set(S.x, 3, S.z); scene.add(fill);   // a turquoise lamp that walks with the hero: she is never a black cut-out
  const tmpPos = moteAttr.array;
  return {
    scene, hgt, BOUND, colliders, portal, fill,
    spawn: { x: S.x, z: S.z, yaw: Math.atan2(tS.x, tS.z) },
    clampXZ: (x, z) => [clamp(x, -BOUND, BOUND), clamp(z, -BOUND, BOUND)],
    update(t, dt, cam) {
      sky.position.copy(cam);
      stripTex.offset.y -= dt * 0.22; portal.disc.rotation.z += dt * 0.7;
      lp.intensity = 260 * (0.92 + 0.08 * Math.sin(t * 2.3)); ls.intensity = 170 * (0.94 + 0.06 * Math.sin(t * 1.7 + 1));
      for (let i = 0; i < motes; i++) {
        const j = i * 3, v = moteV[i * 2], ph = moteV[i * 2 + 1];
        tmpPos[j + 1] += v * dt; if (tmpPos[j + 1] > 16) tmpPos[j + 1] = 0.3;
        tmpPos[j] += Math.sin(t * 0.5 + ph) * 0.35 * dt; tmpPos[j + 2] += Math.cos(t * 0.43 + ph * 1.3) * 0.35 * dt;
      }
      moteAttr.needsUpdate = true;
    },
    stats: () => ({ crystals: crystalsMesh.count, motes, colliders: colliders.length }),
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) m.dispose(); }); for (const t of disposables) t.dispose(); },
  };
}
