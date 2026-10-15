// AR1 static checks (node, no browser): mapping covers all kinds, every referenced file exists with the right size / dimensions, credits, budget, wording, secrets, ownership.
// usage: node ar1_static.mjs <bundled unitcards.mjs>   -> prints "AR1 STATIC OK" or the failures
import fs from 'node:fs';
import path from 'node:path';
const R = '/home/claude/bot/bluebot_v2/bluewall', SRC = R + '/client/src', A = R + '/web/assets', U = A + '/units', SNAP = '/home/claude/work/snap_pre_ar1/src';
const fails = []; const bad = (m) => fails.push(m); const ok = (c, m) => { if (!c) bad(m); };
const DEFS = JSON.parse(fs.readFileSync(SRC + '/unitdefs.json', 'utf8')), MAP = JSON.parse(fs.readFileSync(SRC + '/units_looks.json', 'utf8'));
const kinds = DEFS.order; ok(kinds.length === 31, 'unitdefs order is not 31 kinds: ' + kinds.length);
const gaps = kinds.filter((k) => !MAP.kinds[k]); ok(gaps.length === 0, 'kinds without a look (keep old art, list in the report): ' + gaps.join(','));
for (const k of Object.keys(MAP.kinds)) ok(DEFS.units[k], 'mapping has an unknown kind ' + k);
// webp dimensions without a decoder: RIFF....WEBP then VP8 / VP8L / VP8X
function webpSize(f) {
  const b = fs.readFileSync(f); if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  if (t === 'VP8X') return [1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16))];
  return null;
}
const looks = new Set(); for (const e of Object.values(MAP.kinds)) { looks.add(e.low); looks.add(e.high); }
let total = 0;
for (const l of looks) {
  for (const [p, w, h, lo, hi] of [['c_', 384, 576, 12e3, 90e3], ['s_', 1024, 1536, 60e3, 900e3]]) {
    const f = `${U}/${p}${l}.webp`; if (!fs.existsSync(f)) { bad('missing ' + f); continue; }
    const sz = fs.statSync(f).size; total += sz; const d = webpSize(f);
    ok(d && d[0] === w && d[1] === h, `${p}${l}.webp is ${d} not ${w}x${h}`); ok(sz >= lo && sz <= hi, `${p}${l}.webp size ${sz}`);
  }
}
for (const f of fs.readdirSync(U)) total += looks.has(f.replace(/^[cs]_/, '').replace(/\.webp$/, '')) ? 0 : fs.statSync(U + '/' + f).size;      // (files in the folder that no kind uses: Part B cast cards etc., they count too)
ok(total <= 22 * 1024 * 1024, 'assets over 22 MB: ' + (total / 1048576).toFixed(2));
// Part B (the story characters gallery): chars.js lists 24 keys, each with a card + a sheet and a credit entry
const CH = U + '/chars.js', cast = fs.existsSync(CH) ? [...fs.readFileSync(CH, 'utf8').matchAll(/^\s*\['([a-z]+)', '/gm)].map((m) => m[1]) : [];
if (fs.existsSync(CH)) {
  ok(cast.length === 24 && new Set(cast).size === 24, 'chars.js should list 24 distinct characters, found ' + cast.length);
  for (const k of cast) for (const [p, w, h, lo, hi] of [['c_', 384, 576, 12e3, 90e3], ['s_', 1024, 1536, 60e3, 900e3]]) {
    const f = `${U}/${p}${k}.webp`; if (!fs.existsSync(f)) { bad('missing ' + f); continue; }
    const sz = fs.statSync(f).size, d = webpSize(f); ok(d && d[0] === w && d[1] === h, `${p}${k}.webp is ${d} not ${w}x${h}`); ok(sz >= lo && sz <= hi, `${p}${k}.webp size ${sz}`);
  }
}
const cr = JSON.parse(fs.readFileSync(A + '/credits_units.json', 'utf8')); const ids = new Set(cr.items.map((i) => i.id)); for (const l of looks) ok(ids.has(l), 'credits_units.json lacks ' + l);
for (const k of cast) ok(ids.has(k), 'credits_units.json lacks the character ' + k);
for (const i of cr.items) ok(i.name && i.by && i.license && i.group, 'credits item incomplete ' + i.id);
// the level rule
const at = (k) => MAP.kinds[k].at || 16;
for (const k of kinds) { const e = MAP.kinds[k]; if (e && e.low !== e.high) { ok(at(k) > DEFS.units[k].lv, `${k}: look 2 starts at ${at(k)} but the unit opens at ${DEFS.units[k].lv} (look 1 would never show)`); ok(at(k) <= DEFS.max_level, k + ': at above max level'); } }
// wording + secrets in everything this job owns
const OWN = [SRC + '/unitcards.js', SRC + '/armyui.js', SRC + '/units_looks.json', A + '/credits_units.json']; if (fs.existsSync(CH)) OWN.push(CH);
const dir = '/home/claude/dev/ar1'; for (const f of fs.readdirSync(dir)) if (/\.(js|mjs|py|sh|html|json)$/.test(f) && !/bundle/.test(f)) OWN.push(dir + '/' + f);
const SECRET = [/sk-[A-Za-z0-9]{16,}/, /ghp_[A-Za-z0-9]{16,}/, /github_pat_/, /AKIA[0-9A-Z]{12,}/, /-----BEGIN [A-Z ]*PRIVATE/, /keys\.env/, /bw_art/, /TRIPO_API_KEY\s*=/, /OPENAI_API_KEY\s*=/, /Bearer [A-Za-z0-9._-]{20,}/];
for (const f of OWN) { const s = fs.readFileSync(f, 'utf8'); for (const re of SECRET) if (re.test(s) && !f.endsWith('ar1_static.mjs')) bad('secret-looking string in ' + f + ' ' + re); }
for (const f of [SRC + '/unitcards.js', SRC + '/armyui.js', SRC + '/units_looks.json', ...(fs.existsSync(CH) ? [CH] : [])]) {
  const s = fs.readFileSync(f, 'utf8'); const strs = s.match(/(['"`])(?:(?!\1)[^\\\n]|\\.)*\1/g) || [];
  for (const q of strs) if (/\bbot\b|ربات/i.test(q) && !/^['"`](bot|kind|bot_ratio)['"`]$/.test(q)) bad(`the word bot in ${path.basename(f)}: ${q.slice(0, 60)}`);
}
// ownership: other client files changed since the snapshot may only carry <= 12 "// AR1:" lines, never the forbidden ones
const FORBID = /^(world|castle.*|rpg.*)\.js$|\.py$/; let marked = 0; const changed = [];
for (const f of fs.readdirSync(SRC)) {
  const a = SRC + '/' + f, b = SNAP + '/' + f; const cur = fs.readFileSync(a); if (!fs.existsSync(b)) { changed.push(f + ' (new)'); continue; }
  if (Buffer.compare(cur, fs.readFileSync(b)) !== 0) { changed.push(f); if (!['armyui.js'].includes(f)) { const n = (cur.toString().match(/\/\/ AR1:/g) || []).length; marked += n; ok(!FORBID.test(f), 'forbidden file changed: ' + f); ok(n > 0, f + ' changed without an AR1 mark'); } }
}
ok(marked <= 12, 'more than 12 AR1-marked lines in other files: ' + marked);
for (const f of ['main.js']) ok(Buffer.compare(fs.readFileSync(SRC + '/' + f), fs.readFileSync(SNAP + '/' + f)) === 0, f + ' changed');
// mapping logic through the real module (bundled by ar1_test.sh)
const mod = await import(process.argv[2]);
const t = (k, l, want) => ok(mod.lookAt(k, l) === want, `lookAt(${k},${l}) = ${mod.lookAt(k, l)} want ${want}`);
t('spear', 1, 'spearman_1'); t('spear', 15, 'spearman_1'); t('spear', 16, 'spearman_2'); t('spear', 50, 'spearman_2'); t('guard', 3, 'shieldbearer'); t('guard', 40, 'shieldbearer');
t('dragon', 27, 'dragon_1'); t('dragon', 32, 'dragon_1'); t('dragon', 33, 'dragon_2'); t('trebuchet', 18, 'trebuchet_1'); t('trebuchet', 24, 'trebuchet_2');
ok(mod.lookAt('nope', 5) === null, 'unknown kind must give null'); ok(mod.levelFor('dragon', 3) === 27, 'levelFor must lift a locked unit to its unlock level');
for (const k of kinds) { const r = mod.rangesOf(k); ok(r.length >= 1 && r.every((x) => x.from <= x.to), 'bad ranges for ' + k); }
console.log(fails.length ? 'AR1 STATIC FAIL:\n - ' + fails.join('\n - ') : `AR1 STATIC OK (31 kinds, ${looks.size} looks, ${cast.length} cast, assets ${(total / 1048576).toFixed(2)} MB, changed vs snapshot: ${changed.join(', ')})`);
process.exit(fails.length ? 1 : 0);
