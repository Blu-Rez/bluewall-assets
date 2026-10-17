// rs1_meas.js — RS1: the hero-mode budget (calls / triangles / memory) in the real game page.   run:  python3 rp1c2_q.py -t rs1 evalf rs1_meas.js     (set window.__rs1Key / __rs1Pre = async(h)=>{} before, optional)
// phone emulation (__rpPhone), the governor pinned at its START level (so the numbers are the ones a phone starts with), main pass + the whole frame (shadow pass included) counted separately.
(async () => {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r));
  window.__rpPhone = true; const KEY = window.__rs1Key || 'elina';
  const h = await window.__rpLoad('?v=' + Date.now()); window.__h = h; const rp = window.__rp, B = window.__bw, R = B.renderer, sc = B.scene, cam = B.camera;
  const t0 = performance.now(); await h.start(KEY); const startMs = Math.round(performance.now() - t0);
  const D = h.diet; D.CFG.down_ms = 1e9; D.CFG.up_ms = 0; D.CFG.up_win = 1e9;   // the governor is frozen where it started
  if (window.__rs1Pre) await window.__rs1Pre(h);
  rp.S.paused = false; for (let i = 0; i < 8; i++) await raf(); await sl(2500);
  const out = { key: KEY, startMs, lvl: D.info() };
  // (1) the whole frame, as the in-game readout counts it: renderer.info over ONE rendered frame (autoReset is off in hero mode: perfTick resets it)
  const frames = []; for (let i = 0; i < 6; i++) { await raf(); const p = rp.perf(); frames.push([p.calls, p.tris]); }
  out.frame = { calls: frames.map((f) => f[0]), tris: frames.map((f) => f[1]) };
  // (2) the main pass alone (the shadow map is not redrawn)
  const sm = R.shadowMap, s0 = [sm.autoUpdate, sm.needsUpdate]; sm.autoUpdate = false; sm.needsUpdate = false; const ar = R.info.autoReset; R.info.autoReset = false; R.info.reset(); R.render(sc, cam);
  out.main = { calls: R.info.render.calls, tris: R.info.render.triangles }; sm.autoUpdate = s0[0]; sm.needsUpdate = s0[1]; R.info.autoReset = ar;
  // (3) memory: three's counters + the textures / geometry that belong to hero models (GPU estimate: w*h*4 * 1.33 mip chain) + the JS heap
  const m = R.info.memory; out.mem = { geometries: m.geometries, textures: m.textures, programs: (R.info.programs || []).length };
  const seen = new Set(); let texB = 0, geoB = 0, nTex = 0, skins = 0, tris = 0;
  const addTex = (t) => { if (!t || seen.has(t.uuid)) return; seen.add(t.uuid); const im = t.image; const w = (im && (im.width || im.videoWidth)) || 0, hh = (im && (im.height || im.videoHeight)) || 0; texB += w * hh * 4 * (t.generateMipmaps === false ? 1 : 1.333); nTex++; };
  sc.traverse((o) => { if (!(o.isMesh || o.isSkinnedMesh) || !o.geometry) return; let hero = false; for (let p = o; p; p = p.parent) if (p.userData && p.userData.rpHero) { hero = true; break; } if (!o.isSkinnedMesh || !hero) return; skins++;
    const g = o.geometry; for (const k in g.attributes) geoB += g.attributes[k].array.byteLength; if (g.index) geoB += g.index.array.byteLength; tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    for (const mt of Array.isArray(o.material) ? o.material : [o.material]) for (const k in mt) { const t = mt[k]; if (t && t.isTexture) addTex(t); }
    if (o.skeleton && o.skeleton.boneTexture) addTex(o.skeleton.boneTexture); });
  out.heroes = { skinnedMeshes: skins, tris: Math.round(tris), textures: nTex, texMB: +(texB / 1048576).toFixed(1), geoMB: +(geoB / 1048576).toFixed(1) };
  out.models = Object.keys(h.dev.S.models); out.heapMB = performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null;
  out.calls_seen = h.dev.perf().calls; return JSON.stringify(out);
})()
