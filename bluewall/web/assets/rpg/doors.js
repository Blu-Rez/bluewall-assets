// RP1C — the way into every building: a floating orb over each door, a glass icon when she is near, a tap target in the 3D view.  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
//   · ONE THREE.Points per state (gold = something to collect, green = an upgrade you can afford, blue = nothing to do) draws every orb within 45 m: 3 calls at most; the material is a PointsMaterial with the
//     same parameters as the waterfall mist's, so its shader program already exists (programs +0 — the test counts).
//   · within 12 m (and in front of the camera) the 3 nearest orbs turn into glass-plate icons (THREE.Sprite, one pulse, no endless animation): ≤ 3 calls.  The icons come from ONE procedural canvas atlas (no image files, no text).
//   · tap(x, y) answers which orb is under a finger (screen distance ≥ 22 px = a 44 px target) — rpg.js then makes her walk there and opens the same T1 sheet (sheets.open) on arrival.
// Door positions / states come from the same data the sheets read (world.picks, sheets.lots(), sheets.can(), sheets.peek()); nothing is cached for longer than 5 s.  No per-frame allocation.
const NEAR_SKIP = new Set(['wall', 'gate', 'tower']);
export const STATES = ['gold', 'green', 'blue'];
const HEX = { gold: 0xffc23d, green: 0x4fe38a, blue: 0x55b6ff };
export const KINDS = ['home', 'civic', 'army', 'forge', 'mine', 'vault', 'work', 'keep'];
export const GLYPH = {                                                    // 24 x 24 stroke paths (the same style as the HUD icons); one string each = canvas Path2D and HUD <svg>
  home: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5',
  civic: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10l9-6 9 6',
  army: 'M6 18l10-10M14 6l4 0 0 4M6 18l-2 2M8.5 15.5l2 2M16 8l3.5-3.5',
  forge: 'M4 9h12l-1.6 3.5H11V16h3.5v3H8v-3h3v-3.5H7.5L4 9zM16 9h4',
  mine: 'M6 4h12l4 6-10 11L2 10zM2 10h20M9 4l-3 6 6 11 6-11-3-6',
  vault: 'M3 10h18v10H3zM3 10a9 5 0 0 1 18 0M12 13.5v3',
  work: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  keep: 'M4 19h16M5 16L4 7l5 4 3-6 3 6 5-4-1 9z',
};
export function kindOf(id) {
  if (!id) return 'home';
  if (id.startsWith('home:')) return 'home'; if (id.startsWith('civic:')) return 'civic'; if (id.startsWith('ws:')) return 'work';
  if (id.startsWith('mine_')) return 'mine'; if (id.startsWith('vault_')) return 'vault'; if (id === 'keep') return 'keep'; if (id === 'forge') return 'forge';
  if (/^(barracks|training|stable|workshop|lair|archer)/.test(id)) return 'army';
  return 'home';
}
export const iconSVG = (kind) => `<svg viewBox="0 0 24 24"><path d="${GLYPH[kind] || GLYPH.home}"/></svg>`;

