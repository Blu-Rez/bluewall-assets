// rp1c2_strip.js — RP1C-R2 Jobs 4 + 5: SIDE-VIEW FRAME STRIPS on the real game.  Installs window.__strip = { init(opt), step(sec), at() , done() }.   Camera = a low side camera that rides with her (S.tap override after every placeCamera, so
//   the paused real frames render it too).   opt: { kind: 'street' | 'slope' | 'flat', mode: 'old' | 'new', speed: 'walk' | 'run' | 'sprint', dist: 2.2, turn: false }
(() => {
  const B = __bw, T = B.THREE, rp = __rp, S = rp.S, cam = B.camera, W = B.world;
  const slopeDeg = (x, z) => { const e = 1, gx = rp.baseGround(x + e, z) - rp.baseGround(x - e, z), gz = rp.baseGround(x, z + e) - rp.baseGround(x, z - e); return Math.atan(Math.hypot(gx, gz) / (2 * e)) * 57.2958; };
  const st = { on: false, side: 1, dist: 2.2, h: 0.55, look: 0.5, fov: null, yaw: 0, log: [] };
  const spots = {};
  // street: a ribbon triangle centre of a flat-ish street, the direction along the ribbon; slope: a ~25° bank walked UP; flat: open meadow
  const sm = B.scene.getObjectByName('streets');
  if (sm) { const pos = sm.geometry.attributes.position, idx = sm.geometry.index, n = idx.count / 3; let best = null; for (let t = 0; t < n; t += 3) { const i = [0, 1, 2].map((k) => idx.getX(t * 3 + k)); const x = (pos.getX(i[0]) + pos.getX(i[1]) + pos.getX(i[2])) / 3, z = (pos.getZ(i[0]) + pos.getZ(i[1]) + pos.getZ(i[2])) / 3;
      const dx = pos.getX(i[1]) - pos.getX(i[0]), dz = pos.getZ(i[1]) - pos.getZ(i[0]); const s = slopeDeg(x, z); if (W.fastHeight(x, z) < 1) continue;
      // want a straight stretch >= 12 m of ribbon ahead: test the surface along the direction
      let ok = true; const l = Math.hypot(dx, dz) || 1; for (let m = 1; m <= 8 && ok; m++) if (!(rp.surfAt(x + (dx / l) * m * 1.5, z + (dz / l) * m * 1.5) > -1e8)) ok = false; if (!ok) continue;
      if (!best || (s > 2 && s < 9 && (best.s <= 2 || best.s >= 9))) best = { x, z, yaw: Math.atan2(dx, dz), s }; if (best.s > 3 && best.s < 9) break; }
    if (best) spots.street = best; }
  { let bestS = null; for (let x = -300; x <= 300; x += 6) for (let z = -300; z <= 300; z += 6) { const s = slopeDeg(x, z), g = rp.baseGround(x, z); if (s >= 24 && s <= 30 && g > 1 && W.fastHeight(x, z) > 1 && rp.surfAt(x, z) < -1e8) { const e = 1, gx = rp.baseGround(x + e, z) - rp.baseGround(x - e, z), gz = rp.baseGround(x, z + e) - rp.baseGround(x, z - e); const yaw = Math.atan2(gx, gz);
        // 6 m of the same bank ahead (uphill)
        let ok = true; for (let m = 1; m <= 6 && ok; m++) { const s2 = slopeDeg(x + Math.sin(yaw) * m, z + Math.cos(yaw) * m); if (s2 < 18 || s2 > 36) ok = false; } if (ok) { bestS = { x, z, yaw, s }; break; } } if (bestS) break; } if (bestS) spots.slope = bestS; }
  spots.flat = { x: 0, z: 0, yaw: 0, s: 0 }; { for (let x = -300; x <= 300; x += 20) for (let z = -300; z <= 240; z += 20) { let lo = 1e9, hi = -1e9; for (let k = 0; k <= 8; k++) { const y = rp.baseGround(x, z + k * 3); lo = Math.min(lo, y); hi = Math.max(hi, y); } if (hi - lo < 0.3 && lo > 0.5 && rp.surfAt(x, z) < -1e8) { spots.flat = { x, z, yaw: 0, s: 0 }; x = 999; break; } } }
  const tap = () => {
    if (!st.on) return; const h = S.hero; if (!h) return; const fx = Math.sin(st.yaw), fz = Math.cos(st.yaw), rx = fz * st.side, rz = -fx * st.side;               // the side of her body (right = +x when facing +z)
    const gy = Math.max(S.y, 0); cam.position.set(S.x + rx * st.dist, S.y + st.h, S.z + rz * st.dist); cam.lookAt(S.x - fx * 0.0, S.y + st.look, S.z - fz * 0.0); cam.updateMatrixWorld();
  };
  window.__strip = {
    spots, st,
    init(o) {
      const sp = spots[o.kind]; if (!sp) return JSON.stringify({ err: 'no spot ' + o.kind, have: Object.keys(spots) });
      rp.pause(true); S.cool = 99; rp.contact(o.mode === 'old' ? { rigid: false, rib: false } : { rigid: true, rib: true }); rp.footOn(o.mode !== 'old');
      st.dist = o.dist || 2.2; st.h = o.h != null ? o.h : 0.6; st.look = o.look != null ? o.look : 0.5; st.side = o.side || 1; st.yaw = sp.yaw; if (o.fov) { st.fov = cam.fov; cam.fov = o.fov; cam.updateProjectionMatrix(); }
      rp.setPos(sp.x, sp.z, sp.yaw); S.phase = 0; rp.sprint(o.speed === 'sprint'); rp.setInput(0, o.speed === 'walk' ? 0.55 : 1); S.tap = tap; st.on = true; st.speed = o.speed;
      rp.sim(o.warm != null ? o.warm : 1.2, 1 / 60); tap(); return JSON.stringify({ ok: true, spot: sp, y: S.y, ground: rp.baseGround(S.x, S.z), speed: S.speed });
    },
    step(sec) { rp.sim(sec, 1 / 60); tap(); const k = S.hero.ik; return JSON.stringify({ x: +S.x.toFixed(2), z: +S.z.toFixed(2), y: +S.y.toFixed(3), g: +rp.baseGround(S.x, S.z).toFixed(3), surf: +(rp.surfAt(S.x, S.z) || 0).toFixed(3), v: +S.speed.toFixed(2), ik: k ? k.legs.map((l) => [+l.d.toFixed(3), +l.pw.toFixed(2), +l.tilt.toFixed(1)]) : null, P: k ? +k.P.toFixed(3) : null }); },
    done() { st.on = false; S.tap = null; if (st.fov) { cam.fov = st.fov; cam.updateProjectionMatrix(); st.fov = null; } rp.setInput(0, 0); rp.sprint(false); rp.contact({ rigid: true, rib: true }); rp.footOn(true); rp.pause(false); return 'done'; },
  };
  return JSON.stringify({ spots, mesh: !!sm });
})()
