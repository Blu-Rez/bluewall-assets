// p41_map.mjs <plan.json> <out.html> [title]  (p41: b1_map.mjs + the lots the town does NOT build yet — production role P — drawn dim; what is built stays solid)
// b1_map.mjs <plan.json> <out.html> [title]  — top-down role map of a B1 plan (SVG in an HTML page, Persian legend); b1_shot.py turns it into a PNG
import fs from 'fs';
const [, , inp, out, title = 'نقشه‌ی نقش ساختمان‌ها — سطح ۳۰'] = process.argv;
const { lay, list, meta, kinds } = JSON.parse(fs.readFileSync(inp, 'utf8'));
const BUILT = new Set(['cottage', 'craftsman', 'merchant', 'noble', 'market', 'tavern', 'townhall', 'chapel', 'well']);
const COL = {
  cottage: '#8fc1ff', craftsman: '#ffbf47', merchant: '#43d9c4', noble: '#b98cff',
  market: '#ffe27a', tavern: '#ff8f4d', townhall: '#ffffff', chapel: '#ff9ccb', well: '#35c8ff',
  sawmill: '#7bd43f', masonry: '#a9b4c2', smelter: '#ff5a36', mint: '#ffd400', refinery: '#ff2f2f', mill: '#e8d3a8', bakery: '#ffa86b', butcher: '#d1495b', smokehouse: '#1fb5a8', jeweler: '#f06bf0',
  stores: '#6f86a3',
};
const GROUPS = [['خانه‌ها', ['cottage', 'craftsman', 'merchant', 'noble']], ['ساختمان‌های عمومی', ['townhall', 'market', 'tavern', 'chapel', 'well']], ['فرآوری', ['sawmill', 'masonry', 'smelter', 'mint', 'refinery', 'mill', 'bakery', 'butcher', 'smokehouse', 'jeweler']], ['انبار', ['stores']]];
const FA = {}; for (const [k, v] of Object.entries(kinds || {})) FA[k] = v.fa; for (const p of list) FA[p.kind] = p.fa;
const cnt = {}; for (const p of list) cnt[p.kind] = (cnt[p.kind] || 0) + 1;
const poly = (pts) => pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const rect = (p, fill, extra = '') => `<g transform="translate(${p.x} ${p.z}) rotate(${(-p.ry * 180 / Math.PI).toFixed(2)})"><rect x="${-p.w / 2}" y="${-p.d / 2}" width="${p.w}" height="${p.d}" fill="${fill}" stroke="#06101f" stroke-width="0.35" ${extra}/><rect x="${-p.w / 2}" y="${p.d / 2 - 1.1}" width="${p.w}" height="1.1" fill="#06101f" opacity="0.55"/></g>`;
let svg = '';
svg += `<polygon points="${poly(lay.town)}" fill="#0f2142" stroke="#8fa3b8" stroke-width="2.2" stroke-linejoin="round"/>`;
svg += `<polygon points="${poly(lay.outer)}" fill="#13264a" stroke="#9db4d0" stroke-width="1.6"/>`;
// moat band round the Blue Wall (dashed offset ring)
svg += `<polygon points="${poly(lay.outer)}" fill="none" stroke="#2c5fa8" stroke-width="${(lay.moat.half * 2).toFixed(1)}" opacity="0.0"/>`;
for (const s of lay.streets) svg += `<polyline points="${poly(s.pts)}" fill="none" stroke="#33466b" stroke-width="${s.w}" stroke-linecap="butt" stroke-linejoin="round"/>`;
svg += `<polyline points="${poly(lay.river.pts)}" fill="none" stroke="#1f6fd1" stroke-width="${lay.river.half * 2}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
svg += `<polyline points="${poly(lay.river.pts)}" fill="none" stroke="#7fc0ff" stroke-width="1" opacity="0.5"/>`;
// quarter rays
const C = { x: lay.town.reduce((a, p) => a + p[0], 0) / lay.town.length, z: lay.town.reduce((a, p) => a + p[1], 0) / lay.town.length };
for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4; svg += `<line x1="${C.x}" y1="${C.z}" x2="${C.x + Math.cos(a) * 200}" y2="${C.z + Math.sin(a) * 200}" stroke="#ffffff" stroke-width="0.4" stroke-dasharray="3 3" opacity="0.28"/>`; }
for (const f of lay.fixed) if (f.kind === 'vault') svg += `<circle cx="${f.x}" cy="${f.z}" r="${f.r}" fill="none" stroke="#c9a4ff" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.8"/><text x="${f.x}" y="${f.z + 1.5}" font-size="4.6" fill="#c9a4ff" text-anchor="middle" opacity="0.9">گنجینه ${f.res === 'ruby' ? 'یاقوت' : f.res === 'emerald' ? 'زمرد' : 'فیروزه'}</text>`;
for (const p of list) {
  if (p.kind === 'market') { svg += `<circle cx="${p.x}" cy="${p.z}" r="${p.r}" fill="${COL.market}" fill-opacity="0.28" stroke="${COL.market}" stroke-width="0.8"/>`; continue; }
  if (p.kind === 'stores') { svg += `<circle cx="${p.x}" cy="${p.z}" r="${p.r}" fill="${COL.stores}" fill-opacity="0.22" stroke="${COL.stores}" stroke-width="0.6" stroke-dasharray="2 1.5"/>`; continue; }
  svg += BUILT.has(p.kind) ? rect(p, COL[p.kind] || '#fff') : rect(p, COL[p.kind] || '#fff', 'fill-opacity="0.22" stroke-dasharray="1.2 0.8" stroke="#8fa3b8"');
}
// labels for non-home buildings, pushed apart so they do not sit on each other
{ const boxes = [], FS = 4.6;
  const items = list.filter((p) => ['market', 'tavern', 'townhall', 'chapel'].includes(p.kind)).map((p) => ({ p, lab: p.kind === 'stores' ? ({ wood: 'انبار چوب', stone: 'انبار سنگ', iron: 'انبار آهن', gold: 'خزانه', oil: 'انبار نفت', food: 'انبار غذا' }[p.res] || 'انبار') : p.fa }));
  const hit = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
  const offs = [[0, 0], [0, -6], [0, 6], [0, -12], [0, 12], [-14, 0], [14, 0], [-14, -8], [14, 8], [-14, 8], [14, -8], [0, -18], [0, 18]];
  for (const it of items) {
    const w = Array.from(it.lab).length * FS * 0.62 + 2, h = FS + 1.5; let best = null, bo = 1e9;
    for (const [dx, dz] of offs) { const b = { x: it.p.x + dx, y: it.p.z + dz, w, h }; const n = boxes.filter((q) => hit(b, q)).length; if (n < bo) { bo = n; best = { b, dx, dz }; } if (!n) break; }
    boxes.push(best.b);
    if (best.dx || best.dz) svg += `<line x1="${it.p.x}" y1="${it.p.z}" x2="${best.b.x}" y2="${best.b.y}" stroke="#fff" stroke-width="0.35" opacity="0.7"/>`;
    svg += `<text x="${best.b.x}" y="${best.b.y + 1.5}" font-size="${FS}" font-weight="700" fill="#fff" stroke="#06101f" stroke-width="1.3" paint-order="stroke" text-anchor="middle">${it.lab}</text>`;
  } }
