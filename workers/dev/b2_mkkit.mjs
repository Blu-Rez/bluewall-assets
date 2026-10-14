// b2_mkkit.mjs RECIPE.mjs OUT.glb — the B2 house-kit packer (a copy of dev/p38/mkkit.mjs with two additions: COMPOSED pieces and per-material colour grading).
//   Run through dev/b2_build_kit.sh (it needs the @gltf-transform install in /tmp/claude-0/gt).
//   recipe item: { name, parts: [[srcKey, 'File', x, y, z, ryDeg, sx?, sy?, sz?], ...] | src: 'path.gltf',
//                  tris, err, keep: true (keep the composed origin: x,z = footprint centre, y = ground; no re-centring), s | w | h, grade: {'MI_Plaster': [r,g,b] | '#hex'}, flat: {'MI_RoundTiles': '#b4553a'} }
//   Everything ends as vertex colours on ONE flat material (no textures, +0 programs, 1 draw call per batch): the textured source materials are sampled at their vertices (like mkkit),
//   `grade` multiplies the sampled colour, `flat` replaces the texture by a plain colour (with a faint per-vertex noise so big planes do not look like plastic).
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { metalRough, dedup, prune, weld, unweld, normals, simplify, join, meshopt, quantize, getBounds, flatten, mergeDocuments } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const recipePath = process.argv[2], out = process.argv[3];
const RC = (await import(recipePath)).default; const SRC = RC.sources, items = RC.items;
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const kit = new Document(); const kbuf = kit.createBuffer('b'); const kscene = kit.createScene('kit'); kit.getRoot().setDefaultScene(kscene);

