// AN1_R3 A3 job 3 — LIVE sizes (instanced crowds): median instance scale per kind, x the model's natural standing height / back height (models.json) = the size the game draws now.
const R = window.__R3, B = __bw, W = B.world.ctx.wsLife, out = [];
const med = (a) => { a = a.filter((v) => v > 1e-3).sort((x, y) => x - y); return a.length ? [a[0], a[a.length >> 1], a[a.length - 1], a.length] : null; };
for (const [k, v] of Object.entries(W.kinds)) { const sc = med((v.instances || []).map((p) => p.scale)); out.push({ src: 'ws', kind: k, height: v.height || null, studyH: v.study && v.study.height || null, scale: sc, info: Object.keys(v.info || {}).slice(0, 4) }); }
(window.__pas.kinds || []).forEach((q, i) => { const sc = med((q.instances || []).map((p) => p.scale)); out.push({ src: 'pas', kind: i, keys: Object.keys(q).slice(0, 12), scale: sc, n: (q.instances || []).length }); });
const an = window.__pas.animals; const bykind = {}; for (const a of an) { (bykind[a.kind] = bykind[a.kind] || []).push(a.m && a.m.scale != null ? a.m.scale : null); }
out.push({ src: 'pas.animals', kinds: Object.fromEntries(Object.entries(bykind).map(([k, v]) => [k, med(v.filter((x) => x != null))])), HK: window.__pas.HK, size: window.__pas.HM && window.__pas.HM.size });
return out;
