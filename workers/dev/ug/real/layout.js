(() => {
  const b = __battle, s = b.sim, dp = s.deploy, nx = dp.nx, nz = dp.nz, tx = -nz, tz = nx, H = b.H;
  const by = {}; for (const u of s.units) (by[u.type] = by[u.type] || []).push(u);
  window.__by = by; window.__yaw0 = Math.atan2(nx, nz);
  // hide the HUD and the squad rings for the pictures
  b.hud.el.style.display = 'none'; const rg = __bw.scene.getObjectByName('squadRings'); if (rg) rg.visible = false;
  // a row of one of each, abreast, facing the base (-n), at lateral offsets a (m) from the deploy point; width = room each needs
  const order = ['legionary', 'sword', 'captain', 'shieldmaiden', 'hill', 'ogre', 'giant', 'treant', 'mage', 'lich'];
  const W = { legionary: 4, sword: 4, captain: 5.5, shieldmaiden: 5, hill: 10, ogre: 8, giant: 12, treant: 14, mage: 4.5, lich: 6 };
  let a = 0; const pos = {};
  order.forEach((t, i) => { if (i) a += (W[order[i - 1]] + W[t]) / 2 + 1; pos[t] = a; });
  const mid = a / 2;
  for (const t of order) { const u = (by[t] || [])[0]; if (!u) continue; const aa = pos[t] - mid; u.x = dp.x - tx * aa; u.z = dp.z - tz * aa; u.face = window.__yaw0; u.active = false; }
  // park every other unit far behind
  for (const t of Object.keys(by)) for (let i = (order.includes(t) ? 1 : 0); i < by[t].length; i++) { const u = by[t][i]; u.x = dp.x + nx * (60 + i * 6) + tx * (i * 5); u.z = dp.z + nz * (60 + i * 6) + tz * (i * 5); u.face = window.__yaw0; }
  window.__row = { order, pos, mid, tx, tz, nx, nz, dp };
  // pixel x (and y of the feet / head top) of each unit for the current camera, for the labels
  window.__proj = () => { const c = __bw.camera, V = c.position.constructor, w = innerWidth, h = innerHeight, o = {}; c.updateMatrixWorld(true);
    for (const t of order) { const u = (by[t] || [])[0]; if (!u) continue; const g = b.H(u.x, u.z), f = new V(u.x, g, u.z).project(c), hd = new V(u.x, g + 3, u.z).project(c); o[t] = [Math.round((f.x + 1) / 2 * w), Math.round((1 - f.y) / 2 * h)]; }
    return o; };
  window.__pt = (t, f = 0) => { const u = by[t][0]; return [u.x - nx * f, u.z - nz * f]; };
  return Object.fromEntries(order.map((t) => [t, by[t] ? by[t][0].id : null]));
})()
;(() => {
  const b = __battle, H = b.H;
  {
    const c = __bw.camera; let _f = c.fov, lock = null;
    Object.defineProperty(c, 'fov', { get() { return lock === null ? _f : lock; }, set(v) { _f = v; }, configurable: true });
    window.__setFov = (f) => { lock = f; c.updateProjectionMatrix(); };
  }
  window.__look = (t, dist, az, ly, up = 0.1, fov = 30, idx = 0) => {
    const u = __by[t][idx], c = __bw.camera, a = __yaw0 + az, y0 = H(u.x, u.z);
    __setFov(fov); c.position.set(u.x + Math.sin(a) * dist, y0 + ly + up * dist, u.z + Math.cos(a) * dist); c.lookAt(u.x, y0 + ly, u.z); c.updateMatrixWorld(true); b.cam.free = true; return [u.x | 0, u.z | 0];
  };
  // wide camera on the row: from the front, a little to the side
  window.__rowcam = (dist, az, ly, up, fov) => {
    const r = __row, c = __bw.camera, cx = r.dp.x, cz = r.dp.z, a = __yaw0 + az, y0 = H(cx, cz);
    __setFov(fov); c.position.set(cx + Math.sin(a) * dist, y0 + ly + up * dist, cz + Math.cos(a) * dist); c.lookAt(cx, y0 + ly, cz); c.updateMatrixWorld(true); b.cam.free = true; return c.position.toArray();
  };
  // everybody but t far to the side (close-ups without neighbours); t to the deploy point
  window.__solo = (t) => { const r = __row; r.order.forEach((q, i) => { const u = (__by[q] || [])[0]; if (!u) return; const o = q === t ? 0 : 400 + i * 40; u.x = r.dp.x + r.tx * o; u.z = r.dp.z + r.tz * o; }); return t; };
  window.__melee = (t, idx = 0) => { const u = __by[t][idx]; b.views.event({ k: 'melee', u: u.id }, b.t); return u.id; };
  window.__shot = (t, idx = 0) => { const u = __by[t][idx]; b.views.event({ k: 'shot', u: u.id, kind: 'orb' }, b.t); return u.id; };
  window.__hurt = (t, idx = 0) => { const u = __by[t][idx]; b.views.event({ k: 'hurt', id: u.id }, b.t); return u.id; };
  window.__die = (t, idx = 0) => { const u = __by[t][idx]; u.dead = true; b.views.event({ k: 'die', id: u.id }, b.t); return u.id; };
  window.__move = (t, v, on = true, idx = 0) => { const u = __by[t][idx]; u.active = on; if (!on) { window.__mv && delete window.__mv[u.id]; return 0; } window.__mv = window.__mv || {}; window.__mv[u.id] = { u, v }; if (!window.__mvLoop) { window.__mvLoop = true; let last = performance.now(); const tick = () => { const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; for (const m of Object.values(window.__mv || {})) { m.u.x += -__row.nx * m.v * dt; m.u.z += -__row.nz * m.v * dt; } requestAnimationFrame(tick); }; requestAnimationFrame(tick); } return u.id; };
  return 'helpers';
})();
