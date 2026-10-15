(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  try { if (window.__rp && window.__rp.exit) window.__rp.exit(); } catch (e) {}
  await window.__rpLoad('?v=' + Date.now()); const a = window.__rp; await a.start('elina'); await wait(1500);
  const S = a.S; const out = [];
  const rp = a.ramps().st.ramps[2]; const b = rp.wall;
  const t = a.rampTest(2, {});
  return JSON.stringify({ camBad: t.camBad, camAt: t.camAt, camWall: !!S.camWall, sameWall: S.camWall === b, wallHd: b.hd, wallH: b.h, id: rp.wallId });
})()
