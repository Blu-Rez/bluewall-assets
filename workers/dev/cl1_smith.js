// cl1_smith.js — CL1: the blacksmith (late:blacksmith, TR2 shell: its wood walls / furniture are transparent-flagged materials of opacity 1) was walked THROUGH: the grid skipped its meshes.  The hero walks at its centre from 8 sides, real physics, 4 s;
// «entered» = she got within 2.2 m of its centre (through the walls).  BEFORE = grid.build({ tfix: false }) (the old transparent rule), AFTER = grid.build().  Evaluated in the game page, hero started.  Async.
(async () => {
  const rp = window.__rp, S = rp.S, B = window.__bw, sc = B.scene, GR = rp.grid(), dt = 1 / 30, steps = 4 * 30, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // only the building mesh (blacksmithsMat) gives the box: the other meshes are the 19 x 23 m ground disc, the forge, furniture and items
  const T = sc.position.constructor; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, n = 0, tris = 0; sc.updateMatrixWorld(true);
  const pathOf = (o) => { const a = []; for (let p = o; p && p !== sc; p = p.parent) a.push(p.name || p.type); return a.reverse().join('>'); };
  const mw = (o) => o.matrixWorld.elements;
  sc.traverse((o) => { if (o.isMesh && o.geometry && !o.isInstancedMesh && /late:blacksmith/.test(pathOf(o)) && (Array.isArray(o.material) ? o.material[0] : o.material).name === 'blacksmithsMat') { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, e = mw(o); for (let a = 0; a < 8; a++) { const x = a & 1 ? bb.max.x : bb.min.x, y = a & 2 ? bb.max.y : bb.min.y, z = a & 4 ? bb.max.z : bb.min.z; const X = e[0] * x + e[4] * y + e[8] * z + e[12], Z = e[2] * x + e[6] * y + e[10] * z + e[14]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z; } n++; tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3; } });
  if (!n) return JSON.stringify({ err: 'no blacksmith meshes' });
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2, rad = Math.max(hx, hz);
  const inside = (x, z) => Math.hypot(x - cx, z - cz) < 2.2;                                   // the cottage is ~7 x 8 m around the centre of that mesh (the box also holds the tower and the yard): within 2.2 m of the centre = through the walls
  const cells = () => { let c = 0; for (let x = x0 - 0.3; x <= x1 + 0.3; x += 0.25) for (let z = z0 - 0.3; z <= z1 + 0.3; z += 0.25) if (GR.solid(x, z)) c++; return c; };
  const walk8 = () => { let entered = 0, tested = 0; for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, D0 = 3.5 + rad, sx = cx - Math.sin(ang) * D0, sz = cz - Math.cos(ang) * D0; if (GR.solidAll(sx, sz)) continue; tested++;
      rp.setPos(sx, sz, ang); rp.setLook(ang, 0.2); S.cool = 99; S.sw = 0; S.inp.x = 0; S.inp.y = 1; S.sprint = false; S.st = 'loco'; S.vx = S.vz = 0; S.reqDodge = false; S.dodgeCool = 0; S.layer = 0; S.top = S.climb = null; S.camYaw = ang; S.dCool = 0; S.dHold = 0; S.sheetOn = false; S.doorHook = null;
      let px = S.x, pz = S.z, e = false; for (let i = 0; i < steps; i++) { rp.phys(dt, dt); if (Math.hypot(S.x - px, S.z - pz) > 0.6) break; px = S.x; pz = S.z; if (inside(S.x, S.z)) { e = true; break; } } if (e) entered++; S.inp.y = 0; } return { tested, entered }; };
  await GR.build({ tfix: false }); rp.useGrid(true); await wait(50); const before = { cells: cells(), ...walk8() };
  await GR.build(); rp.useGrid(true); await wait(50); const after = { cells: cells(), ...walk8() };
  return JSON.stringify({ meshes: n, tris, box: [+x0.toFixed(1), +z0.toFixed(1), +x1.toFixed(1), +z1.toFixed(1)], before, after });
})()
