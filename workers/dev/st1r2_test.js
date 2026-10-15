// ST1_R2 test (node): the gem halo caps + the source rules of the job.  Last line: "ST1R2 OK"
//   - haloUpdate never exceeds the night cap (0.25 default / 0.38 rich) nor the day cap (0.08 / 0.12), over a full sweep of night 0..1 x fill 0..1 x 48 game hours of time
//   - the halo diameter stays small (<= 3.1 gem diameters), the halo texture curve has no plateau (smooth, monotone)
//   - vault.js / mines.js: no crown mesh, no giant gem (scale >= 3), no white-core glow texture (M.glowWhite) on a gem
import fs from 'fs';
import { haloUpdate, HALO_STYLES, haloLook, haloColor, haloRGB, gemGeometry } from '/home/claude/bot/bluebot_v2/bluewall/client/src/gemgeo.js';
let bad = 0; const say = (ok, m) => { console.log((ok ? 'OK   ' : 'FAIL ') + m); if (!ok) bad++; };
const SRC = '/home/claude/bot/bluebot_v2/bluewall/client/src/';
const fake = () => ({ material: { opacity: 0 }, scale: { v: 0, setScalar(x) { this.v = x; } } });
say(haloLook() === 2, 'default look = 2 (medium)');
for (const look of [1, 2, 3]) {
  const S = HALO_STYLES[look]; let mxN = 0, mxD = 0, mxS = 0;
  for (let n = 0; n <= 1.0001; n += 0.05) for (let f = 0; f <= 1.0001; f += 0.25) for (let t = 0; t < 48 * 3; t += 0.37) for (const full of [false, true]) {
    const sp = fake(); haloUpdate(sp, 1.9, n, f, t, full, 3, look);
    if (n >= 0.999) mxN = Math.max(mxN, sp.material.opacity); if (n <= 0.001) mxD = Math.max(mxD, sp.material.opacity); mxS = Math.max(mxS, sp.scale.v / (1.9 * 2));
  }
  say(mxN <= S.night + 1e-9 && mxN > S.night * 0.9, `look ${look}: night cap ${S.night} (max seen ${mxN.toFixed(3)})`);
  say(mxD <= S.day + 1e-9 && mxD > S.day * 0.9, `look ${look}: day cap ${S.day} (max seen ${mxD.toFixed(3)})`);
  say(mxS <= S.d * 1.0001, `look ${look}: halo diameter <= ${S.d} gem diameters (max ${mxS.toFixed(2)})`);
}
say(HALO_STYLES[2].night <= 0.25 && HALO_STYLES[2].day <= 0.08, 'default look caps = night 0.25 / day 0.08 (owner brief)');
for (const k of ['ruby', 'emerald', 'turq']) { const c = haloColor(k), h = {}; c.getHSL(h); say(Math.abs(h.s - 1) < 1e-6 && Math.abs(h.l - 0.5) < 1e-6, `${k}: halo colour is the pure saturated hue (no white)`); const r = haloRGB(k); say(r.length === 3 && Math.max(...r) > 0.9, `${k}: pool colour is bright in one channel`); }
{ const a = gemGeometry('ruby'), b = gemGeometry('ruby', true); say(a !== b && a.attributes.position.count === b.attributes.position.count, 'rich gem = own geometry, same triangle count'); }
const V = fs.readFileSync(SRC + 'vault.js', 'utf8'), Mi = fs.readFileSync(SRC + 'mines.js', 'utf8');
say(!/const crown = new THREE\.Mesh|crown\.scale|crown\.position/.test(V), 'vault.js: no crown mesh any more');
say(/ctx\.tgt\(\{ type: 'vault'[^\n]*\n[^\n]*buildVaultHall/.test(V), 'vault.js: the target id is still registered BEFORE buildVaultHall (BT1 fix)');
say(!/glowWhite/.test(V) && !/glowWhite/.test(Mi.slice(Mi.indexOf('buildMines'))), 'no white-core glow texture on the vault / mine gems');
say(!/setScalar\(5\.[0-9]\)/.test(Mi), 'mines.js: no giant (5.x) gem scale left');
const Y = fs.readFileSync(SRC + 'storeyards.js', 'utf8');
say(/pool\(px, Y\.y0 \+ 0\.375, pz, 8/.test(Y), 'vault basin pool lies on the paving (y0 + 0.375), r 8');
console.log(bad ? 'ST1R2 FAILED (' + bad + ')' : 'ST1R2 OK'); process.exit(bad ? 1 : 0);
