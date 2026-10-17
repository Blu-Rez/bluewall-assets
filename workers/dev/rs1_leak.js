// rs1_leak.js — RS1: WHICH geometry stays alive after a park / OFF cycle (hooks BufferGeometry 'dispose' registration; diff of the alive set).
//   python3 rp1c2_q.py -t rs1 evalf rs1_leak.js
(async () => {
  const out = { cycles: [] }, sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r));
  const until = async (f, ms = 60000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f()) return true; await sl(100); } return false; };
  window.__rpPhone = true; const h = await window.__rpLoad('?v=' + Date.now()); const B = window.__bw, R = B.renderer, rp = window.__rp, S = rp.S, T = B.THREE || null;
  localStorage.removeItem('bw_rs_v1'); await h.start('elina'); await sl(1500); for (let i = 0; i < 3; i++) await raf(); h.exit(); await sl(500); await h.start('elina'); h.diet.CFG.down_ms = 1e9; await sl(1200); for (let i = 0; i < 3; i++) await raf(); const sis = h.sisters;
  const tap = (el) => { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 21, pointerType: 'touch' })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 21, pointerType: 'touch' })); };
  const card = (k) => document.querySelector('.rs-f[data-k=' + k + ']');
  const mem = () => ({ tex: R.info.memory.textures, geo: R.info.memory.geometries });
  const swapTo = async (k) => { tap(card(k)); const ok = await until(() => S.key === k, 120000); await sl(300); await raf(); return ok; };
  // find the BufferGeometry prototype from a live geometry
  let g0 = null; B.scene.traverse((o) => { if (!g0 && o.geometry) g0 = o.geometry; }); let proto = Object.getPrototypeOf(g0); while (proto && !Object.prototype.hasOwnProperty.call(proto, 'computeVertexNormals')) proto = Object.getPrototypeOf(proto);   // (= BufferGeometry.prototype, not a subclass such as InstancedBufferGeometry)
  out.protoOk = !!proto;
  const alive = new Map(); const orig = proto.addEventListener; let hookOn = true;
  proto.addEventListener = function (type, fn, ...r) { if (hookOn && type === 'dispose' && !alive.has(this)) { alive.set(this, { stack: (new Error().stack || '').split('\n').slice(2, 5).map((s) => s.trim().replace(/https?:\/\/[^/]+/, '')).join(' < '), n: (this.attributes.position && this.attributes.position.count) || 0, idx: this.index ? this.index.count : 0 }); orig.call(this, 'dispose', () => alive.delete(this)); } return orig.call(this, type, fn, ...r); };
  const sceneHas = (g) => { let f = null; B.scene.traverse((o) => { if (o.geometry === g) f = o.name || o.type; }); return f; };
  const far = [S.x - 40, S.z + 10]; rp.setPos(far[0] - 6, far[1] + 6, 0.3); await sl(500); for (let i = 0; i < 3; i++) await raf();
  sis.setStand(false); await sl(300); for (let i = 0; i < 3; i++) await raf();
  const base = new Set(alive.keys());
  for (let cyc = 0; cyc < 3; cyc++) {
    const L0 = mem(), a0 = new Set(alive.keys()); sis.setStand(true);
    for (const k of ['aylar', 'aylin', 'melika', 'mobina']) { if (S.key === k) continue; await swapTo(k); }
    for (let i = 0; i < 3; i++) await raf(); const L1 = mem(); sis.setStand(false); await sl(300); for (let i = 0; i < 3; i++) await raf(); const L2 = mem();
    const left = [...alive.entries()].filter(([g]) => !a0.has(g)).map(([g, d]) => ({ n: d.n, idx: d.idx, inScene: sceneHas(g), type: g.type, stack: d.stack }));
    out.cycles.push({ L0, L1, L2, newAlive: left });
  }
  // control: nothing but time (and frames) passes at the same spot
  const C0 = mem(), c0 = new Set(alive.keys()); await sl(20000); for (let i = 0; i < 6; i++) await raf(); out.control = { before: C0, after: mem(), newAlive: [...alive.entries()].filter(([g]) => !c0.has(g)).map(([g, d]) => ({ n: d.n, inScene: sceneHas(g), type: g.type })) };
  hookOn = false; proto.addEventListener = orig; out.keyNow = S.key;
  return JSON.stringify(out);
})()
