// rp1c2_census.js — RP1C-R2 Job 3: WHICH meshes are drawn at a hero view (main pass): name path, draw calls, triangles — the "leftover meshes" list of the report.  Run inside the game page (hero started).
//   usage: evaluate "(async()=>{ const VIEW='gate'; <this file> })()"   (VIEW: gate | fields | mill)   — returns JSON { total:{calls,tris}, info:{calls,tris}, top:[{path,n,calls,tris}...], groups:[...] }
const rp = __rp, S = rp.S, B = __bw, R = B.renderer, sc = B.scene, cam = B.camera, T = S.pivot.constructor === undefined ? null : null;
const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57], mill: null };
const raf = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
rp.pause(true); S.cool = 99; if (views[VIEW]) rp.setPos(views[VIEW][0], views[VIEW][1], views[VIEW][2]); else rp.goNear('ws:mill_wind2', 4); rp.sim(0.3);
for (let i = 0; i < 3; i++) await raf(); await wait(2500);
const sm = R.shadowMap, sm0 = [sm.autoUpdate, sm.needsUpdate]; sm.autoUpdate = false; sm.needsUpdate = false; R.info.autoReset = false; R.info.reset(); R.render(sc, cam);
const info = { calls: R.info.render.calls, tris: R.info.render.triangles }; sm.autoUpdate = sm0[0]; sm.needsUpdate = sm0[1]; R.info.autoReset = true;
// our own count with three's rules: visible chain, layers, frustum (bounding sphere), instanced count, groups
const C = cam.constructor, M4 = cam.projectionMatrix.constructor, F = Object.getPrototypeOf(cam.projectionMatrix).constructor && null;
cam.updateMatrixWorld(); const pm = new M4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
const planes = (() => { const e = pm.elements, p = []; const mk = (a, b, c, d) => { const l = Math.hypot(a, b, c); return [a / l, b / l, c / l, d / l]; };
  p.push(mk(e[3] - e[0], e[7] - e[4], e[11] - e[8], e[15] - e[12]), mk(e[3] + e[0], e[7] + e[4], e[11] + e[8], e[15] + e[12]), mk(e[3] + e[1], e[7] + e[5], e[11] + e[9], e[15] + e[13]), mk(e[3] - e[1], e[7] - e[5], e[11] - e[9], e[15] - e[13]), mk(e[3] - e[2], e[7] - e[6], e[11] - e[10], e[15] - e[14]), mk(e[3] + e[2], e[7] + e[6], e[11] + e[10], e[15] + e[14])); return p; })();
const inFrustum = (o) => { const g = o.geometry; if (!g) return true; if (!g.boundingSphere) g.computeBoundingSphere(); const bs = g.boundingSphere; if (!bs) return true; const c = bs.center.clone().applyMatrix4(o.matrixWorld), sx = o.matrixWorld.getMaxScaleOnAxis(), r = bs.radius * sx;
  if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere && o.computeBoundingSphere(); const ib = o.boundingSphere; if (ib) { const c2 = ib.center.clone().applyMatrix4(o.matrixWorld); for (const p of planes) if (p[0] * c2.x + p[1] * c2.y + p[2] * c2.z + p[3] < -ib.radius * sx) return false; return true; } }
  for (const p of planes) if (p[0] * c.x + p[1] * c.y + p[2] * c.z + p[3] < -r) return false; return true; };
const rows = new Map(); let calls = 0, tris = 0;
const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
sc.traverseVisible((o) => {
  if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite) || !o.geometry && !o.isSprite) return; if (o.userData && o.userData.rpHero) { /* her own meshes count too */ }
  let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) { vis = false; break; } if (!vis) return;
  if (o.frustumCulled !== false && !inFrustum(o)) return;
  const g = o.geometry; if (!g) return; const idx = g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0, mats = Array.isArray(o.material) ? o.material.filter(Boolean).length : 1;
  let t = (idx / 3) * (o.isInstancedMesh ? o.count : 1), c = o.isInstancedMesh ? (o.count > 0 ? 1 : 0) : 1; if (o.isInstancedMesh && o.count < 1) return; if (g.groups && g.groups.length > 1 && Array.isArray(o.material)) { c = g.groups.length; t = g.groups.reduce((s, q) => s + q.count / 3, 0) * (o.isInstancedMesh ? o.count : 1); }
  if (o.isPoints || o.isLine) t = 0;
  const key = pathOf(o); const e = rows.get(key) || { path: key, n: 0, calls: 0, tris: 0, inst: 0 }; e.n++; e.calls += c; e.tris += t; if (o.isInstancedMesh) e.inst += o.count; rows.set(key, e); calls += c; tris += t;
});
const list = [...rows.values()].sort((a, b) => b.tris - a.tris);
// groups by the first two path segments
const grp = new Map(); for (const e of list) { const k = e.path.split('>').slice(0, 2).join('>'); const g = grp.get(k) || { group: k, calls: 0, tris: 0, meshes: 0 }; g.calls += e.calls; g.tris += e.tris; g.meshes += e.n; grp.set(k, g); }
rp.pause(false);
return JSON.stringify({ view: VIEW, info, own: { calls, tris: Math.round(tris) }, top: list.slice(0, 40).map((e) => ({ path: e.path.slice(0, 150), n: e.n, calls: e.calls, tris: Math.round(e.tris), inst: e.inst })), groups: [...grp.values()].sort((a, b) => b.tris - a.tris).slice(0, 25).map((g) => ({ ...g, tris: Math.round(g.tris) })) });