export function createDoors(H, S, G) {
  const T = H.THREE, { scene, camera, renderer } = H, hexs = (n) => '#' + n.toString(16).padStart(6, '0');
  const MAXD = 45, ICOND = 12, NIC = 3, UP = 2.2, MAXN = 160;
  const st = { on: false, items: [], rc: 0, buildAt: -1e9, peekAt: -1e9, nOrb: 0, nIcon: 0, built: 0, ms: 0 };
  const grp = new T.Group(); grp.name = 'rp-doors'; grp.userData.rpHero = true;
  const v = new T.Vector3(), fw = new T.Vector3(), nearest = [null, null, null], nd = [0, 0, 0];
  let glowTex = null, atlas = null, pts = null; const ics = [];

  // ---- textures: a soft round glow for the orbs, ONE atlas of glass icons (3 states x 8 kinds)
  function makeGlow() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.97)'); rg.addColorStop(0.5, 'rgba(255,255,255,0.78)'); rg.addColorStop(0.75, 'rgba(255,255,255,0.2)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function makeAtlas() {
    const C = 128, cv = document.createElement('canvas'); cv.width = C * KINDS.length; cv.height = C * STATES.length; const g = cv.getContext('2d');
    STATES.forEach((s, row) => KINDS.forEach((k, col) => {
      const cx = col * C + C / 2, cy = row * C + C / 2, R = C * 0.43, col2 = hexs(HEX[s]);
      const rg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.38, R * 0.08, cx, cy, R); rg.addColorStop(0, 'rgba(70,104,138,0.93)'); rg.addColorStop(1, 'rgba(9,20,38,0.94)');
      g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fillStyle = rg; g.fill();
      g.lineWidth = C * 0.055; g.strokeStyle = col2; g.stroke();                                                      // the rim carries the state colour
      g.beginPath(); g.arc(cx, cy, R * 0.8, Math.PI * 1.08, Math.PI * 1.72); g.lineWidth = C * 0.032; g.strokeStyle = 'rgba(255,255,255,0.32)'; g.stroke();   // glass highlight
      g.save(); g.translate(cx - R * 0.6, cy - R * 0.6); g.scale((R * 1.2) / 24, (R * 1.2) / 24); g.lineWidth = 1.9; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.stroke(new Path2D(GLYPH[k])); g.restore();
    }));
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 2; return t;
  }

  // ---- the door list: every pick / worksite / lot that has a sheet, with the door point (the footprint's face towards the keep), the orb and a free spot to stand on
  function build() {
    st.buildAt = performance.now(); const sh = H.sheets, SMp = H.SM, world = H.world; if (!sh || !world) return;
    const keep = (world.picks || []).find((p) => p.id === 'keep'), kx = keep ? (keep.box.min.x + keep.box.max.x) / 2 : 0, kz = keep ? (keep.box.min.z + keep.box.max.z) / 2 : 0;
    const old = new Map(); for (const it of st.items) old.set(it.id, it); const out = [];
    const add = (id, cx, cz, hx, hz, ry) => {
      const o = old.get(id); if (o && o.cx === cx && o.cz === cz && o.hx === hx && o.hz === hz && o.ry === ry) { out.push(o); return; }                   // (unchanged since the last pass: nothing to recompute)
      let dx = kx - cx, dz = kz - cz, l = Math.hypot(dx, dz); if (l < 1) { dx = 0; dz = 1; l = 1; } dx /= l; dz /= l;
      const c = Math.cos(ry), sn = Math.sin(ry), lu = dx * c - dz * sn, lv = dx * sn + dz * c, t = Math.min(hx / (Math.abs(lu) || 1e-6), hz / (Math.abs(lv) || 1e-6)), pu = lu * t, pv = lv * t;
      const fx = cx + pu * c + pv * sn, fz = cz - pu * sn + pv * c;                                                     // the face point
      const it = old.get(id) || { id, st: 2, icon: false, d2: 1e9, ph: Math.random() * 6.28, kind: kindOf(id), sp: -1 };
      it.x = fx + dx * 0.7; it.z = fz + dz * 0.7; it.y = G.ground(it.x, it.z) + UP;
      let gx = fx + dx * 1.5, gz = fz + dz * 1.5;
      if (!G.free(gx, gz)) { let f = false; for (let r = 1.5; r < 4 && !f; r += 0.5) for (let a = 0; a < 6.28 && !f; a += 0.45) { const px = fx + Math.cos(a) * r, pz = fz + Math.sin(a) * r; if (G.free(px, pz)) { gx = px; gz = pz; f = true; } } }
      it.gx = gx; it.gz = gz; it.fx = fx; it.fz = fz; it.cx = cx; it.cz = cz; it.hx = hx; it.hz = hz; it.ry = ry; out.push(it);
    };
    for (const p of world.picks || []) { if (NEAR_SKIP.has(p.id) || !sh.can(p.id, SMp)) continue; const b = p.box; add(p.id, (b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2, (b.max.x - b.min.x) / 2, (b.max.z - b.min.z) / 2, 0); }
    for (const l of sh.lots ? sh.lots() : []) if (sh.can(l.id, SMp)) add(l.id, l.x, l.z, l.w / 2, l.d / 2, l.ry);
    st.items = out; st.built = out.length;
  }
  function refreshStates() {                                                                                       // sliced: 20 doors per frame (a full pass about once a second), so no frame pays for all 113
    const sh = H.sheets; if (!sh || !sh.peek) { st.peekAt = performance.now(); return; } const items = st.items, n = items.length;
    for (let k = 0; k < 20 && st.rc < n; k++, st.rc++) { const it = items[st.rc]; if (it.d2 > (MAXD + 10) * (MAXD + 10)) continue; const s = (st.force && st.force[it.id]) || sh.peek(it.id, H.SM); it.st = s === 'gold' ? 0 : s === 'green' ? 1 : 2; }
    if (st.rc >= n) { st.rc = 0; st.peekAt = performance.now(); }
  }

  // ---- drawing
  function init() {
    glowTex = makeGlow(); atlas = makeAtlas();
    pts = STATES.map((s) => {                                                                                       // same parameters as falls.js's mist (map, sizeAttenuation, fog, transparent, no depth write): the same program
      const g = new T.BufferGeometry(); const a = new T.BufferAttribute(new Float32Array(MAXN * 3), 3); a.setUsage(T.DynamicDrawUsage); g.setAttribute('position', a); g.setDrawRange(0, 0);
      const m = new T.PointsMaterial({ map: glowTex, size: 1.9, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false, fog: true, color: HEX[s] });
      const p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = 12; p.userData.rpHero = true; grp.add(p); return { p, a, m, n: 0 };
    });
    for (let i = 0; i < NIC; i++) {
      const tx = atlas.clone(); tx.needsUpdate = true; tx.repeat.set(1 / KINDS.length, 1 / STATES.length);
      const m = new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 1, fog: false }); const sp = new T.Sprite(m); sp.visible = false; sp.renderOrder = 13; sp.userData.rpHero = true; sp.scale.set(0.01, 0.01, 1);
      grp.add(sp); ics.push({ sp, m, tx, it: null, t0: 0 });
    }
  }
  function setCell(ic, it) { ic.tx.offset.set(KINDS.indexOf(it.kind) / KINDS.length, 1 - (it.st + 1) / STATES.length); ic.tx.updateMatrix(); }
  const ease = (x) => 1 - (1 - x) * (1 - x) * (1 - 1.7 * x);                                                      // a little overshoot

  function tick(now, dt) {
    if (!st.on) return; const t0 = performance.now(), home = S.where === 'home'; grp.visible = home; if (!home || !pts) return;
    if (now - st.buildAt > 20000) build();
    const hx = S.x, hz = S.z, items = st.items, tt = now / 1000; camera.getWorldDirection(fw);
    for (let i = 0; i < items.length; i++) { const it = items[i], dx = it.x - hx, dz = it.z - hz; it.d2 = dx * dx + dz * dz; }
    if (st.rc > 0 || now - st.peekAt > 1000) refreshStates();
    // the (up to) 3 nearest orbs within 12 m that are in front of the camera turn into icons; a sprite already showing one that stays keeps it
    const show = !S.sheetOn; for (let k = 0; k < NIC; k++) { nearest[k] = null; nd[k] = 1e9; }
    if (show) for (let i = 0; i < items.length; i++) {
      const it = items[i]; if (it.d2 > ICOND * ICOND) continue; v.set(it.x - camera.position.x, it.y - camera.position.y, it.z - camera.position.z); if (v.dot(fw) < 0.5) continue;
      for (let k = 0; k < NIC; k++) if (it.d2 < nd[k]) { for (let q = NIC - 1; q > k; q--) { nd[q] = nd[q - 1]; nearest[q] = nearest[q - 1]; } nd[k] = it.d2; nearest[k] = it; break; }
    }
    for (const it of items) it.icon = false;
    for (const ic of ics) { if (ic.it && nearest.includes(ic.it)) { ic.it.icon = true; ic.keep = true; } else ic.keep = false; }
    for (const ic of ics) {
      if (ic.keep) continue; ic.it = null;
      for (let k = 0; k < NIC; k++) { const c = nearest[k]; if (c && !c.icon) { c.icon = true; ic.it = c; ic.t0 = now; ic.cs = -1; break; } }
    }
    let ni = 0;
    for (const ic of ics) {
      const it = ic.it; if (!it) { ic.sp.visible = false; continue; } ni++;
      if (ic.cs !== it.st) { ic.cs = it.st; setCell(ic, it); }
      const a = (now - ic.t0) / 1000; let s = a < 0.2 ? ease(a / 0.2) : 1; if (a >= 0.2 && a < 0.55) s += 0.12 * Math.sin(Math.PI * ((a - 0.2) / 0.35));        // scale in 200 ms, one pulse, then still
      const k = Math.min(1, Math.max(0.55, Math.sqrt(it.d2) / 6)); ic.sp.position.set(it.x, it.y + 0.15, it.z); ic.sp.scale.set(1.7 * s * k, 1.7 * s * k, 1); ic.sp.visible = true;      // (smaller as she comes close, so it never fills the screen)
    }
    // the orbs: every other door within 45 m, slow bob
    for (const P of pts) P.n = 0; let no = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; if (it.icon || it.d2 > MAXD * MAXD) continue; const P = pts[it.st]; if (P.n >= MAXN) continue; const o = P.n * 3, arr = P.a.array;
      arr[o] = it.x; arr[o + 1] = it.y + 0.14 * Math.sin(tt * 1.5 + it.ph); arr[o + 2] = it.z; P.n++; no++;
    }
    for (const P of pts) { P.p.geometry.setDrawRange(0, P.n); P.p.visible = P.n > 0; if (P.n) { P.a.clearUpdateRanges(); P.a.addUpdateRange(0, P.n * 3); P.a.needsUpdate = true; } }
    st.nOrb = no; st.nIcon = ni; st.ms = performance.now() - t0;
  }

  // ---- a finger on the 3D view: the orb / icon under it (nearest on screen within max(22 px, its own size)), or null
  function tap(cx, cy) {
    if (!st.on || S.where !== 'home' || S.sheetOn) return null; const W = innerWidth, Hh = innerHeight; let best = null, bd = 1e9; camera.getWorldDirection(fw);
    for (const it of st.items) {
      if (it.d2 > MAXD * MAXD) continue; v.set(it.x - camera.position.x, it.y - camera.position.y, it.z - camera.position.z); if (v.dot(fw) < 0.3) continue;
      v.set(it.x, it.y, it.z).project(camera); const px = (v.x + 1) * 0.5 * W, py = (1 - v.y) * 0.5 * Hh, d = Math.hypot(px - cx, py - cy);
      const dist = Math.sqrt(it.d2), rad = Math.max(22, (it.icon ? 0.85 : 0.5) * (Hh / 2) / (Math.tan((camera.fov * Math.PI) / 360) * Math.max(dist, 1)));
      if (d <= rad && d < bd) { bd = d; best = it; }
    }
    return best;
  }
  function enter() { if (st.on) return; st.on = true; if (!pts) init(); scene.add(grp); build(); st.peekAt = -1e9; }
  function exit() {
    if (!st.on) return; st.on = false; grp.removeFromParent();
    for (const P of pts || []) { P.p.geometry.dispose(); P.m.dispose(); } for (const ic of ics) { ic.m.dispose(); ic.tx.dispose(); }
    if (glowTex) glowTex.dispose(); if (atlas) atlas.dispose(); for (const c of [...grp.children]) grp.remove(c);
    pts = null; ics.length = 0; glowTex = atlas = null; st.items = []; st.nOrb = st.nIcon = 0;
  }
  const info = () => ({ doors: st.built, orbs: st.nOrb, icons: st.nIcon, ms: +st.ms.toFixed(2), calls: (pts || []).filter((P) => P.p.visible).length + ics.filter((i) => i.sp.visible).length });
  return { enter, exit, tick, tap, build, info, st, items: () => st.items, kindOf, iconSVG };
}
