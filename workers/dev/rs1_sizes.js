// rs1_sizes.js — RS1: what ONE resident sister costs, for each of the six (Stage A: stand OFF): triangles, joints, texture size, GPU estimate, geometry bytes.   python3 rp1c2_q.py -t rs1 evalf rs1_sizes.js
(async () => {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r)), S = window.__rp.S, B = window.__bw, h = window.__h, rows = [];
  window.__rpPhone = true; if (!h.active) await h.start('elina'); if (h.sisters.st.stand) h.sisters.setStand(false);
  for (const k of ['elina', 'elika', 'melika', 'mobina', 'aylin', 'aylar']) {
    if (S.key !== k) { const c = document.querySelector('.rs-c[data-k=' + k + ']'); c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 })); c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 })); for (let i = 0; i < 600 && S.key !== k; i++) await sl(100); await sl(300); await raf(); }
    let o = null; S.hero.model.traverse((x) => { if (x.isSkinnedMesh) { const g = x.geometry, m = x.material, im = m.map.image; let by = 0; for (const a in g.attributes) by += g.attributes[a].array.byteLength; if (g.index) by += g.index.array.byteLength; o = { k, tris: (g.index ? g.index.count : g.attributes.position.count) / 3, joints: x.skeleton.bones.length, tex: im.width + 'x' + im.height, texMB: +(im.width * im.height * 4 * 1.333 / 1048576).toFixed(1), geoMB: +(by / 1048576).toFixed(2), clips: S.hero.clips ? S.hero.clips.length : 0 }; } }); rows.push(o);
  }
  return JSON.stringify(rows);
})()
