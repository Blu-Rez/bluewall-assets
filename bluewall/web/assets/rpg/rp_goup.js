// RP1C-R3 — ROUND4 A1 item 7: «Go up» markers at the foot of every walkable way up (the ramps to the wall-walk, ramps.js).
//   · IN THE WORLD, within 30 m of the hero: a glass-disc icon with an arrow ↑ floating over the foot of the ramp (the style of the door icons: dark glass, a coloured rim, a white glyph) and a soft light column rising out of the
//     ground under it.  Both are THREE.Points (ONE call each, up to 24 icons + 24 x 9 glow points): a PointsMaterial with a map, size attenuation, fog, transparent, no depth write = the very parameters of the door orbs (doors.js)
//     = the SAME shader program: +0 programs.  No real light, no instancing (an InstancedMesh is a different program), no per-frame allocation.
//   · HUD: when no marker is on the screen (none within 30 m in front of the camera) a small chip at the top centre points to the NEAREST way up (a compass arrow turned to its screen direction + the distance in metres).
//   · PROMPT: standing at the foot (< 3 m, on the ground) a pill «Go up» with the arrow appears above the controls; it goes when she is on the ramp.
// Everything is created at enter() and removed at exit() (nothing in the boot bundle, nothing when the hero is off).
export const RANGE = 30, FOOT_R = 3.0, COL_N = 14, COL_DY = 0.24, ICON_Y = 3.3, ICON_PX = 44;
const MINT = 0x8ff0ff;
const STYLE = (top, btm) => `.rp-gu{position:absolute;pointer-events:none;z-index:41;font:600 13px/1 system-ui,sans-serif;color:#eaffff;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.rp-gu-chip{left:50%;top:calc(${top} + 62px);width:58px;height:58px;margin-left:-29px;display:none;align-items:center;justify-content:center;flex-direction:column;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(70,104,138,.93),rgba(9,20,38,.94));border:3px solid #8ff0ff;box-shadow:0 0 14px rgba(143,240,255,.55)}
.rp-gu-chip svg{width:30px;height:30px;stroke:#fff;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.rp-gu-chip i{position:absolute;bottom:-17px;font-style:normal;font-size:12px;white-space:nowrap}
.rp-gu-pill{left:50%;bottom:calc(${btm} + 34px);transform:translateX(-50%);display:none;align-items:center;gap:8px;padding:10px 18px 10px 12px;border-radius:26px;background:rgba(9,20,38,.82);border:2px solid #8ff0ff;box-shadow:0 0 14px rgba(143,240,255,.45);font-size:16px}
.rp-gu-pill svg{width:24px;height:24px;stroke:#8ff0ff;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}`;
const ARROW = 'M12 19V5M5.5 11.5L12 5l6.5 6.5';

