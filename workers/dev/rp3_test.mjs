// rp3_test.mjs — headless proof for the underworld hub (rpg_under.js): contract, layout, reachability, budget, determinism, dispose.
// No browser, no GL: three.js scene graph only (the canvas for the procedural textures is a stub). Library pieces are box stand-ins of the same size.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const BW = process.env.BW || '/home/claude/bot/bluebot_v2/bluewall';
const T = await import(pathToFileURL(BW + '/client/node_modules/three/build/three.module.js').href);
const noop = () => {}, ctx = new Proxy({}, { get: (t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : noop), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
const modPath = BW + '/web/assets/rpg/rpg_under.js';
const mod = await import(pathToFileURL(modPath).href + '?t=' + Date.now());
let fails = 0; const bad = (m) => { fails++; console.log('FAIL ' + m); }, ok = (m) => console.log('ok   ' + m);
const chk = (c, m) => (c ? ok(m) : bad(m));

const u = await mod.buildUnder(T, {});
// ---- contract used by rpg.js
chk(u.scene && u.scene.isObject3D, 'scene');
chk(typeof u.hgt === 'function' && Number.isFinite(u.hgt(0, 0)) && Number.isFinite(u.hgt(50, -30)), 'hgt(x,z) finite');
chk(Array.isArray(u.colliders) && u.colliders.length > 50 && u.colliders.every((c) => c.length === 3 && c.every(Number.isFinite) && c[2] > 0), 'colliders [x,z,r] (' + u.colliders.length + ')');
chk(typeof u.clampXZ === 'function' && Array.isArray(u.clampXZ(500, 0)) && Math.hypot(...u.clampXZ(500, 0)) <= u.BOUND + 1e-6, 'clampXZ holds the radius (' + u.BOUND + ')');
chk(u.portal && ['x', 'z', 'y', 'r'].every((k) => Number.isFinite(u.portal[k])), 'portal {x,z,y,r}');
chk(u.fill && u.fill.isPointLight, 'fill is a PointLight');
chk(u.spawn && ['x', 'z', 'yaw'].every((k) => Number.isFinite(u.spawn[k])), 'spawn {x,z,yaw}');
chk(['update', 'dispose', 'stats', 'setQuality'].every((k) => typeof u[k] === 'function'), 'update / dispose / stats / setQuality');
chk(u.regions && u.regions.length === 7, '7 region mouths (' + (u.regions || []).map((r) => r.key).join(',') + ')');
chk(!JSON.stringify(Object.keys(u)).match(/bot/i), 'no forbidden words in api');

// ---- walkability: the game's own rules (R_BODY 0.45, push-out, no climb steeper than 0.85 rise/run + 0.06, radial clamp)
const R_BODY = 0.45, CELL = 0.5, N = Math.ceil((u.BOUND + 2) / CELL), off = N * CELL;
const pushOut = (p, r) => { let moved = false; for (let it = 0; it < 3; it++) { let any = false; for (const [sx, sz, sr] of u.colliders) { const dx = p.x - sx, dz = p.z - sz, rr = sr + r, d2 = dx * dx + dz * dz; if (d2 >= rr * rr) continue; const d = Math.sqrt(d2) || 1e-4; p.x += (dx / d) * (rr - d); p.z += (dz / d) * (rr - d); any = true; } if (!any) break; moved = true; } return moved; };
const free = (x, z) => { const [cx, cz] = u.clampXZ(x, z); if (Math.abs(cx - x) > 1e-6 || Math.abs(cz - z) > 1e-6) return false; return !pushOut({ x, z }, R_BODY - 0.02); };
chk(free(u.spawn.x, u.spawn.z), 'spawn stands on free ground');
const W2 = 2 * N + 1, seen = new Uint8Array(W2 * W2), qx = [], qz = []; const ix = (x) => Math.round((x + off) / CELL);
const key = (i, j) => j * W2 + i; let reach = 0;
{ const si = ix(u.spawn.x), sj = ix(u.spawn.z); seen[key(si, sj)] = 1; qx.push(si); qz.push(sj);
  for (let h = 0; h < qx.length; h++) { const i = qx[h], j = qz[h], x = i * CELL - off, z = j * CELL - off, y = u.hgt(x, z); reach++;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= W2 || b >= W2 || seen[key(a, b)]) continue; const nx = a * CELL - off, nz = b * CELL - off; if (!free(nx, nz)) continue; const run = Math.hypot(nx - x, nz - z), rise = u.hgt(nx, nz) - y; if (rise > 0.85 * run + 0.06) continue; seen[key(a, b)] = 1; qx.push(a); qz.push(b); } } }
