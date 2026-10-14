import json, sys
# mk_bench.py MODE OUT.json : MODE = base | bisect
MODE = sys.argv[1]; OUT = sys.argv[2]
INIT = r'''
window.__bwFixDyn = true;
window.__meas = async (N, warm=3) => {
  const nf = (k) => new Promise(res => { const f0 = __bw.frames; const iv = setInterval(() => { if (__bw.frames >= f0 + k) { clearInterval(iv); res(); } }, 30); });
  await nf(warm);
  const r = __bw.renderer, info = r.info; info.autoReset = false; info.reset();
  const P = window.__bwProf; P.on = true; for (const k in P.avg) delete P.avg[k]; P.frames = 0;
  const f0 = __bw.frames, t0 = performance.now(); await nf(N);
  const n = __bw.frames - f0, ms = (performance.now() - t0) / n;
  const out = { frame_ms: Math.round(ms), calls: Math.round(info.render.calls / n), tris: Math.round(info.render.triangles / n), pts: Math.round(info.render.points / n), geos: info.memory.geometries, tex: info.memory.textures, prog: info.programs.length, night: +__bw.P().night.toFixed(2), dpr: +r.getPixelRatio().toFixed(2) };
  let tot = 0; const js = {}; for (const k in P.avg) { js[k] = +P.avg[k].toFixed(2); tot += P.avg[k]; } out.js_total = +tot.toFixed(1); out.js = js; P.on = false; return out;
};
const find = (fn) => { const a = []; __bw.scene.traverse(o => { if (fn(o)) a.push(o); }); return a; };
const hideSet = (arr) => { const old = arr.map(o => o.visible); arr.forEach(o => o.visible = false); return () => arr.forEach((o, i) => o.visible = old[i]); };
window.__tg = {
  refl: () => { const o = __bw.refl.update; __bw.refl.update = () => {}; return () => { __bw.refl.update = o; }; },
  shadowpass: () => { const sm = __bw.renderer.shadowMap; Object.defineProperty(sm, 'needsUpdate', { configurable: true, get() { return false; }, set() {} }); return () => { delete sm.needsUpdate; sm.needsUpdate = true; }; },
  rain: () => hideSet(find(o => o.isMesh && o.geometry && o.geometry.isInstancedBufferGeometry && o.geometry.instanceCount >= 2500)),
  splash: () => hideSet(find(o => o.isPoints && o.geometry.attributes.aPh)),
  skinned: () => hideSet(find(o => o.isSkinnedMesh)),
  instanced: () => hideSet(find(o => o.isInstancedMesh)),
  transparent: () => hideSet(find(o => o.isMesh && o.material && !Array.isArray(o.material) && o.material.transparent)),
  points: () => hideSet(find(o => o.isPoints)),
  lights: () => hideSet(find(o => o.isLight && !o.isAmbientLight && !o.isHemisphereLight && !o.isDirectionalLight)),
  dpr70: () => { const o = __bw.renderer.getPixelRatio(); __bw.renderer.setPixelRatio(o * 0.7); return () => __bw.renderer.setPixelRatio(o); },
  alwayshidden_ui: () => { const e = document.querySelector('#game > div'); return () => {}; },
};
return 'init';
'''
steps = [{"name": "init", "shot": False, "frames": 1, "js": INIT}]
def meas(name, setup="", undo="", N=4):
    js = (setup + "\n" if setup else "") + f"const r = await window.__meas({N}); {undo} return r;"
    steps.append({"name": name, "shot": False, "frames": 1, "js": js})
if MODE == "base":
    meas("home_clear", "")
    meas("zoomout345", "const c=__bw.ctl; window.__d0=c.dist; c.minD=60; c.maxD=345; c._portrait=true; c.dist=345;")
    meas("home_storm", "const c=__bw.ctl; c.dist=window.__d0; __bw.world.setWeather('storm', true);")
    meas("storm_zoomout", "const c=__bw.ctl; c.dist=345;")
else:
    # bisect: current state is whatever URL/weather gave; run baseline then each toggle
    setup = "__bw.world.setWeather('%s', true);" % (sys.argv[3] if len(sys.argv) > 3 else 'clear')
    meas("BASE", setup, N=5)
    for k in ["refl", "shadowpass", "rain", "splash", "skinned", "instanced", "transparent", "points", "lights", "dpr70"]:
        meas("-" + k, f"window.__u = window.__tg['{k}']();", "window.__u();", N=4)
    meas("BASE2", "", N=4)
json.dump(steps, open(OUT, "w"))
