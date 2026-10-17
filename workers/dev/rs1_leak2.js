// rs1_leak2.js — RS1: WHAT is the 20-px texture that a park / OFF cycle leaves registered but outside the scene?
(async () => {
  const out = { orph: [] }, sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r));
  const until = async (f, ms = 60000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f()) return true; await sl(100); } return false; };
  window.__rpPhone = true; const h = await window.__rpLoad('?v=' + Date.now()); const B = window.__bw, R = B.renderer, rp = window.__rp, S = rp.S;
  localStorage.removeItem('bw_rs_v1'); await h.start('elina'); await sl(1500); for (let i = 0; i < 3; i++) await raf(); h.exit(); await sl(500); await h.start('elina'); h.diet.CFG.down_ms = 1e9; await sl(1200); for (let i = 0; i < 3; i++) await raf(); const sis = h.sisters;
  const tap = (el) => { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 21, pointerType: 'touch' })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 21, pointerType: 'touch' })); };
  const swapTo = async (k) => { tap(document.querySelector('.rs-c[data-k=' + k + ']')); const ok = await until(() => S.key === k, 120000); await sl(300); await raf(); return ok; };
  let tx = null; B.scene.traverse((o) => { if (!tx && o.material) { const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.map) tx = m.map; } });
  let tp = Object.getPrototypeOf(tx); while (tp && !Object.prototype.hasOwnProperty.call(tp, 'updateMatrix')) tp = Object.getPrototypeOf(tp);
  const alive = new Map(), orig = tp.addEventListener; let on = true;
  tp.addEventListener = function (type, fn, ...r) { if (on && type === 'dispose' && !alive.has(this)) { alive.set(this, (new Error().stack || '').split('\n').slice(2, 7).map((s) => s.trim().replace(/https?:\/\/[^/]+/, '')).join(' < ')); orig.call(this, 'dispose', () => alive.delete(this)); } return orig.call(this, type, fn, ...r); };
  const used = () => { const ts = new Set(); B.scene.traverse((o) => { if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) { for (const k in m) { const v = m[k]; if (v && v.isTexture) ts.add(v); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) ts.add(v); } } }); return ts; };
  const far = [S.x - 40, S.z + 10]; rp.setPos(far[0] - 6, far[1] + 6, 0.3); await sl(500); for (let i = 0; i < 3; i++) await raf(); sis.setStand(false); await sl(300); for (let i = 0; i < 3; i++) await raf();
  for (let cyc = 0; cyc < 2; cyc++) {
    const a0 = new Set(alive.keys()); sis.setStand(true); for (const k of ['aylar', 'aylin']) await swapTo(k); for (let i = 0; i < 3; i++) await raf(); sis.setStand(false); await sl(300); for (let i = 0; i < 3; i++) await raf();
    const u = used(); out.orph.push([...alive.entries()].filter(([t]) => !a0.has(t) && !u.has(t)).map(([t, st]) => ({ ctor: t.constructor.name, name: t.name, w: t.image && t.image.width, h: t.image && t.image.height, imgType: t.image && t.image.constructor && t.image.constructor.name, isRT: !!t.isRenderTargetTexture, isData: !!t.isDataTexture, isCanvas: !!t.isCanvasTexture, uuid: t.uuid.slice(0, 8), stack: st })));
  }
  on = false; tp.addEventListener = orig; return JSON.stringify(out);
})()
