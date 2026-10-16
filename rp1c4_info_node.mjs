// rp1c4_info_node.mjs — RP1C_R4: the hero «i» table + the kit reader, no browser.  Prints "INFO_NODE OK" or the failures.
import fs from 'fs';
const A = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/', U = 'file://' + A;
const I = await import(U + 'hero_info.js'), carry = await import(U + 'combat/carry.js');
const bad = []; const t = (c, m) => { if (!c) bad.push(m); };
const KEYS = ['elina', 'elika', 'melika', 'mobina', 'aylin', 'aylar'], EL = { fire: 'آتش', wind: 'باد', plant: 'گیاه', stone: 'خاک و سنگ', water: 'آب', ice: 'یخ' };
const cs = fs.readFileSync(A + 'combat.js', 'utf8'), meta = {}; for (const m of cs.matchAll(/^\s+(\w+):\s+\{ element: '(\w+)'/gm)) meta[m[1]] = m[2];
const all = []; const walk = (v) => { if (typeof v === 'string') all.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
walk(I.INFO); walk(I.LABEL); walk(I.NOTE); walk(I.SKILL_FA); walk(I.KIND_FA);
for (const k of KEYS) {
  const x = I.INFO[k]; t(!!x, k + ': no entry'); if (!x) continue;
  t(x.name && x.role && x.elem, k + ': name / role / elem'); t(x.elem === EL[meta[k]], k + ': elem ' + x.elem + ' != SISTERS ' + meta[k]);
  t(x.legs.length >= 1 && x.cloth.length >= 1, k + ': legs / cloth empty'); t(x.story.length === 2, k + ': story must be 2 lines');
  const own = fs.existsSync(A + 'combat/kit_' + k + '.js'); t(fs.existsSync(A + 'combat/kit_' + x.kit + '.js'), k + ': kit pointer ' + x.kit + ' has no file');
  if (own) t(x.kit === k && x.planned === null, k + ': kit_' + k + '.js exists -> set kit:"' + k + '" and planned:null');
  else t(x.kit !== k && typeof x.planned === 'string' && x.planned.length > 3, k + ': no own kit -> needs a planned-weapon line');
  for (const f of ['c_' + k + '.webp', 'e_' + k + '.png']) { t(fs.existsSync(A + f), f + ' missing'); if (fs.existsSync(A + f)) t(fs.statSync(A + f).size < 100 * 1024, f + ' > 100 KB'); }
}
t(all.length > 40, 'table suspiciously small'); for (const s of all) t(!/ربات|\bbot\b/i.test(s), 'forbidden word in: ' + s);
t(I.fa(0.95) === '۰٫۹۵' && I.fa(12) === '۱۲' && I.fa(1.1) === '۱٫۱', 'fa() digits');
for (const id of new Set(KEYS.map((k) => I.INFO[k].kit))) {
  const kit = (await import(U + 'combat/kit_' + id + '.js')).default, d = I.describeKit(kit, carry);
  t(d.hands.length === kit.weapons.length && d.hands.every((s) => s.includes('—') && !/متر/.test(s)), id + ': hands lines');   // RS1: a hands line names the weapon and where it is carried — never its length in metres (the owner's order, 16 Oct)
  t(d.skills.length === kit.skills.length && d.skills.every((s) => s.n && s.d && !/اثر /.test(s.x)), id + ': every skill needs a SKILL_FA entry + a known effect type');
  t(d.combat.length === 2, id + ': attack / block lines');
}
console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'INFO_NODE OK'); process.exit(bad.length ? 1 : 0);
