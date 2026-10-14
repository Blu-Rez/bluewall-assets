// falls.js metrics (same algorithm) for a polyline given the carved terrain: base / crest heights, and natural heights along the gorge
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
L.setMap('night');
export function fallsMetrics(P, H = L.height) {
  const [rx, rz] = P[0], [bx, bz] = P[1], len = Math.hypot(rx - bx, rz - bz), ux = (rx - bx) / len, uz = (rz - bz) / len;
  let sb = 0; for (let s = 0; s <= 40; s += 1) { if (H(rx + ux * s, rz + uz * s) > 0.5) { sb = s; break; } }
  let sBest = sb + 6, hMax = 0; for (let s = sb; s <= sb + 40; s += 1) hMax = Math.max(hMax, H(rx + ux * s, rz + uz * s));
  const cap = Math.min(hMax, 120);
  for (let s = sb; s <= sb + 40; s += 1) { if (H(rx + ux * s, rz + uz * s) >= cap * 0.92) { sBest = s; break; } sBest = s; }
  const st = Math.max(sb + 5, sBest), hBase = H(rx + ux * sb, rz + uz * sb), hTop = H(rx + ux * st, rz + uz * st);
  return { sb, st, hBase: +hBase.toFixed(1), hTop: +hTop.toFixed(1), drop: +(hTop - hBase).toFixed(1), fall: hTop - hBase > 12, foot: [rx + ux * sb, rz + uz * sb].map((v) => +v.toFixed(0)), crest: [rx + ux * st, rz + uz * st].map((v) => +v.toFixed(0)) };
}
if (process.argv[1] && process.argv[1].includes('a2_fallsm')) {
  console.log('old river head', JSON.stringify(fallsMetrics(L.RIVER)), 'natural h at P0/P1:', L.height(...L.RIVER[0]).toFixed(1), L.height(...L.RIVER[1]).toFixed(1));
}
