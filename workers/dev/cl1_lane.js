// cl1_lane.js — CL1: the walking lane in front of every door.  LANE = 0.9 .. 3 m along the door's facing x +-0.75 m (a body + a margin); ZONE = 0.9 .. 3 m x +-2 m.
// For each door: solid cells (static layer / instance layer) in the lane and in the zone, and whether a straight walk from 3.2 m to the door face is free.  Evaluated in the game page, hero started.
(() => {
  const rp = window.__rp, GR = rp.grid(), opt = window.__cl1opt || {}; const dm = rp.doors(); if (dm && dm.build) dm.build();
  const items = (dm.items() || []).filter((it) => it.fx !== undefined), out = [];
  for (const it of items) {
    const nx = (it.x - it.fx) / 0.7, nz = (it.z - it.fz) / 0.7, l = Math.hypot(nx, nz) || 1, ux = nx / l, uz = nz / l, vx = -uz, vz = ux;
    const rec = { id: it.id, kind: it.kind, fx: +it.fx.toFixed(1), fz: +it.fz.toFixed(1), laneS: 0, laneI: 0, zoneS: 0, zoneI: 0, laneAt: [] };
    for (let t = 0.9; t <= 3.01; t += 0.25) for (let s = -2; s <= 2.01; s += 0.25) {
      const x = it.fx + ux * t + vx * s, z = it.fz + uz * t + vz * s, st = GR.solid(x, z), si = !st && GR.solidInst && GR.solidInst(x, z), lane = Math.abs(s) <= 0.76;
      if (st) { rec.zoneS++; if (lane) { rec.laneS++; if (rec.laneAt.length < 4) rec.laneAt.push([+x.toFixed(1), +z.toFixed(1), 'S']); } } else if (si) { rec.zoneI++; if (lane) { rec.laneI++; if (rec.laneAt.length < 4) rec.laneAt.push([+x.toFixed(1), +z.toFixed(1), 'I']); } }
    }
    // a straight walk with the hero's real physics: from 3.4 m in front of the door, stick forward, 3 s; does she reach 1.0 m from the door face?
    out.push(rec);
  }
  window.__cl1lane = out;
  return JSON.stringify({ doors: out.length, laneBlockedS: out.filter((r) => r.laneS > 0).length, laneBlockedI: out.filter((r) => r.laneI > 0).length, zoneS: out.filter((r) => r.zoneS > 0).length, zoneI: out.filter((r) => r.zoneI > 0).length, rows: out.filter((r) => r.laneS || r.laneI || r.zoneI) });
})()