for (const g of lay.gates) svg += `<circle cx="${g.x}" cy="${g.z}" r="3" fill="#fff" opacity="0.9"/>`;
svg += `<circle cx="${lay.keep.x}" cy="${lay.keep.z}" r="4" fill="#ffd400"/><text x="${lay.keep.x}" y="${lay.keep.z + 11}" font-size="5.5" fill="#ffd400" text-anchor="middle">برج اصلی</text>`;
// supply sites: arrows + names at the rim of the view
const SF = { lumber: 'چوب‌بری', quarry: 'معدن سنگ', iron: 'معدن آهن', gold: 'معدن طلا', oil: 'میدان نفت', farm: 'مزرعه', livestock: 'دامداری', slaughter: 'کشتارگاه', fishery: 'ماهیگیری', greenhouse: 'گلخانه' };
for (const s of lay.sites) { const l = Math.hypot(s.x - C.x, s.z - C.z), ux = (s.x - C.x) / l, uz = (s.z - C.z) / l, rr = 190, x = C.x + ux * rr, z = C.z + uz * rr;
  svg += `<line x1="${C.x + ux * 172}" y1="${C.z + uz * 172}" x2="${x}" y2="${z}" stroke="#7aa2d6" stroke-width="0.6" opacity="0.7"/><text x="${x}" y="${z + 1.5}" font-size="5" fill="#9fc0ee" text-anchor="middle" paint-order="stroke" stroke="#06101f" stroke-width="1">${SF[s.kind] || s.kind}</text>`; }
const legend = GROUPS.map(([g, ks]) => `<h3>${g}</h3>` + ks.map((k) => `<div class="row"><i style="background:${COL[k]}"></i><span>${FA[k] || k}</span><b>${cnt[k] || 0}</b></div>`).join('')).join('');
const total = list.length;
fs.writeFileSync(out, `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><style>
body{margin:0;background:#07101f;color:#e8eefb;font-family:'DejaVu Sans',sans-serif;display:flex;width:2150px;height:1700px}
#m{width:1700px;height:1700px}#l{width:450px;padding:28px 26px;box-sizing:border-box;background:#0a1730;border-right:2px solid #1b2f55}
h1{font-size:30px;margin:0 0 6px;color:#9fd0ff}h2{font-size:18px;margin:0 0 18px;font-weight:400;color:#8fa3b8}h3{font-size:21px;margin:20px 0 8px;color:#ffd166;border-bottom:1px solid #223a66;padding-bottom:4px}
.row{display:flex;align-items:center;gap:12px;font-size:21px;margin:5px 0}.row i{width:26px;height:26px;border-radius:5px;flex:none;border:1px solid #06101f}.row span{flex:1}.row b{font-size:21px;color:#fff}
.note{margin-top:22px;font-size:16px;color:#8fa3b8;line-height:1.6}
</style><body><svg id="m" viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg">${svg}</svg><div id="l"><h1>${title}</h1><h2>${total} ساختمان · شمال بالا، شرق راست</h2>${legend}<div class="note">خط سفید خط‌چین = مرز ۸ محله (در هر محله یک چاه)<br>نوار تیره‌ی پایین هر ساختمان = سمت در (رو به خیابان)<br>دایره‌ی خط‌چین = انبارها و گنجینه‌ها (از قبل هستند)<br><b style="color:#ffd166">مستطیل کم‌رنگ خط‌چین = فرآوری (هنوز ساخته نمی‌شود؛ جایش برای خانه‌های ساده‌ی قدیمی آزاد است)</b></div></div></body></html>`);
console.log('wrote', out, total);
