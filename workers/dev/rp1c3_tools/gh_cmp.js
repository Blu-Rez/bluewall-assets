(() => {
  const rp = window.__rp, W = __bw.world; let seed = 777; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pts = []; let tries = 0; while (pts.length < 6000 && tries++ < 60000) { const x = (rnd() * 2 - 1) * 300, z = (rnd() * 2 - 1) * 300; if (rp.free(x, z) && !(rp.S.sw > 0)) pts.push([x, z]); }
  let n5 = 0, n25 = 0, max = 0, maxAt = null, sum = 0; const big = [];
  for (const [x, z] of pts) { const a = W.fastHeight(x, z), b = rp.ground(x, z), d = b - a; if (Math.abs(d) > 0.05) n5++; if (Math.abs(d) > 0.25) { n25++; if (big.length < 8) big.push([+x.toFixed(0), +z.toFixed(0), +a.toFixed(2), +b.toFixed(2)]); } if (Math.abs(d) > Math.abs(max)) { max = d; maxAt = [+x.toFixed(0), +z.toFixed(0)]; } sum += Math.abs(d); }
  const T = (f) => { const t0 = performance.now(); let s = 0; for (let k = 0; k < 3; k++) for (const [x, z] of pts) s += f(x, z); return +((performance.now() - t0) / (3 * pts.length) * 1000).toFixed(3); };
  return JSON.stringify({ pts: pts.length, over5cm: n5, over25cm: n25, maxDiff: +max.toFixed(2), maxAt, meanAbs: +(sum / pts.length).toFixed(4), big, us_fastHeight: T((x, z) => W.fastHeight(x, z)), us_homeGround: T((x, z) => rp.ground(x, z)) });
})()
