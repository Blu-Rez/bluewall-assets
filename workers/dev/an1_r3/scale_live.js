// AN1_R3 A3 job 3 — LIVE sizes after the rescale (body of an async fn for an1_r3_page.py): reads the real instances of the running game.
//   instanced crowds (villagers, pasture / yard animals, worksite cows / horses / sheep / pigs): the instance matrix scale x the geometry's bind-pose box (the same pose the models.json numbers use);
//   groups (knights, dogs, wolves): Box3.setFromObject(precise) of the posed skinned meshes.
const R = window.__R3, THREE = R.THREE, B = __bw, W = B.world.ctx.wsLife, out = { instanced: [], groups: [] };
const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
const describe = (label, root) => {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isInstancedMesh || !o.count) return;
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; const sc = [];
    for (let i = 0; i < Math.min(o.count, 400); i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); if (s.y > 1e-3) sc.push(+s.y.toFixed(4)); if (sc.length >= 400) break; }
    if (!sc.length) return; sc.sort((a, b) => a - b); const med = sc[sc.length >> 1];
    out.instanced.push({ group: label, name: o.name || (o.parent && o.parent.name) || '?', count: o.count, scaleMed: med, scaleMin: sc[0], scaleMax: sc[sc.length - 1], bind: [+(bb.max.x - bb.min.x).toFixed(3), +(bb.max.y - bb.min.y).toFixed(3), +(bb.max.z - bb.min.z).toFixed(3)], minY: +bb.min.y.toFixed(3), heightLive: +((bb.max.y - bb.min.y) * med).toFixed(3), parentScale: +(o.parent ? o.parent.getWorldScale(new THREE.Vector3()).y : 1).toFixed(3) });
  });
};
for (const [k, v] of Object.entries(W.kinds)) if (v.group) describe('ws:' + k + (v.height ? ' (h=' + v.height + ')' : ''), v.group);
(window.__pas.kinds || []).forEach((q, i) => q.group && describe('pas:kind' + i, q.group));
const box = (o) => new THREE.Box3().setFromObject(o, true);
const hb = (o) => { const b = box(o); return { h: +(b.max.y - b.min.y).toFixed(3), minY: +b.min.y.toFixed(3), len: +Math.max(b.max.x - b.min.x, b.max.z - b.min.z).toFixed(3) }; };
(window.__knights || []).forEach((k, i) => { k.root.updateMatrixWorld(true); const all = hb(k.root); out.groups.push({ kind: 'knight', i, ...all, rootScale: +k.root.scale.y.toFixed(3), name: k.name }); });
for (const kk of ['dogs', 'wolves']) (window.__herds[kk].list || []).forEach((c, i) => { c.root.updateMatrixWorld(true); out.groups.push({ kind: kk, i, ...hb(c.root), rootScale: +c.root.scale.y.toFixed(3) }); });
return out;