export function createGoUp(H, S, G = {}) {
  const T = H.THREE, camera = H.camera, scene = H.scene;
  const st = { on: false, n: 0, near: -1, nearD: 0, vis: 0, prompt: false, chip: false, ms: 0, feet: [], styled: false };
  const grp = new T.Group(); grp.name = 'rp-goup'; grp.userData.rpHero = true;
  let glowTex = null, iconTex = null, icons = null, cols = null, chip = null, chipSvg = null, chipTxt = null, pill = null, styleEl = null;
  const v = new T.Vector3(), v2 = new T.Vector2(); const MAXI = 24;

  function makeGlow() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,0.9)'); rg.addColorStop(0.35, 'rgba(255,255,255,0.55)'); rg.addColorStop(0.7, 'rgba(255,255,255,0.14)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function makeIcon() {                                                                                   // the door icons' look: dark glass disc, coloured rim, glass highlight, a white glyph
    if (G.ui) return G.ui.worldIcon(T);                                                                   // UI2: the blue / silver icon of rp_ui2.js (navy plate, silver bezel, ice arrow); same Points, same program
    const C = 128, cv = document.createElement('canvas'); cv.width = cv.height = C; const g = cv.getContext('2d'), cx = C / 2, cy = C / 2, R = C * 0.43;
    const rg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.38, R * 0.08, cx, cy, R); rg.addColorStop(0, 'rgba(70,104,138,0.93)'); rg.addColorStop(1, 'rgba(9,20,38,0.94)');
    g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fillStyle = rg; g.fill(); g.lineWidth = C * 0.055; g.strokeStyle = '#8ff0ff'; g.stroke();
    g.beginPath(); g.arc(cx, cy, R * 0.8, Math.PI * 1.08, Math.PI * 1.72); g.lineWidth = C * 0.032; g.strokeStyle = 'rgba(255,255,255,0.32)'; g.stroke();
    g.save(); g.translate(cx - R * 0.62, cy - R * 0.62); g.scale((R * 1.24) / 24, (R * 1.24) / 24); g.lineWidth = 2.4; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.stroke(new Path2D(ARROW)); g.restore();
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 2; return t;
  }
  function mkPoints(n, map, size, opacity, color, ro) {                                                  // = the door orbs' parameters (map, sizeAttenuation, fog, transparent, no depth write): the same program
    const g = new T.BufferGeometry(), a = new T.BufferAttribute(new Float32Array(n * 3), 3); a.setUsage(T.DynamicDrawUsage); g.setAttribute('position', a); g.setDrawRange(0, 0);
    const m = new T.PointsMaterial({ map, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false, fog: true, color });
    const p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = ro; p.userData.rpHero = true; p.userData.rpGoUp = true; p.visible = false; grp.add(p); return { p, a, m, n: 0 };
  }
  function dom() {
    const hud = G.hud && G.hud(); if (!hud) return;
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.textContent = G.ui ? G.ui.css(G.top || '0px', G.btm || '0px') : STYLE(G.top || '0px', G.btm || '0px'); document.head.appendChild(styleEl); }   // UI2: G.ui.css = the blue / silver chip + pill
    chip = document.createElement('div'); chip.className = 'rp-gu rp-gu-chip rp-k'; if (G.ui) chip.dataset.l = G.ui.look; chip.innerHTML = G.ui ? G.ui.chipHtml() : `<svg viewBox="0 0 24 24"><path d="${ARROW}"/></svg><i></i>`; chipSvg = chip.firstChild; chipTxt = chip.lastChild; hud.appendChild(chip);   // UI2: the look number + markup of the chip come from rp_ui2.js (G.ui)
    pill = document.createElement('div'); pill.className = 'rp-gu rp-gu-pill rp-k'; pill.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ARROW}"/></svg><span>Go up</span>`; hud.appendChild(pill);
  }
  function enter() {
    if (st.on) return; st.on = true; glowTex = makeGlow(); iconTex = makeIcon();
    cols = mkPoints(MAXI * COL_N, glowTex, 2.0, 0.65, MINT, 10); cols.m.blending = T.AdditiveBlending;   // (blending = state, not a program)
     icons = mkPoints(MAXI, iconTex, 1.2, 0.98, 0xffffff, 12);
    scene.add(grp); dom();
  }
  function exit() {
    if (!st.on) return; st.on = false; grp.removeFromParent(); for (const P of [cols, icons]) if (P) { P.p.geometry.dispose(); P.m.dispose(); P.p.removeFromParent(); }
    cols = icons = null; if (glowTex) { glowTex.dispose(); glowTex = null; } if (iconTex) { iconTex.dispose(); iconTex = null; }
    for (const e of [chip, pill]) if (e) e.remove(); chip = pill = null; st.chip = st.prompt = false; st.n = st.vis = 0; st.near = -1; if (styleEl) { styleEl.remove(); styleEl = null; } st.feet.length = 0;
  }
  // the feet: the first point of every ramp's route (2.2 m before its first flight, in the middle of the lane); computed once the ramps exist
  function feet() {
    const R = G.ramps && G.ramps(); if (!R || !R.st || !R.st.ramps.length) return false; if (st.feet.length === R.st.ramps.length) return true;
    st.feet.length = 0; for (let i = 0; i < R.st.ramps.length; i++) { const p = R.route(i); if (!p) continue; const x = p[0][0], z = p[0][1]; st.feet.push({ i, id: R.st.ramps[i].id, x, z, y: G.ground(x, z), ph: i * 1.7 }); }
    return st.feet.length > 0;
  }
  function tick(now) {
    if (!st.on) return; const t0 = performance.now(), tt = now / 1000;
    if (!feet() || S.where !== 'home') { icons.p.visible = cols.p.visible = false; if (chip) chip.style.display = 'none'; if (pill) pill.style.display = 'none'; st.vis = 0; return; }
    const F = st.feet, hx = S.x, hz = S.z; let ni = 0, nc = 0, near = -1, nd = 1e9, onScreen = false, nr = 1e9;
    const ia = icons.a.array, ca = cols.a.array;
    for (let k = 0; k < F.length; k++) {
      const f = F[k], dx = f.x - hx, dz = f.z - hz, d2 = dx * dx + dz * dz; if (d2 < nd) { nd = d2; near = k; }
      if (d2 > RANGE * RANGE || ni >= MAXI) continue; if (d2 < nr) nr = d2;
      const bob = 0.12 * Math.sin(tt * 1.6 + f.ph), iy = f.y + ICON_Y + bob, o = ni * 3; ia[o] = f.x; ia[o + 1] = iy; ia[o + 2] = f.z; ni++;
      for (let q = 0; q < COL_N; q++) { const c = nc * 3; ca[c] = f.x; ca[c + 1] = f.y + 0.15 + q * COL_DY; ca[c + 2] = f.z; nc++; }
      v.set(f.x, iy, f.z).project(camera); if (v.z < 1 && Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.96) onScreen = true;
    }
    if (ni) { H.renderer.getSize(v2); icons.m.size = Math.min(6.5, Math.max(1.0, ICON_PX * Math.sqrt(nr) * 2 / (v2.y || 390))); }   // three: gl_PointSize = size * (H / 2) / depth  ->  size = px * depth * 2 / H
    if (ni) { const k = Math.min(1, Math.max(0, (Math.sqrt(nd) - 1.5) / 2.5)); icons.m.opacity = 0.98 * (0.3 + 0.7 * k); cols.m.opacity = 0.65 * (0.5 + 0.5 * k); }   // right at the foot the «Go up» pill speaks: the icon steps back (so it never piles up with the sign over her head)
    icons.p.geometry.setDrawRange(0, ni); cols.p.geometry.setDrawRange(0, nc); icons.p.visible = ni > 0; cols.p.visible = nc > 0;
    if (ni) { icons.a.clearUpdateRanges(); icons.a.addUpdateRange(0, ni * 3); icons.a.needsUpdate = true; cols.a.clearUpdateRanges(); cols.a.addUpdateRange(0, nc * 3); cols.a.needsUpdate = true; }
    st.n = ni; st.vis = onScreen ? ni : 0; st.near = near; st.nearD = Math.sqrt(nd);
    // HUD chip: no marker on the screen -> an arrow to the nearest way up (the compass direction in screen space) + the distance
    const showChip = !!chip && near >= 0 && !onScreen && st.nearD > 6 && S.layer === 0 && S.mode === 'third' && S.y - G.ground(hx, hz) < 0.6;   // (< 6 m: the pill at the foot is the hint; already up on a ramp: nothing to point to)
    if (showChip) {
      const f = F[near]; v.set(f.x, f.y + ICON_Y, f.z).project(camera); let sx = v.x, sy = v.y; if (v.z > 1) { sx = -sx; sy = -sy; }
      const ang = Math.atan2(sx * (camera.aspect || 1.7), sy); chipSvg.style.transform = `rotate(${ang.toFixed(3)}rad)`; const txt = Math.round(st.nearD) + ' m'; if (chipTxt.textContent !== txt) chipTxt.textContent = txt;
    }
    if (chip && showChip !== st.chip) { chip.style.display = showChip ? 'flex' : 'none'; st.chip = showChip; }
    // the prompt: at the foot of a way up, on the ground
    const showP = !!pill && near >= 0 && st.nearD < FOOT_R && S.layer === 0 && S.grounded && S.y < F[near].y + 0.5 && S.sw === 0 && S.mode === 'third';
    if (pill && showP !== st.prompt) { pill.style.display = showP ? 'flex' : 'none'; st.prompt = showP; }
    st.ms = performance.now() - t0;
  }
  const dbg = () => ({ cols: cols && cols.m, icons: icons && icons.m, cp: cols && cols.p, ip: icons && icons.p });
  const info = () => ({ on: st.on, feet: st.feet.length, icons: st.n, onScreen: st.vis, nearest: st.near, nearD: +st.nearD.toFixed(1), chip: st.chip, prompt: st.prompt, calls: (icons && icons.p.visible ? 1 : 0) + (cols && cols.p.visible ? 1 : 0), ms: +st.ms.toFixed(3) });
  return { enter, exit, tick, info, dbg, st, feetList: () => st.feet };
}
