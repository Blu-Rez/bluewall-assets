// rp1c2_jump.js — RP1C-R2 Job 7: the jump on the real game.  (1) flat ground: apex height, air time, the states she passes through (jump -> fall -> land) with their times, at 60 / 30 / 20 fps;
//   (2) the clips: which jump/fall/land clip time each state shows (the pose at the apex / at the landing);  (3) no wall-climbing by jumping: pressed against the longest walls, jump spam for 10 s, with climbing OFF (the kit default)
//   and ON: the highest she gets above the ground, her layer;  (4) the highest ledge she can hop onto.
(async () => {
  const rp = __rp, S = rp.S, out = {};
  rp.pause(true); S.cool = 99; out.info = rp.jumpInfo();
  const flat = (() => { for (let x = -300; x <= 300; x += 20) for (let z = -300; z <= 240; z += 20) { let lo = 1e9, hi = -1e9; for (let a = -3; a <= 3; a += 1.5) for (let b = -3; b <= 3; b += 1.5) { const y = rp.baseGround(x + a, z + b); lo = Math.min(lo, y); hi = Math.max(hi, y); } if (hi - lo < 0.05 && lo > 0.5 && rp.surfAt(x, z) < -1e8) return { x, z }; } return { x: 0, z: 0 }; })();
  const run = (fps, still) => {
    rp.setPos(flat.x, flat.z, 0); rp.setInput(0, still ? 0 : 1); rp.sprint(false); rp.sim(0.5, 1 / 60); const g0 = S.y, st = 1 / fps; rp.jump(); let t = 0, apex = 0, tApex = 0, air = null, seq = [], last = null, clip = {};
    for (let i = 0; i < Math.ceil(2 / st); i++) { rp.sim(st, st); t += st; const h = S.y - g0; if (h > apex) { apex = h; tApex = t; } if (S.st !== last) { seq.push([S.st, +t.toFixed(3)]); last = S.st; } if (air == null && S.grounded && t > 0.05) air = t; if (S.st === 'jump' && Math.abs(t - 0.2) < st) clip.jump_t0_2 = S.hero.acts.jump.a.time; if (S.st === 'land' && !clip.land0) clip.land0 = S.hero.acts.land.a.time; if (S.st === 'loco' && air != null && t > air + 0.1) break; }
    return { fps, still: !!still, apex: +apex.toFixed(3), tApex: +tApex.toFixed(3), air: air == null ? null : +air.toFixed(3), seq, clip };
  };
  out.flat = [run(60, true), run(30, true), run(20, true), run(60, false)];
  out.clips = { jump: S.hero.acts.jump.d, fall: S.hero.acts.fall.d, land: S.hero.acts.land.d };
  // wall: press against the longest walls and jump
  out.walls = [];
  for (const climb of [false, true]) { rp.setClimb(climb); for (let k = 0; k < 3; k++) {
    const sp = rp.wallSpot(k, 1, 0.9, 0); if (!sp) continue; rp.setPos(sp.x, sp.z, sp.yaw); rp.sim(0.3, 1 / 60); const g0 = S.y; let maxH = 0, layer = new Set(), top = false;
    for (let i = 0; i < 600; i++) { if (i % 20 === 0) rp.setInput(0, 1); if (S.grounded && i % 5 === 0) rp.jump(); rp.sim(1 / 60, 1 / 60); maxH = Math.max(maxH, S.y - g0); layer.add(String(S.layer)); if (S.layer === 'top') top = true; }
    out.walls.push({ climbOn: climb, wall: k, maxAboveStart: +maxH.toFixed(2), layers: [...layer], gotOnTop: top }); } }
  rp.setClimb(false); rp.setInput(0, 0);
  return JSON.stringify(out);
})()
