// rp4r3_wall_meas.js — RP4_R3: the roll against the longest wall of the castle on the REAL game (home map): straight in from 3.0 m and from 1.2 m, and at 45 degrees; both sides.
// Returns JSON { cases:[{name, box:{x,z,hw,hd,ux,uz,vx,vz}, trace:[[t,x,z,st]...] (world coordinates, every 0.05 s, stick held for the roll only), inside, minGap, rollDist}] }.
(async () => {
  const rp = __rp, S = rp.S, out = { cases: [] }; rp.pause(true); S.cool = 99;
  const walls = S.boxes.filter((b) => b.type === 'wall').sort((a, c) => c.hw - a.hw), DT = 1 / 60, r3 = (v) => Math.round(v * 1000) / 1000;
  const b = walls[0]; out.wall = { x: r3(b.x), z: r3(b.z), hw: b.hw, hd: b.hd, ux: r3(b.ux), uz: r3(b.uz), vx: r3(b.vx), vz: r3(b.vz), h: b.h };
  const gap = (x, z) => { const dx = x - b.x, dz = z - b.z, lx = dx * b.ux + dz * b.uz, lz = dx * b.vx + dz * b.vz; const ox = Math.max(0, Math.abs(lx) - b.hw), oz = Math.max(0, Math.abs(lz) - b.hd); return Math.hypot(ox, oz) - (Math.abs(lx) <= b.hw && Math.abs(lz) <= b.hd ? 1e3 : 0); };   // distance from the wall's rectangle (negative-big when inside)
  for (const side of [1, -1]) for (const [ang, d] of [[0, 3.0], [0, 1.2], [45, 3.0], [-45, 3.0], [45, 1.2], [-45, 1.2], [70, 1.2]]) {
    const sp = rp.wallSpot(0, side, d, 0); if (!sp) continue;
    rp.setPos(sp.x, sp.z, sp.yaw); rp.setLook(sp.yaw, 0.25); S.dodgeCool = 0; S.vx = S.vz = 0; rp.setInput(0, 0); rp.sim(0.7, DT);
    const a = ang * Math.PI / 180; rp.setInput(Math.sin(a), Math.cos(a)); rp.dodge(); const tr = [[0, r3(S.x), r3(S.z), 'loco']]; let inside = 0, minGap = 1e9, tEnd = null, pEnd = null, x0 = S.x, z0 = S.z;
    for (let i = 1; i <= 66; i++) { rp.sim(DT, DT); const g = gap(S.x, S.z); if (g < 0) inside++; minGap = Math.min(minGap, g); if (tEnd == null && S.st !== 'dodge' && i > 2) { tEnd = i * DT; pEnd = [S.x, S.z]; rp.setInput(0, 0); } if (i % 3 === 0) tr.push([r3(i * DT), r3(S.x), r3(S.z), S.st]); }
    out.cases.push({ name: (side > 0 ? 'A' : 'B') + '_' + ang + '_' + d, side, ang, d, trace: tr, inside, minGap: r3(minGap), rollDist: r3(Math.hypot((pEnd || [S.x, S.z])[0] - x0, (pEnd || [S.x, S.z])[1] - z0)), tEnd });
  }
  rp.setInput(0, 0); rp.pause(false);
  return JSON.stringify(out);
})()
