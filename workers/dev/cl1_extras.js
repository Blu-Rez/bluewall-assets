// cl1_extras.js — CL1 (ROUND6) part 3/3: the «extras» of the home map, counted by CATEGORY (evaluated INSIDE the real game page, hero started; synchronous).
// Every copy of every static instanced pack (the originals the cull module hid included; crowds / units / animated packs / proxies not) gets a category from its path / material / vertex count:
//   tree-card   crossed alpha cards (the forest impostors; the trunk is what the hero hits)          real-tree  promoted LOD trees (leaves meshes, 'branches' trunks)
//   bush        sc_bush cards              rock  sc_rock / bank-rocks / drone_rock boulders / PathRocks pebbles
//   bank-plant  reeds / sedge / lotus / lily / bank flowers (the water edges; walk-through)       grass  Grass / Flowers / ferns (walk-through)
//   crop        corn / pumpkin / cabbage   haybale   town-prop  props_town barrels / crates / sacks / wagon / handcart     other
// Result: { total: {cat: n}, soft: {cat: n}, nearDoor: {cat: {n, doors}}, near6: {cat: n}, doors }   nearDoor = inside FRONT (0..3 m x +-2 m) of any door; near6 = within 6 m of a door point.
(() => {
  const rp = window.__rp, B = window.__bw, sc = B.scene, GR = rp.grid();
  const Mat4 = sc.matrixWorld.constructor, m4 = new Mat4(), m5 = new Mat4();
  const SKIP = /crowd|pack#rp|attackerCamp|water-life|waterfall|rp-ramps|rp-doors|rp-goup|rp-sisters|rp_marker|wslife|army|defenses>crowd|hens/;
  sc.updateMatrixWorld(true);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const cat = (path, mat, vc, alpha, h) => {
    if (alpha && vc === 12) return 'tree-card';
    if (/sc_bush/.test(path + mat)) return 'bush';
    if (/leaves|Leaves_NormalTree/.test(mat) && h > 3) return 'real-tree';
    if (/sc_rock|bank-rocks|drone_rock|PathRocks/.test(path + mat)) return 'rock';
    if (/reeds|sedge|lotus|lily|floaters|bank-flowers|bank-life/.test(path)) return 'bank-plant';
    if (/^(Grass|Flowers|leaves)$/.test(mat) || /grass|fern|flower/i.test(path)) return 'grass';
    if (/late:(corn|pumpkin|cabbage)/.test(path)) return 'crop';
    if (/haybale/.test(path)) return 'haybale';
    if (/props_town/.test(path)) return 'town-prop';
    return 'other';
  };
  const SOFT = new Set(['bank-plant', 'grass', 'crop']);
  const total = {}, nearDoor = {}, near6 = {}, otherKeys = {};
  const dm = rp.doors(); if (dm && dm.build) dm.build(); const items = (dm && dm.items() || []).filter((it) => it.fx !== undefined);
  const fr = items.map((it) => { const nx = (it.x - it.fx) / 0.7, nz = (it.z - it.fz) / 0.7, l = Math.hypot(nx, nz) || 1; return { it, ux: nx / l, uz: nz / l }; });
  const inZone = (x, z, d) => { for (const q of fr) { const dx = x - q.it.fx, dz = z - q.it.fz; if (Math.abs(dx) > 7 || Math.abs(dz) > 7) continue; const t = dx * q.ux + dz * q.uz, s = dx * -q.uz + dz * q.ux; if (d === 'front' ? (t > 0 && t < 3 && Math.abs(s) < 2) : Math.hypot(dx, dz) < 6) return q.it.id; } return null; };
  const doorsHit = {};
  const walk = (o) => {
    if (o.userData && (o.userData.rpHero || o.userData.rpMarker || o.userData.rpProxy)) return;
    if (o.isInstancedMesh && o.geometry && !o.userData.a) {
      const path = pathOf(o);
      if (!SKIP.test(path)) {
        const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, m = Array.isArray(o.material) ? o.material[0] : o.material;
        let animated = false; for (const k in g.attributes) if (g.attributes[k].isInstancedBufferAttribute) animated = true;
        const dyn = o.instanceMatrix && o.instanceMatrix.usage === 35048;
        if (!animated && m && !dyn) {
          const alpha = m.alphaTest > 0 || m.transparent, n = Math.min(o.count, (o.instanceMatrix.array.length / 16) | 0), vc = g.attributes.position.count;
          const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
          for (let i = 0; i < n; i++) {
            m4.fromArray(o.instanceMatrix.array, i * 16); m5.multiplyMatrices(o.matrixWorld, m4); const e = m5.elements;
            if (e[0] === 0 && e[5] === 0 && e[10] === 0) continue;
            const sy = Math.hypot(e[4], e[5], e[6]), h = (bb.max.y - bb.min.y) * sy, X = e[0] * cx + e[8] * cz + e[12], Z = e[2] * cx + e[10] * cz + e[14];
            const c = cat(path, m.name || '', vc, alpha, h); total[c] = (total[c] || 0) + 1;
            if (c === 'other') { const k = path.split('>').slice(-2).join('>') + '|' + (m.name || '') + '|' + vc; otherKeys[k] = (otherKeys[k] || 0) + 1; }
            const f = inZone(X, Z, 'front'); if (f) { (nearDoor[c] = nearDoor[c] || { n: 0, doors: new Set() }).n++; nearDoor[c].doors.add(f); }
            if (inZone(X, Z, 'r6')) near6[c] = (near6[c] || 0) + 1;
          }
        }
      }
    }
    for (const c of o.children) walk(c);
  };
  for (const c of sc.children) walk(c);
  const nd = {}; for (const k in nearDoor) nd[k] = { n: nearDoor[k].n, doors: nearDoor[k].doors.size };
  const soft = {}; for (const k in total) if (SOFT.has(k)) soft[k] = total[k];
  const topOther = Object.entries(otherKeys).sort((a, b) => b[1] - a[1]).slice(0, 12);
  return JSON.stringify({ doors: items.length, total, soft, nearDoor: nd, near6, topOther });
})()