const reached = (x, z, tol) => { const R = Math.ceil(tol / CELL); for (let di = -R; di <= R; di++) for (let dj = -R; dj <= R; dj++) { const a = ix(x) + di, b = ix(z) + dj; if (a >= 0 && b >= 0 && a < W2 && b < W2 && seen[key(a, b)] && Math.hypot(di, dj) * CELL <= tol) return true; } return false; };
ok('walkable cells reached from the spawn: ' + reach + ' (' + Math.round(reach * CELL * CELL) + ' m²)');
chk(reached(u.portal.x, u.portal.z, u.portal.r + 0.8), 'the portal is reachable on foot');
for (const p of u.pois) { const tol = p.r || 3; chk(reached(p.x, p.z, Math.max(tol, 2.5)), 'reachable: ' + p.id); }
for (const g of u.regions) { const bx = g.x, bz = g.z; chk(reached(bx, bz, 4), 'mouth reachable: ' + g.key); }

// ---- budget: draw calls, triangles, distinct materials (a safe upper bound for shader programs)
const st = u.stats(); const mats = new Set(); u.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m)); });
const sig = new Set([...mats].map((m) => [m.type, !!m.vertexColors, !!m.map, !!m.transparent, m.blending, !!m.fog, m.side].join('|')));
console.log('numbers: calls=' + st.calls + ' tris=' + st.tris + ' materials=' + mats.size + ' program-signatures=' + sig.size + ' lights=' + st.lights + ' colliders=' + st.colliders);
chk(st.calls <= 150, 'draw calls ≤ 150'); chk(st.tris <= 400000, 'triangles ≤ 400k'); chk(sig.size <= 14, 'shader programs ≤ 14 (signature count)');
let lights = 0; u.scene.traverse((o) => { if (o.isLight) lights++; }); chk(lights === 3, 'exactly 3 lights (' + lights + ')');
let shadows = 0; u.scene.traverse((o) => { if (o.castShadow) shadows++; }); chk(shadows === 0, 'no shadow casters');
const perQ = []; for (const q of [0, 1, 2, 3]) { u.setQuality(q); perQ.push(u.stats().motes); } u.setQuality(0);
chk(perQ[0] > perQ[1] && perQ[1] > perQ[2] && perQ[2] > perQ[3], 'setQuality thins the motes: ' + perQ.join(' > '));

// ---- the frame loop: no throw, nothing grows, positions stay finite
const cam = new T.Vector3(); let geos0 = 0; u.scene.traverse((o) => { if (o.geometry) geos0++; });
for (let f = 0; f < 900; f++) { cam.set(Math.sin(f * 0.01) * 60, 3, Math.cos(f * 0.01) * 60); u.fill.position.set(cam.x, 4, cam.z); u.update(f / 60, 1 / 60, cam); }
let geos1 = 0, nanv = 0; u.scene.traverse((o) => { if (o.geometry) geos1++; if (o.isPoints) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 97) if (!Number.isFinite(a[i])) nanv++; } });
chk(geos0 === geos1 && nanv === 0, '900 frames: no new objects, no NaN');

// ---- determinism: a second build has the same layout
const u2 = await mod.buildUnder(T, {}); const h = (c) => c.reduce((s, q) => (s * 31 + Math.round(q[0] * 10) * 7 + Math.round(q[1] * 10) * 13 + Math.round(q[2] * 10)) % 1000003, 7);
chk(h(u.colliders) === h(u2.colliders) && u.colliders.length === u2.colliders.length, 'same layout on a second build');

// ---- dispose frees everything it made
const gl = new Set(), tx = new Set(), ml = new Set(); [u2].forEach((w) => w.scene.traverse((o) => { if (o.geometry) gl.add(o.geometry); (o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []).forEach((m) => { ml.add(m); for (const k in m) if (m[k] && m[k].isTexture) tx.add(m[k]); }); }));
let freed = 0; for (const x of [...gl, ...tx, ...ml]) x.addEventListener('dispose', () => freed++);
u2.dispose(); chk(freed >= gl.size + tx.size + ml.size, 'dispose frees ' + gl.size + ' geometries + ' + tx.size + ' textures + ' + ml.size + ' materials (' + freed + ' events)');

// ---- static rules on the source
const src = fs.readFileSync(modPath, 'utf8');
chk(!/\bbot\b/i.test(src) && !/ربات/.test(src), 'no «bot / ربات» in the module');
chk(!/keys\.env|OPENAI|TRIPO_API|api[_-]?key/i.test(src), 'no secret names in the module');
chk(!/[؀-ۿ]/.test(src.replace(/\/\/.*$/gm, '')), 'no Persian text in code (comments aside)');
chk(fs.statSync(modPath).size < 120000, 'module size ' + Math.round(fs.statSync(modPath).size / 1024) + ' KB');
let kb = 0; for (const f of fs.readdirSync(BW + '/web/assets/rpg/under')) kb += fs.statSync(BW + '/web/assets/rpg/under/' + f).size; chk(kb <= 3 * 1024 * 1024, 'under/ glb total ' + Math.round(kb / 1024) + ' KB ≤ 3 MB');

console.log(fails ? 'RP3 FAIL (' + fails + ')' : 'RP3 OK'); process.exit(fails ? 1 : 0);
