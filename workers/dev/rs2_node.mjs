// rs2_node.mjs — RS2: the pure parts of rp_sisters.js (the round face crop, the fan slots, the entrance light curve) without a browser.   node rs2_node.mjs  -> RS2_NODE OK
import { FACE, faceBg, fanX, FX_T, entryAt, DROP } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rp_sisters.js';
import fs from 'node:fs';
let fails = 0; const t = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
const KEYS = ['elina', 'elika', 'melika', 'mobina', 'aylin', 'aylar'];
// 1. the round crop: every sister has a face point; the card (320 x 400 = 1 : 1.25) always COVERS the circle (no empty rim, nothing cut that is not hair), and her face centre lands on the circle's centre
for (const k of KEYS) t(!!FACE[k], k + ': has a face point');
for (const d of [40, 44, 46, 48, 52, 54, 56]) for (const k of KEYS) {
  const b = faceBg(k, d), [fx, fy] = FACE[k];
  t(b.x <= 0 && b.y <= 0 && b.x + b.w >= d && b.y + b.h >= d, k + ' @' + d + ': the card covers the circle ' + JSON.stringify(b));
  t(Math.abs(b.x + fx * b.w - d / 2) < 0.02 && Math.abs(b.y + fy * b.h - d / 2) < 0.02, k + ' @' + d + ': the face centre is the circle centre');
  t(Math.abs(b.h / b.w - 1.25) < 0.01, k + ' @' + d + ': the card keeps its 1 : 1.25 shape');
}
// the face (brow to chin ≈ 0.20 of the card height — an estimate; the look is checked on the frames) fills a good part of the circle but is not cut: 50 % … 85 % of the circle height
for (const k of KEYS) { const b = faceBg(k, 48), face = 0.2 * b.h; t(face >= 0.5 * 48 && face <= 0.85 * 48, k + ': the face is ' + Math.round(100 * face / 48) + ' % of the circle'); }
t(faceBg('nobody', 48).w > 0, 'an unknown key does not crash');
// 2. the fan slots: every slot ≥ 44 px, a gap between, no overlap, the first slot clears the main button, the whole fan (5 + switch) fits the narrowest landscape phone next to the three left HUD buttons
const src = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rp_sisters.js', 'utf8');
const num = (n) => +(new RegExp('const[^;]*\\b' + n + '\\s*=\\s*(\\d+)').exec(src) || [])[1];
const MAIN_D = num('MAIN_D'), FAN_D = num('FAN_D'), TOG_D = num('TOG_D'), GAP = num('GAP');
t(MAIN_D >= 44 && FAN_D >= 44 && TOG_D >= 44, 'targets ≥ 44 px: main ' + MAIN_D + ' fan ' + FAN_D + ' switch ' + TOG_D);
t(fanX(0) === -(MAIN_D + GAP) && fanX(1) - fanX(0) === -(FAN_D + GAP), 'slot 0 sits one gap left of the main button, the pitch is FAN_D + GAP');
for (let i = 0; i < 5; i++) t(fanX(i) - fanX(i + 1) === FAN_D + GAP && FAN_D + GAP > FAN_D, 'slot ' + i + ' / ' + (i + 1) + ' do not overlap');
const span = -fanX(5) + TOG_D + 10; t(span + 5 * 44 + 40 < 700, 'the open fan is ' + span + ' px wide — fits 667+ px wide next to the left buttons (left HUD ends ≈ 222)'); t(844 - span > 222 + 8 && 800 - span > 222 + 8 && 667 - span > 222 - 40, 'does not touch the left HUD at 844 / 800');
// 3. the entrance light: short, soft, ends at zero, never opaque, nothing jumps
t(FX_T > 0.3 && FX_T <= 1.2, 'the entrance light lasts ' + FX_T + ' s (≤ 1.2 s)'); t(DROP > 0 && DROP <= 1, 'the drop-in height ' + DROP + ' m');
let peak = 0, prev = null, maxStep = 0, ringPeak = 0; const N = 240;
for (let i = 0; i <= N; i++) { const e = entryAt(i / N * FX_T); peak = Math.max(peak, e.col); ringPeak = Math.max(ringPeak, e.ring); if (prev) maxStep = Math.max(maxStep, Math.abs(e.col - prev.col), Math.abs(e.ring - prev.ring)); prev = e; }
t(peak <= 0.85 && peak > 0.3, 'the column peaks at ' + peak.toFixed(2) + ' (soft, never solid)'); t(ringPeak <= 1 && ringPeak > 0.5, 'the ring peaks at ' + ringPeak.toFixed(2));
t(maxStep < 0.12, 'no pop: the biggest step between two samples of 1/' + N + ' of the time is ' + maxStep.toFixed(3));
const z = entryAt(FX_T), zz = entryAt(FX_T * 5); t(z.col < 0.001 && z.ring === 0 && zz.col < 0.001 && zz.ring === 0, 'all zero at the end and after it'); const a = entryAt(-1); t(a.col === 0 && a.ring > 0.9, 'before the start: no column, the ring at its first value');
t(entryAt(0.5).colR > entryAt(0).colR && entryAt(0.5).ringR > entryAt(0).ringR, 'the light grows while it fades');
// 4. the words: no «bot / ربات» anywhere in the file's texts, the chip says «بارگذاری <name>»
t(!/ربات|\bbot\b/i.test(src.replace(/\/\/[^\n]*/g, '')), 'no forbidden word in the code / texts of rp_sisters.js'); t(/load:\s*'بارگذاری'/.test(src), 'the chip word is «بارگذاری»');
const rpg = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rpg.js', 'utf8'); const rsLines = rpg.split('\n').filter((l) => /RS2:/.test(l) || /mkChip|rs-chip/.test(l)).join('\n'); t(!/ربات|\bbot\b/i.test(rsLines.replace(/\$\{[^}]*\}/g, '')),   // (the template names like ${BOT} are code, not text)
   'no forbidden word on the RS2 lines of rpg.js');
t(/fa:\s*'الینا'/.test(rpg) && /fa:\s*'آیلار'/.test(rpg), 'the Persian names are in the sister list');
console.log(fails ? 'RS2_NODE FAIL ' + fails : 'RS2_NODE OK'); process.exit(fails ? 1 : 0);
