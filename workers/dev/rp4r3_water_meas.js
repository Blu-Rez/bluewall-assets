// rp4r3_water_meas.js — RP4_R3: the roll at the water edge, on the REAL game (home map).  Evaluated in the page by rp4r3_q.py after the hero is started.
// Finds river / moat banks (dry ground, deep water 3 m away along a straight line), rolls towards the water from 1.6 m / 2.6 m from the edge (stick held), and reports the deepest water she stood in and whether she swam (S.sw === 2).
(async () => {
  const rp = __rp, S = rp.S, out = { banks: [], trials: [] }; rp.pause(true); S.cool = 99;
  const WS = -0.75, depth = (x, z) => { const th = __bw.world.fastHeight(x, z); return th >= WS ? 0 : WS - th; };      // = rpg.js waterDepth() (bridge decks excluded by the surf test below)
  const found = [];
  for (let x = -330; x <= 330 && found.length < 40; x += 6) for (let z = -330; z <= 330 && found.length < 40; z += 6) {
    if (depth(x, z) > 0.02 || !rp.free(x, z) || rp.surfAt(x, z) > -1e8) continue;
    for (let a = 0; a < 6.28; a += Math.PI / 4) {
      const dx = Math.sin(a), dz = Math.cos(a); let ok = true, edge = null;
      for (let d = 0.5; d <= 7; d += 0.25) { const dp = depth(x + dx * d, z + dz * d); if (edge == null && dp > 0.05) edge = d; if (d <= 4 && !rp.free(x + dx * d, z + dz * d) && dp < 0.05) { ok = false; break; } }
      if (!ok || edge == null) continue; const dp = depth(x + dx * (edge + 2.5), z + dz * (edge + 2.5)); if (dp < 1.2) continue;
      found.push({ x, z, a, edge }); break;
    }
  }
  out.banks = found.slice(0, 6);
  const DT = 1 / 60, r3 = (v) => Math.round(v * 1000) / 1000;
  for (const b of found.slice(0, 6)) for (const back of [1.6, 2.6]) {
    const dx = Math.sin(b.a), dz = Math.cos(b.a), sx = b.x + dx * (b.edge - back), sz = b.z + dz * (b.edge - back);
    if (depth(sx, sz) > 0.02 || !rp.free(sx, sz)) continue;
    rp.setPos(sx, sz, b.a); rp.setLook(b.a, 0.25); S.dodgeCool = 0; S.vx = S.vz = 0; rp.setInput(0, 0); rp.sim(0.7, DT);
    const x0 = S.x, z0 = S.z; rp.setInput(0, 1); rp.dodge(); let maxD = 0, swam = 0, tr = [], maxRoll = 0, rollEnd = null;
    for (let i = 1; i <= 90; i++) { rp.sim(DT, DT); const dp = depth(S.x, S.z); maxD = Math.max(maxD, dp); if (S.st === 'dodge') maxRoll = Math.max(maxRoll, dp); else if (rollEnd == null && i > 2) { rollEnd = r3(i * DT); rp.setInput(0, 0); } if (S.sw === 2) swam++; if (i % 3 === 0) tr.push([r3(i * DT), r3(S.x - x0), r3(S.z - z0), S.st, r3(dp)]); }
    out.trials.push({ bank: [b.x, b.z], a: r3(b.a), edge: b.edge, fromEdge: back, maxDepth: r3(maxD), maxDepthInRoll: r3(maxRoll), rollEnd, swamFrames: swam, final: [r3(S.x - x0), r3(S.z - z0)], finalDepth: r3(depth(S.x, S.z)), trace: tr });
  }
  rp.setInput(0, 0); rp.pause(false);
  return JSON.stringify(out);
})()