const s2l = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const hex2lin = (h) => { const n = parseInt(h.slice(1), 16); return [s2l(((n >> 16) & 255) / 255), s2l(((n >> 8) & 255) / 255), s2l((n & 255) / 255)]; };
const imgCache = new Map();
async function decode(tex) {
  if (imgCache.has(tex)) return imgCache.get(tex);
  const r = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const o = { w: r.info.width, h: r.info.height, d: r.data }; imgCache.set(tex, o); return o;
}
function sample(img, u, v) {
  u = u - Math.floor(u); v = v - Math.floor(v); const x = u * (img.w - 1), y = v * (img.h - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(img.w - 1, x0 + 1), y1 = Math.min(img.h - 1, y0 + 1), fx = x - x0, fy = y - y0;
  const o = [0, 0, 0, 0]; for (let c = 0; c < 4; c++) { const a = img.d[(y0 * img.w + x0) * 4 + c], b = img.d[(y0 * img.w + x1) * 4 + c], d = img.d[(y1 * img.w + x0) * 4 + c], e = img.d[(y1 * img.w + x1) * 4 + c]; o[c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy; }
  return o;
}
const noise = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
// the glass and the cloth are opaque here (one material for the whole kit): glass = a dusky blue pane
const GLASS = hex2lin('#4a6c96');

async function flatMats(doc, grade = {}, flat = {}, lift = 1, mul = 1) {
  const mk = new Map(); const get = (ds) => { if (!mk.has(ds)) mk.set(ds, doc.createMaterial(ds ? 'flatDS' : 'flat').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.88).setMetallicFactor(0).setDoubleSided(ds)); return mk.get(ds); };
  let n = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
    const mt = p.getMaterial(); if (!mt) continue; const nm = mt.getName() || '';
    const tex = mt.getBaseColorTexture();
    const pos = p.getAttribute('POSITION'); if (!pos) continue; const cnt = pos.getCount(), bf = mt.getBaseColorFactor(), old = p.getAttribute('COLOR_0'), arr = new Float32Array(cnt * 4);
    const isGlass = /Glass/i.test(nm), fl = Object.keys(flat).find((k) => nm.includes(k)), gk = Object.keys(grade).find((k) => nm.includes(k));
    let g = gk !== undefined ? grade[gk] : [1, 1, 1]; if (typeof g === 'string') g = hex2lin(g);
    let img = null, uv = null; if (tex && !isGlass && !fl) { img = await decode(tex); uv = p.getAttribute('TEXCOORD_' + (mt.getBaseColorTextureInfo().getTexCoord() || 0)); if (!uv) continue; }
    const fc = fl ? hex2lin(flat[fl]) : null, P = [0, 0, 0];
    for (let i = 0; i < cnt; i++) {
      const o = old ? old.getElement(i, []) : [1, 1, 1, 1]; let r = 1, gg = 1, b = 1;
      if (isGlass) { [r, gg, b] = GLASS; }
      else if (fl) { pos.getElement(i, P); const k = 1 + (+(process.env.NOISE ?? 0.12)) * (noise(Math.round(P[0] * 4), Math.round(P[1] * 4), Math.round(P[2] * 4)) - 0.5); r = fc[0] * k; gg = fc[1] * k; b = fc[2] * k; }
      else if (img) { const t = uv.getElement(i, []); const c = sample(img, t[0], t[1]); r = s2l(c[0] / 255); gg = s2l(c[1] / 255); b = s2l(c[2] / 255); }
      arr[i * 4] = mul * Math.pow(o[0] * bf[0] * r * g[0], lift); arr[i * 4 + 1] = mul * Math.pow(o[1] * bf[1] * gg * g[1], lift); arr[i * 4 + 2] = mul * Math.pow(o[2] * bf[2] * b * g[2], lift); arr[i * 4 + 3] = 1;
    }
    p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC4').setArray(arr).setBuffer(doc.getRoot().listBuffers()[0]));
    p.setMaterial(get(false)); n++;                                          // ONE material for the whole kit (village.js bakePieces forces FrontSide on it anyway)
  }
  return n;
}
// keep whole loose parts (beams, bars) instead of thinning them into shards: the biggest connected components of the primitive (by bounding-box diagonal) that fit the triangle budget
function keepComponents(p, budget) {
  const idx = p.getIndices().getArray(), pos = p.getAttribute('POSITION').getArray(), nv = pos.length / 3, canon = new Int32Array(nv), ids = new Map();
  for (let i = 0; i < nv; i++) { const k = Math.round(pos[i * 3] * 1e4) + ',' + Math.round(pos[i * 3 + 1] * 1e4) + ',' + Math.round(pos[i * 3 + 2] * 1e4); if (!ids.has(k)) ids.set(k, ids.size); canon[i] = ids.get(k); }
  const par = new Int32Array(ids.size).map((_, i) => i), find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  for (let t = 0; t < idx.length; t += 3) { const a = find(canon[idx[t]]), b = find(canon[idx[t + 1]]), c = find(canon[idx[t + 2]]); par[b] = a; par[find(c)] = find(a); }
  const comp = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    const r = find(canon[idx[t]]); let c = comp.get(r); if (!c) comp.set(r, c = { t: [], mn: [1e9, 1e9, 1e9], mx: [-1e9, -1e9, -1e9] });
    c.t.push(t); for (let k = 0; k < 3; k++) { const v = idx[t + k]; for (let a = 0; a < 3; a++) { const x = pos[v * 3 + a]; if (x < c.mn[a]) c.mn[a] = x; if (x > c.mx[a]) c.mx[a] = x; } }
  }
  const list = [...comp.values()].map((c) => ({ ...c, d: Math.hypot(c.mx[0] - c.mn[0], c.mx[1] - c.mn[1], c.mx[2] - c.mn[2]) })).sort((a, b) => b.d - a.d);
  const out = []; let n = 0;
  for (const c of list) { if (n + c.t.length > budget) continue; n += c.t.length; for (const t of c.t) out.push(idx[t], idx[t + 1], idx[t + 2]); }
  return Uint32Array.from(out);
}
const resolve = (key, file) => { const t = SRC[key]; if (!t) throw new Error('unknown source ' + key); return t.replace('%', file); };
const report = [];
for (const it of items) {
  if (only && !only.test(it.name)) continue;
  try {
    let doc; const partStat = {};
    if (it.parts) {
      doc = new Document(); doc.createBuffer('b'); const sc0 = doc.createScene('s'); doc.getRoot().setDefaultScene(sc0);
      for (const [key, file, x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = sx, sz = sx, plim] of it.parts) {
        const pd = await io.read(resolve(key, file));
        const lim = plim || (it.partLimit ? it.partLimit(file) : RC.partLimit ? RC.partLimit(file) : null);          // plim: a limit given on the part itself (e.g. the street gable is finer than the back one)                 // heavy source pieces (round-tile roofs 2-6 k tris, brick corners 3 k) are thinned one by one first
        if (lim) {
          await pd.transform(flatten(), weld());
          let n0 = 0; for (const m of pd.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); n0 += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
          if (lim.mat) {                                                   // per material: e.g. a gable keeps its plaster fill whole and only the timber truss is thinned ({ mat: { MI_WoodTrim: 40 } }, 0 = dropped)
            for (const m of pd.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
              const nm = p.getMaterial()?.getName() || '', key = Object.keys(lim.mat).find((k) => nm.includes(k)); if (key === undefined) continue;
              const spec = lim.mat[key], tgt = typeof spec === 'object' ? spec.n : spec, comp = lim.comp || (typeof spec === 'object' && spec.comp), idx = p.getIndices(), n = idx.getCount() / 3; if (n <= tgt) continue;
              if (tgt === 0) { idx.setArray(new Uint32Array(0)); continue; }
              if (comp) { idx.setArray(keepComponents(p, tgt)); continue; }
              const pos = p.getAttribute('POSITION').getArray(), ia = Uint32Array.from(idx.getArray());
              const [ni] = lim.sloppy === false ? MeshoptSimplifier.simplify(ia, pos, 3, tgt * 3, lim.err ?? 0.3) : MeshoptSimplifier.simplifySloppy(ia, pos, 3, null, tgt * 3, lim.err ?? 0.3);
              idx.setArray(ni);
            }
          } else if (n0 > lim.tris) {
            const SL = Object.create(MeshoptSimplifier); SL.simplify = (ind, pos, stride, target, err) => MeshoptSimplifier.simplifySloppy(ind, pos, stride, null, target, err);
            await pd.transform(simplify({ simplifier: lim.sloppy === false ? MeshoptSimplifier : SL, ratio: Math.max(0.01, lim.tris / n0), error: lim.err ?? 0.3, lockBorder: false }));
          }
        }
        { let n1 = 0; for (const m of pd.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); n1 += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; } const e = (partStat[file] ||= { n: 0, each: Math.round(n1) }); e.n++; }
        const map = mergeDocuments(doc, pd), ssc = map.get(pd.getRoot().listScenes()[0]);
        const holder = doc.createNode(file), a = ry * Math.PI / 180;
        holder.setTranslation([x, y, z]).setRotation([0, Math.sin(a / 2), 0, Math.cos(a / 2)]).setScale([sx, sy, sz]);
        for (const ch of ssc.listChildren()) { ssc.removeChild(ch); holder.addChild(ch); }
        sc0.addChild(holder); ssc.dispose();
      }
    } else doc = await io.read(it.src);
    for (const a of doc.getRoot().listAnimations()) a.dispose();
    for (const s of doc.getRoot().listSkins()) s.dispose();
    await doc.transform(metalRough(), flatten(), dedup(), prune());
    let tris = 0; const cnt = () => { tris = 0; for (const n of doc.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue; for (const p of m.listPrimitives()) { const i = p.getIndices(); tris += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; } } return tris; };      // (per NODE: an instanced piece counts every time it is placed)
    cnt(); const tris0 = tris;
    if (process.env.PARTS) console.log(it.name, Object.entries(partStat).map(([k, v]) => `${k} x${v.n} @${v.each}=${v.n * v.each}`).sort((a, b) => +b.split('=')[1] - +a.split('=')[1]).slice(0, 14).join(' | '), ' SUM', Object.values(partStat).reduce((a, v) => a + v.n * v.each, 0));
    if (it.tris && tris > it.tris) {                                        // (a final global pass only for items that are still over their target; the parts were thinned above)
      await doc.transform(weld(), join({ keepMeshes: false, keepNamed: false }));
      const SL = Object.create(MeshoptSimplifier); SL.simplify = (ind, pos, stride, target, err) => MeshoptSimplifier.simplifySloppy(ind, pos, stride, null, target, err);
      await doc.transform(simplify({ simplifier: it.sloppy ? SL : MeshoptSimplifier, ratio: Math.max(0.02, it.tris / tris), error: it.err || 0.04, lockBorder: false }));
    }
    cnt();
    await flatMats(doc, it.grade || {}, it.flat || {}, it.lift || 1, it.mul || 1); await doc.transform(prune());
    await doc.transform(flatten(), join({ keepMeshes: false, keepNamed: false }), prune());                // ONE mesh / ONE primitive per body (338 nodes + 223 accessors were 150 KB of JSON)
    if (it.smooth !== true) await doc.transform(unweld(), normals({ overwrite: true }), weld());          // flat shading: clean creases at the roof ridges (clustering leaves stale smooth normals), identical vertices merge again
    const sc = doc.getRoot().listScenes()[0];
    const b = getBounds(sc), sz = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
    let s = it.s || 1, tr;
    if (it.keep) tr = [0, 0, 0];
    else {
      const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2, y0 = it.anchor === 'center' ? (b.min[1] + b.max[1]) / 2 : b.min[1];
      s = it.s || (it.h ? it.h / sz[1] : it.d ? it.d / sz[2] : it.w ? it.w / Math.max(sz[0], sz[2]) : 1); tr = [-cx * s, -y0 * s, -cz * s];
    }
    const map = mergeDocuments(kit, doc); const src = map.get(sc); if (!src) throw new Error('merge produced no scene');
    const holder = kit.createNode(it.name), inner = kit.createNode(it.name + '_n');
    inner.setScale([s, s, s]).setTranslation(tr);
    for (const ch of src.listChildren()) { src.removeChild(ch); inner.addChild(ch); }
    holder.addChild(inner); kscene.addChild(holder); src.dispose();
    report.push({ name: it.name, tris0: Math.round(tris0), tris: Math.round(tris), size: sz.map((v) => +(v * s).toFixed(2)), min: b.min.map((v) => +(v * s).toFixed(2)), max: b.max.map((v) => +(v * s).toFixed(2)) });
  } catch (e) { report.push({ name: it.name, error: String(e.stack || e).slice(0, 300) }); }
}
for (const b of kit.getRoot().listBuffers()) if (b !== kbuf) { for (const a of kit.getRoot().listAccessors()) if (a.getBuffer() === b) a.setBuffer(kbuf); b.dispose(); }
for (const a of kit.getRoot().listAccessors()) a.setBuffer(kbuf);
await kit.transform(dedup(), prune(), quantize({ quantizePosition: +(process.env.QP || 13), quantizeNormal: +(process.env.QN || 8), quantizeColor: +(process.env.QC || 8) }), meshopt({ encoder: MeshoptEncoder, level: process.env.LEVEL || 'high' }));
await io.write(out, kit);
console.log(JSON.stringify(report.filter((r) => r.error), null, 1)); console.log('pieces', report.filter((r) => !r.error).length, 'errors', report.filter((r) => r.error).length, 'bytes', fs.statSync(out).size);
fs.writeFileSync((process.env.REPORT_DIR || '/home/claude/work') + '/' + out.split('/').pop().replace(/\.glb$/, '.report.json'), JSON.stringify(report, null, 1));
