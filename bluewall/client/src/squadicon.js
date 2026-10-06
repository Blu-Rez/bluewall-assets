// The squad emblem (owner 5 Oct 17:10 + 17:43: «آیکن‌ها رو برای هر سرباز بیشتر کار کن، جذاب‌تر و عمیق‌تر، بره تو همون دایره‌ی بزرگ» / «طرح نئون‌طور کم‌رنگ»).
// One emblem per squad, painted once into the ring atlas, in the language of the rings themselves: thin neon lines in the squad's colour, faint, with a soft glow.
//   · a faint pool of light, a hair-line ring with fine ticks and four diamonds (the same vocabulary as the rune ring around it)
//   · the soldier's own glyph, hand drawn (100 x 100 box): crossed spears, sword, bow and arrow, horse head, double axe, wing, egg, dragon, club, shield, crown.  Drawn in four passes:
//     a dark engraved shadow (depth), a wide soft glow, a coloured line and a thin bright core.
// Types without their own glyph use the line icon of the army screen.  Real colours are painted here: the vertex colour only dims it.
import { ICON } from './armyui.js';

const TAU = Math.PI * 2;
const hex = (c) => { const n = parseInt(String(c).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const dot = (x, y, r) => `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`;

// each glyph: a list of paths in a 100 x 100 box; {d, rot} turns a path round (50, 52); {d, soft} is drawn fainter (a detail line)
const SPEAR = ['M50 3L58 25L50 32L42 25Z', 'M50 32L50 95', { d: 'M44 39L56 39', soft: 1 }, { d: 'M47 91L53 91', soft: 1 }];
export const GLYPH = {
  spear: [...SPEAR.map((d) => (typeof d === 'string' ? { d, rot: -25 } : { ...d, rot: -25 })), ...SPEAR.map((d) => (typeof d === 'string' ? { d, rot: 25 } : { ...d, rot: 25 }))],
  sword: ['M50 3L57 20L57 62L50 70L43 62L43 20Z', { d: 'M50 12L50 58', soft: 1 }, 'M26 68L74 68', 'M26 63L26 73', 'M74 63L74 73', 'M50 70L50 87', dot(50, 92, 5)],
  archer: ['M46 6Q96 50 46 94', 'M46 6L24 50L46 94', 'M8 50L96 50', 'M96 50L81 41L81 59Z', { d: 'M8 50L2 43M16 50L10 43M8 50L2 57M16 50L10 57', soft: 1 }, { d: 'M58 22Q74 50 58 78', soft: 1 }],
  cavalry: ['M20 96Q12 62 28 38Q36 24 42 14L47 2L54 14L58 18Q74 20 84 36Q94 50 92 62Q90 72 80 72Q72 72 68 64Q60 70 60 82Q60 90 66 96Z', { d: 'M24 58Q14 58 7 52M27 45Q16 41 11 33M34 33Q24 27 22 19M42 22Q34 16 34 8', soft: 1 }, dot(72, 38, 3), dot(87, 56, 1.8), { d: 'M60 36Q72 50 70 64', soft: 1 }, { d: 'M76 44L88 50', soft: 1 }, 'M64 24L70 18'],
  axerider: ['M50 4L50 96', 'M52 12L90 6Q76 28 90 52L52 42Z', 'M48 12L10 6Q24 28 10 52L48 42Z', { d: 'M54 20L80 16M54 32L78 36M46 20L20 16M46 32L22 36', soft: 1 }, { d: 'M44 86L56 86M44 90L56 90', soft: 1 }],
  pegasus: ['M18 82Q10 34 90 10Q90 26 82 32Q84 42 72 48Q72 58 60 62Q58 70 46 73Q42 80 26 84Z', { d: 'M21 78L84 20', soft: 1 }, { d: 'M22 79L75 38', soft: 1 }, { d: 'M24 80L63 54', soft: 1 }, { d: 'M27 82L50 68', soft: 1 }, 'M20 14L22 22L30 25L22 28L20 36L18 28L10 25L18 22Z'],
  baby: ['M50 10Q82 34 80 64Q78 92 50 92Q22 92 20 64Q18 34 50 10Z', 'M21 58L35 49L45 61L56 47L66 59L79 50', { d: 'M40 30Q50 22 60 30', soft: 1 }, { d: dot(38, 76, 3), soft: 1 }, { d: dot(60, 78, 2.4), soft: 1 }, 'M18 50L8 42L12 56', 'M82 50L92 42L88 56'],
  dragon: ['M50 36L39 26L33 6L45 18L50 16L55 18L67 6L61 26Z', 'M46 36L50 96L54 36', 'M46 48L6 8Q11 30 3 42Q16 42 18 54Q28 50 32 62Q40 58 44 70Z', 'M54 48L94 8Q89 30 97 42Q84 42 82 54Q72 50 68 62Q60 58 56 70Z', { d: 'M46 48L16 30M46 52L12 48M46 56L26 58', soft: 1 }, { d: 'M54 48L84 30M54 52L88 48M54 56L74 58', soft: 1 }, dot(45, 28, 1.8), dot(55, 28, 1.8), { d: 'M46 62L41 68M54 62L59 68M47 76L43 82M53 76L57 82', soft: 1 }],
  giant: ['M16 40Q16 12 50 12Q84 12 84 40L82 66Q74 88 50 90Q26 88 18 66Z', 'M16 44L3 40L14 58', 'M84 44L97 40L86 58', 'M20 39L44 47', 'M80 39L56 47', dot(36, 54, 3.6), dot(64, 54, 3.6), 'M50 52L44 67L56 67Z', 'M28 73Q50 84 72 73', 'M32 76L25 57L38 71Z', 'M68 76L75 57L62 71Z', { d: 'M42 12Q50 3 58 12', soft: 1 }],
  shieldmaiden: ['M50 6L80 17L80 46Q80 74 50 94Q20 74 20 46L20 17Z', { d: 'M50 15L72 23L72 46Q72 66 50 82Q28 66 28 46L28 23Z', soft: 1 }, dot(50, 46, 8), { d: 'M50 28L50 38M50 54L50 70M32 46L42 46M58 46L68 46', soft: 1 }, 'M19 36Q6 34 2 20Q12 24 19 26', 'M81 36Q94 34 98 20Q88 24 81 26'],
  lord: ['M14 76L10 30L34 52L50 14L66 52L90 30L86 76Z', 'M14 86L86 86', { d: 'M17 80L83 80', soft: 1 }, dot(10, 25, 4), dot(50, 9, 4), dot(90, 25, 4), 'M50 52L57 63L50 74L43 63Z'],
  guard: ['M50 6L80 17L80 46Q80 74 50 94Q20 74 20 46L20 17Z', 'M50 24L50 78', 'M32 44L68 44'],
  trebuchet: ['M24 94L48 34L72 94', 'M14 16L48 36L68 60', 'M14 16Q4 34 12 46', dot(12, 52, 5), 'M60 66H80V86H60Z', 'M68 60V66', 'M10 94H90', { d: 'M34 70H62', soft: 1 }],
  cannon: ['M10 58L58 24L72 40L26 74Z', { d: 'M26 50L38 66M42 38L54 54', soft: 1 }, 'M54 18L78 38', 'M20 76a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', { d: 'M32 64V88M20 76H44M23 67L41 85M41 67L23 85', soft: 1 }, dot(86, 22, 6), { d: 'M78 12L84 6M94 14L100 10M92 32L98 36', soft: 1 }],
  ram: ['M30 44L62 14L94 44Z', 'M26 44H96', { d: 'M38 44V58M52 44V58M68 44V58M84 44V58', soft: 1 }, 'M4 55L22 49V81L4 75Z', { d: 'M4 55L12 62L4 68M4 75L12 66', soft: 1 }, 'M22 58H90', 'M22 72H90', 'M90 58V72', { d: 'M44 58V72M62 58V72M76 58V72', soft: 1 }, 'M30 90a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M66 90a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', { d: 'M39 81V99M30 90H48M75 81V99M66 90H84', soft: 1 }],
  catapult: ['M6 70H94', 'M24 84a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', 'M58 84a12 12 0 1 0 24 0a12 12 0 1 0 -24 0', { d: 'M36 72V96M24 84H48M70 72V96M58 84H82', soft: 1 }, 'M26 70L52 34L78 70', 'M82 55L14 14', 'M4 14Q8 32 28 24', dot(14, 6, 5.5), { d: 'M82 55V70', soft: 1 }],
  werewolf: ['M26 36Q50 22 74 36Q82 58 66 72L58 90Q50 96 42 90L34 72Q18 58 26 36Z', 'M27 34L22 6L43 22', 'M73 34L78 6L57 22', 'M33 46L46 51', 'M67 46L54 51', 'M44 79L56 79L50 87Z', { d: 'M50 56V77', soft: 1 }, 'M36 82L40 92L44 84M64 82L60 92L56 84', 'M84 4Q98 16 94 34Q90 20 78 13Q83 10 84 4Z'],
  hill: ['M22 56V42Q22 30 33 30Q38 21 46 25Q52 19 60 23Q68 21 72 30Q80 32 80 45V62Q80 76 70 82L68 94H34L30 82Q22 76 22 56Z', { d: 'M36 31V52M50 27V52M64 27V52', soft: 1 }, 'M24 56Q42 68 64 60', { d: 'M60 59L78 57', soft: 1 }, { d: 'M10 18L19 27M90 18L81 27M50 4V13', soft: 1 }],
  mage: ['M50 2Q66 8 63 16L70 36L30 36L38 16Q40 8 50 2Z', 'M22 40L78 40', { d: 'M36 28L64 28', soft: 1 }, 'M30 46Q27 62 36 69L36 79L64 79L64 69Q73 62 70 46Z', dot(41, 58, 6), dot(59, 58, 6), 'M50 63L45 72L55 72Z', { d: 'M43 79V89M50 79V89M57 79V89', soft: 1 }, 'M36 89L64 89'],
  imp: ['M22 52Q22 26 50 26Q78 26 78 52Q78 82 50 87Q22 82 22 52Z', 'M30 34Q16 26 20 8Q33 14 40 28', 'M70 34Q84 26 80 8Q67 14 60 28', 'M22 50L4 42L20 63Z', 'M78 50L96 42L80 63Z', 'M31 50L44 55', 'M69 50L56 55', 'M32 68Q50 82 68 68', { d: 'M40 73L43 80L46 75M60 73L57 80L54 75', soft: 1 }, { d: 'M50 6V19M43 9L57 16M57 9L43 16', soft: 1 }],
  dragonling: ['M50 22L72 30L80 50L66 62L60 80L50 87L40 80L34 62L20 50L28 30Z', 'M30 34Q10 28 6 6Q26 10 40 28', 'M70 34Q90 28 94 6Q74 10 60 28', 'M20 50L4 58L22 64Z', 'M80 50L96 58L78 64Z', 'M32 42L46 49', 'M68 42L54 49', dot(46, 74, 2.2), dot(54, 74, 2.2), { d: 'M50 22V44', soft: 1 }, { d: 'M44 30L50 38L56 30', soft: 1 }, 'M42 82L44 93L47 84M58 82L56 93L53 84', { d: 'M38 56Q50 66 62 56', soft: 1 }],
  // ---- p35: the new units (hand drawn like the rest: a few big shapes + soft detail lines)
  legionary: ['M22 60Q22 26 50 26Q78 26 78 60V74H22Z', 'M30 24Q50 2 70 24', { d: 'M36 14L36 24M44 8L44 24M56 8L56 24M64 14L64 24', soft: 1 }, 'M22 60L14 86H34V74', 'M78 60L86 86H66V74', { d: 'M32 54H68', soft: 1 }, { d: 'M50 26V54', soft: 1 }],
  captain: ['M28 4V97', 'M28 9H80L67 25L80 41H28Z', { d: 'M36 17H66M36 33H66', soft: 1 }, dot(52, 25, 4), 'M20 97H36', { d: 'M24 4L28 0L32 4', soft: 1 }],
  ogre: ['M44 95L47 42Q38 24 52 9Q72 10 74 30Q72 46 57 43L55 95Z', 'M38 26L24 20', 'M40 40L24 44', 'M74 22L88 14', 'M76 38L91 42', { d: 'M50 46V90M52 14Q62 24 52 34', soft: 1 }, dot(60, 24, 3)],
  gryphon: ['M10 60L4 30L20 38L18 14L36 28L44 8L54 30', 'M30 70Q22 44 44 32Q62 22 76 30L94 44L76 50Q70 60 62 66Q54 86 36 92Z', 'M94 44L84 62L74 52', { d: 'M40 74Q46 62 56 58M34 84Q44 76 50 70', soft: 1 }, dot(62, 38, 3)],
  lich: ['M26 46Q26 20 50 20Q74 20 74 46Q74 58 66 62V74H34V62Q26 58 26 46Z', 'M28 20L32 6L41 14L50 3L59 14L68 6L72 20', dot(40, 46, 7), dot(60, 46, 7), 'M50 54L45 64H55Z', { d: 'M40 74V84M47 74V84M53 74V84M60 74V84', soft: 1 }, 'M90 96V24', dot(90, 16, 7), { d: 'M90 4V9', soft: 1 }],
  treant: ['M22 46Q9 36 22 25Q24 9 42 12Q52 1 63 12Q82 9 82 27Q96 36 82 47Q76 55 63 53H38Q28 54 22 46Z', 'M42 53Q45 72 34 95H66Q55 72 58 53', { d: 'M42 62L22 58L12 68M58 62L78 58L88 68', soft: 1 }, dot(45, 66, 3.2), dot(55, 66, 3.2), { d: 'M44 78Q50 84 56 78', soft: 1 }, { d: 'M34 95L24 99M66 95L76 99', soft: 1 }],
  gryphonknight: ['M10 60L4 30L20 38L18 14L36 28L44 8L54 30', 'M30 70Q22 44 44 32Q62 22 76 30L94 44L76 50Q70 60 62 66Q54 86 36 92Z', 'M94 44L84 62L74 52', { d: 'M12 96L56 6', rot: 0 }, 'M56 6L76 12L60 20', dot(62, 38, 3), { d: 'M40 74Q46 62 56 58', soft: 1 }],
  darkrider: ['M30 86V46Q30 22 50 22Q70 22 70 46V86L60 78H40Z', 'M32 36Q12 32 7 6Q26 12 38 28', 'M68 36Q88 32 93 6Q74 12 62 28', { d: 'M36 54H64', soft: 1 }, { d: 'M50 22V44', soft: 1 }, { d: 'M42 62V72M58 62V72', soft: 1 }, 'M46 54L50 60L54 54'],
  baby3: ['M50 94Q50 64 50 44', 'M50 72Q30 64 24 42', 'M50 72Q70 64 76 42', 'M50 44L43 31L50 16L57 31Z', 'M24 42L15 33L21 19L31 30Z', 'M76 42L85 33L79 19L69 30Z', { d: 'M44 82L18 78L26 92Z', soft: 1 }, { d: 'M56 82L82 78L74 92Z', soft: 1 }, dot(50, 28, 2), dot(22, 31, 1.8), dot(78, 31, 1.8)],
  dragon3: ['M50 94L50 48', 'M50 70Q30 62 24 40', 'M50 70Q70 62 76 40', 'M50 46L42 31L50 12L58 31Z', 'M24 40L14 30L20 14L32 28Z', 'M76 40L86 30L80 14L68 28Z', 'M46 60L4 26Q8 44 2 56Q14 56 16 66Q26 62 30 74Q38 70 44 82Z', 'M54 60L96 26Q92 44 98 56Q86 56 84 66Q74 62 70 74Q62 70 56 82Z', dot(50, 26, 2.2), dot(20, 28, 2), dot(80, 28, 2), { d: 'M46 60L18 38M46 66L12 56', soft: 1 }, { d: 'M54 60L82 38M54 66L88 56', soft: 1 }],
};

function strokeAll(g, items, style) {                                                          // one pass of every path of a glyph
  for (const it of items) {
    const o = typeof it === 'string' ? { d: it } : it; g.save(); if (o.rot) { g.translate(50, 52); g.rotate((o.rot * Math.PI) / 180); g.translate(-50, -52); }
    const P = new Path2D(o.d); style(o, P); g.restore();
  }
}
export function drawGlyph(g, type, col) {                                                      // (the caller has scaled and translated g to the 100 x 100 box)
  const items = GLYPH[type] || (ICON[type] ? [{ d: ICON[type], icon: 1 }] : GLYPH.guard); if (!GLYPH[type] && ICON[type]) { g.save(); g.translate(50, 50); g.scale(100 / 24 * 0.8, 100 / 24 * 0.8); g.translate(-12, -12); }
  const bright = mix(col, [255, 255, 255], 0.35), core = mix(col, [255, 255, 255], 0.82), k = items[0] && items[0].icon ? 0.3 : 1;
  g.lineCap = 'round'; g.lineJoin = 'round';
  strokeAll(g, items, (o, P) => { g.save(); g.translate(2.2, 3); g.lineWidth = 3.6 * (o.icon ? k : 1); g.strokeStyle = 'rgba(2,8,20,0.5)'; g.stroke(P); g.restore(); });                            // engraved shadow
  strokeAll(g, items, (o, P) => { g.save(); g.shadowColor = rgb(col, 0.95); g.shadowBlur = 9; g.lineWidth = (o.soft ? 4 : 6.5) * (o.icon ? k : 1); g.strokeStyle = rgb(col, o.soft ? 0.16 : 0.26); g.stroke(P); g.restore(); });   // soft glow
  strokeAll(g, items, (o, P) => { g.fillStyle = rgb(col, o.soft ? 0 : 0.1); if (!o.soft && !o.icon) g.fill(P); g.lineWidth = (o.soft ? 1.6 : 2.8) * (o.icon ? k : 1); g.strokeStyle = rgb(bright, o.soft ? 0.5 : 0.82); g.stroke(P); });   // the line
  strokeAll(g, items, (o, P) => { g.lineWidth = (o.soft ? 0.7 : 1.1) * (o.icon ? k : 1); g.strokeStyle = rgb(core, o.soft ? 0.5 : 0.95); g.stroke(P); });                                                                             // the bright core
  if (!GLYPH[type] && ICON[type]) g.restore();
}

// paint the emblem for `type` into the S x S cell whose centre is (cx, cy)
export function paintEmblem(g, cx, cy, S, type, color) {
  const R = S * 0.46, col = hex(color), bright = mix(col, [255, 255, 255], 0.35);
  g.save(); g.translate(cx, cy); g.beginPath(); g.rect(-S / 2, -S / 2, S, S); g.clip();
  // the faint pool of light under the glyph
  let gr = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.95); gr.addColorStop(0, rgb(col, 0.3)); gr.addColorStop(0.6, rgb(col, 0.13)); gr.addColorStop(1, rgb(col, 0.02));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 0.95, 0, TAU); g.fill();
  // the hair-line ring, its ticks, an inner ring, four diamonds: the rings' own vocabulary
  g.save(); g.shadowColor = rgb(col, 0.9); g.shadowBlur = S * 0.035; g.strokeStyle = rgb(bright, 0.7); g.lineWidth = S * 0.0115; g.beginPath(); g.arc(0, 0, R * 0.93, 0, TAU); g.stroke(); g.restore();
  g.strokeStyle = rgb(bright, 0.3); g.lineWidth = S * 0.006; g.beginPath(); g.arc(0, 0, R * 0.82, 0, TAU); g.stroke();
  g.strokeStyle = rgb(bright, 0.55); g.lineWidth = S * 0.007; for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU, l = i % 4 === 0 ? 0.075 : 0.035; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.93, Math.sin(a) * R * 0.93); g.lineTo(Math.cos(a) * R * (0.93 + l), Math.sin(a) * R * (0.93 + l)); g.stroke(); }
  g.fillStyle = rgb(mix(col, [255, 255, 255], 0.6), 0.9); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU - Math.PI / 2, x = Math.cos(a) * R * 1.03, y = Math.sin(a) * R * 1.03, s = S * 0.022; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(0, -s * 1.3); g.lineTo(s, 0); g.lineTo(0, s * 1.3); g.lineTo(-s, 0); g.closePath(); g.fill(); g.restore(); }
  // the glyph, centred, about 1.15 R across
  const sc = (S * 0.72) / 100; g.save(); g.scale(sc, sc); g.translate(-50, -50); drawGlyph(g, type, col); g.restore();
  g.restore();
}

// the atlas: one cell per squad (4 per row)
export const CELL = 256, COLS = 4;
export function paintAtlas(types, colorOf) {
  const rows = Math.max(1, Math.ceil(types.length / COLS)), W = CELL * COLS, H = CELL * rows, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  types.forEach((t, i) => paintEmblem(g, (i % COLS) * CELL + CELL / 2, ((i / COLS) | 0) * CELL + CELL / 2, CELL, t, colorOf(t)));
  return { canvas: c, W, H, rows };
}
