// Kingdom crests: hand-drawn heraldic charges on a steel-rimmed shield (no emoji, no flowers).
// One drawing routine (canvas 2D + Path2D) feeds both the 3D flags / banners and the DOM (as a cached data-URL <img>).
// Palette: ice-white, light blue, steel, navy and black. The id is what the server stores (military.EMBLEMS).
//
//   drawCrest(g, id, cx, cy, size)   - draws the crest centred on (cx,cy), `size` px tall
//   crestURL(id, px)                 - cached PNG data URL (px = CSS size; rendered at 2x)
//   crestImg(id, px, cls)            - '<img>' markup
//   normEmblem(e)                    - any stored value (id or an old emoji) -> a valid id
const TAU = Math.PI * 2;

export const EMBLEM_IDS = ['swords', 'wings', 'dragon', 'axes', 'heart', 'crown', 'tower', 'wolf', 'eagle', 'lion', 'bear', 'serpent',
  'flame', 'star', 'moon', 'sun', 'bolt', 'pine', 'anchor', 'arrows', 'stag', 'frost', 'helm', 'gem'];
// the old emoji list (24 + 8 extras) -> the closest crest, so nobody loses their banner
const OLD = ['⚔️', '🗡️', '🐉', '🔨', '❤️', '👑', '🛡️', '🐺', '🦅', '🦁', '🐻', '🐍', '🔥', '⭐', '🌙', '☀️', '⚡', '🌲', '⚓', '🏹', '🏰', '❄️', '🐴', '💎', '🗝️', '🌹', '🦂', '🪓', '🦉', '🐗', '🦊', '💀'];
const OLD_TO = ['swords', 'wings', 'dragon', 'axes', 'heart', 'crown', 'helm', 'wolf', 'eagle', 'lion', 'bear', 'serpent', 'flame', 'star', 'moon', 'sun', 'bolt', 'pine', 'anchor', 'arrows', 'tower', 'frost', 'stag', 'gem', 'tower', 'heart', 'serpent', 'axes', 'eagle', 'bear', 'wolf', 'helm'];
export const LEGACY = Object.fromEntries(OLD.map((e, i) => [e, OLD_TO[i]]));
const strip = (s) => String(s || '').replace(/️/g, '');
const LEG2 = Object.fromEntries(Object.entries(LEGACY).map(([k, v]) => [strip(k), v]));
export function normEmblem(e) {
  if (EMBLEM_IDS.includes(e)) return e;
  return LEG2[strip(e)] || EMBLEM_IDS[0];
}

// --- palette ---------------------------------------------------------------------------------------------
const FIELD = {     // enamel of the field: [lit centre, shadowed edge]
  navy: ['#3a86ea', '#081f52'], ink: ['#46505f', '#04060b'], steel: ['#8099bd', '#1d2c44'],
  deep: ['#2a62c4', '#040c26'], teal: ['#2a93b2', '#042532'], indigo: ['#5867d6', '#080d38'],
};
// charge metals per style: gradient stops over the charge height (a polished "horizon" band across the middle reads as metal)
const FILLS = {
  forged: {
    i: [[0, '#ffffff'], [0.36, '#e4f0fb'], [0.49, '#a3bdd8'], [0.55, '#d2e3f3'], [1, '#86a3c4']],      // polished silver
    s: [[0, '#e9f0f8'], [0.44, '#a9b9ce'], [0.52, '#71839f'], [1, '#55667e']],                         // darker steel
    b: [[0, '#97e4ff'], [0.5, '#3299f2'], [1, '#1150b4']],                                             // blue enamel inlay
    k: [[0, '#0b1a36'], [1, '#050c1c']],                                                               // ink (eyes, slots)
    g: [[0, '#ffffff'], [0.35, '#a6e9ff'], [1, '#2aa3ff']],                                            // jewels / glowing eyes
    d: [[0, '#4189e4'], [1, '#0f3a86']],                                                               // deep blue enamel
  },
  gilded: {
    i: [[0, '#fffbea'], [0.36, '#ffe08c'], [0.49, '#c48d22'], [0.55, '#f1c552'], [1, '#a26f17']],
    s: [[0, '#f6e7bf'], [0.44, '#c9a560'], [0.52, '#8c6a2c'], [1, '#6e5122']],
    b: [[0, '#97e4ff'], [0.5, '#3299f2'], [1, '#1150b4']],
    k: [[0, '#1a1208'], [1, '#090603']],
    g: [[0, '#ffffff'], [0.35, '#a6e9ff'], [1, '#2aa3ff']],
    d: [[0, '#4189e4'], [1, '#0f3a86']],
  },
  flat: {
    i: [[0, '#f7fcff'], [1, '#a8d6ff']], b: [[0, '#52c6ff'], [1, '#1b78dd']], s: [[0, '#dde6f2'], [1, '#7d91ad']],
    k: [[0, '#0b1a36'], [1, '#050c1c']], g: [[0, '#d8f4ff'], [1, '#37b8ff']], d: [[0, '#2b6fd0'], [1, '#0f3a86']],
  },
};
// rim metal / studs / relief light per style
const RIMS = {
  forged: { rim: [[0, '#f6faff'], [0.2, '#bccadc'], [0.44, '#5e6f89'], [0.52, '#8798b1'], [0.78, '#d6e1ee'], [1, '#55667f']],
    stud: ['#ffffff', '#aebdd2', '#36445b'], bezel: [[0, '#ffffff'], [0.5, '#9fb0c8'], [1, '#3a4860']], hi: '#ffffff', lo: '#030a1c', line: 'rgba(2,8,20,0.92)' },
  gilded: { rim: [[0, '#fff8de'], [0.2, '#f3cf6e'], [0.44, '#8f6215'], [0.52, '#c3912c'], [0.78, '#ffe39a'], [1, '#7c5512']],
    stud: ['#fffbe8', '#e9bd55', '#6d4a10'], bezel: [[0, '#fffbe8'], [0.5, '#e2b24a'], [1, '#6d4a10']], hi: '#fffaf0', lo: '#1c1004', line: 'rgba(30,18,4,0.92)' },
};
const OUT = 'rgba(2,9,24,0.88)';

// --- little path helpers ---------------------------------------------------------------------------------
const f1 = (n) => +n.toFixed(2);
function poly(pts) { return 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + ' Z'; }
function starPts(cx, cy, n, r1, r2, rot = -Math.PI / 2) { const o = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, r = i % 2 ? r2 : r1; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }
function circle(cx, cy, r) { return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`; }
function ellipse(cx, cy, rx, ry) { return `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`; }

// ops: [style, path, {r:rotation deg about (50,50), mx:mirror, w:stroke width (stroke op), ol:false (no outline), a:alpha}]
const mir = (st, d, o = {}) => [[st, d, o], [st, d, { ...o, mx: 1 }]];
const sword = (r, mx) => [                                       // a longsword: tapered blade ending in a point, fuller, curved guard, wrapped grip, pommel
  ['i', 'M46.1 62 L46.1 33 C46.3 24 48.4 17 50 7 C51.6 17 53.7 24 53.9 33 L53.9 62 Z', { r, mx }],
  ['s', 'M50 8 C51.6 17 53.7 24 53.9 33 L53.9 62 L50 62 Z', { r, mx, ol: false, a: 0.6 }],
  ['k', 'M49.45 20 H50.55 V58 H49.45 Z', { r, mx, ol: false, a: 0.5 }],
  ['s', 'M35 63 C35 59.5 38.5 59 42 59 H58 C61.5 59 65 59.5 65 63 C65 66.5 62 67.6 58 66.6 H42 C38 67.6 35 66.5 35 63 Z', { r, mx }],
  ['i', circle(35, 63, 2.3), { r, mx }], ['i', circle(65, 63, 2.3), { r, mx }],
  ['d', 'M47.3 66.5 H52.7 V78.5 H47.3 Z', { r, mx }],
  ['s', circle(50, 82, 4.2), { r, mx }], ['b', circle(50, 82, 1.8), { r, mx, ol: false }],
];
const axe = (r, mx) => [
  ['s', 'M48.2 24 H51.8 V86 H48.2 Z', { r, mx }],
  ['i', 'M52 22 C68 15 82 22 82 40 C82 52 76 58 70 62 C72 52 68 44 52 44 Z', { r, mx }],
  ['b', 'M56 28 C66 25 74 28 76 38 C70 34 62 33 56 34 Z', { r, mx, ol: false, a: 0.7 }],
  ['d', 'M47 84 H53 V90 H47 Z', { r, mx }],
];
const arrow = (r) => { const o = { r, p: [50, 90] }; return [
  ['s', 'M48.8 22 H51.2 V88 H48.8 Z', o],
  ['i', 'M50 6 L60 28 L50 23 L40 28 Z', o],
  ['b', 'M50 74 L60 90 H54 L50 84 L46 90 H40 Z', o],
  ['b', 'M50 62 L58 74 H53 L50 69 L47 74 H42 Z', o],
]; };

const CHARGES = {
  // two blades crossed over a small steel ring
  swords: () => [...sword(-42), ...sword(42, 1)],
  // a blade rising between two wings of feathers
  wings: () => [
    ...mir('s', 'M45 60 L14 46 L24 44 L8 32 L22 32 L14 20 L32 26 L26 14 L44 34 Z'),
    ...mir('i', 'M45 56 L24 44 L34 43 L22 33 L34 34 L28 26 L44 38 Z', { ol: false, a: 0.85 }),
    ...sword(0),
  ],
  // the head of a dragon, front on, horned, eyes alight
  dragon: () => [
    ...mir('s', 'M54 34 C58 24 66 16 78 12 C73 21 70 28 70 38 Z'),
    ...mir('s', 'M56 54 L82 48 L76 58 L90 62 L72 68 L66 72 Z'),
    ['i', 'M50 24 C60 24 68 32 70 42 L76 52 L68 58 L66 70 L58 80 L56 90 L50 86 L44 90 L42 80 L34 70 L32 58 L24 52 L30 42 C32 32 40 24 50 24 Z', {}],
    ...mir('k', 'M54 42 L68 38 L64 48 L56 50 Z', { ol: false }),
    ...mir('g', 'M56 44 L65 41 L63 46 L57 48 Z', { ol: false }),
    ...mir('b', 'M52 62 L58 68 L55 76 L52 70 Z', { a: 0.85 }),
    ...mir('k', circle(54, 62, 1.9), { ol: false }),
    ...mir('s', 'M48 80 L50 90 L52 80 Z', { ol: false }),
    ['b', 'M47 30 L50 36 L53 30 L50 24 Z', {}],
  ],
  // two axes crossed
  axes: () => [...axe(-34, 1), ...axe(34), ['b', circle(50, 52, 4.5), {}]],
  // the Blue Hearts heart, cut like a gem
  heart: () => [
    ['b', 'M50 84 C22 64 14 44 20 32 C26 20 42 20 50 32 C58 20 74 20 80 32 C86 44 78 64 50 84 Z', {}],
    ['d', 'M50 84 C74 68 84 50 80 34 C79 52 68 68 50 84 Z', { ol: false, a: 0.7 }],
    // cut like a gem: a table and facets catching the light
    ['g', 'M50 34 L40 27 C33 25 25 27 22 33 L36 42 Z', { ol: false, a: 0.55 }],
    ['i', 'M50 34 L36 42 L50 52 L64 42 Z', { ol: false, a: 0.32 }],
    ['k', 'M50 52 L64 42 L79 33 C82 46 74 60 50 84 Z', { ol: false, a: 0.18 }],
    ['k', 'M22 33 L36 42 L50 52 L64 42 L79 33 M50 34 L36 42 M50 34 L64 42 M50 52 L50 83 M36 42 L31 64 M64 42 L69 64', { w: 0.9, ol: false, a: 0.4 }],
    ['i', 'M26 38 C25 30 32 26 39 29', { w: 4.2, ol: false }],
    ['i', circle(31, 45, 2.6), { ol: false, a: 0.9 }],
  ],
  crown: () => [
    ['i', 'M22 34 L38 52 L50 28 L62 52 L78 34 L74 68 H26 Z', {}],
    ['s', 'M24 66 H76 V77 H24 Z', {}],
    ['b', 'M34 64 L38 52 L50 66 L62 52 L66 64 Z', { ol: false, a: 0.55 }],
    ['g', circle(22, 31, 4.6), {}], ['g', circle(50, 25, 4.6), {}], ['g', circle(78, 31, 4.6), {}],
    ['g', poly([[34, 71.5], [37.5, 68], [41, 71.5], [37.5, 75]]), { ol: false }], ['g', poly([[48.5, 71.5], [50, 68], [51.5, 71.5], [50, 75]]), { ol: false }], ['g', poly([[59, 71.5], [62.5, 68], [66, 71.5], [62.5, 75]]), { ol: false }],
  ],
  // a castle keep, flag flying
  tower: () => [
    ['k', 'M49.4 10 H50.8 V30 H49.4 Z', { ol: false }], ['b', 'M50 10 L66 15 L50 21 Z', {}],
    ['i', 'M28 82 V30 H38 V37 H44 V30 H56 V37 H62 V30 H72 V82 Z', {}],
    ['s', 'M28 46 H72 V51 H28 Z', { ol: false, a: 0.9 }],
    ['d', 'M28 51 H72 V82 H28 Z', { ol: false, a: 0.35 }],
    ['k', 'M42 82 V68 C42 58 58 58 58 68 V82 Z', { ol: false }],
    ['k', 'M47.5 37 H52.5 V47 H47.5 Z', { ol: false }],
    ['b', 'M37.5 60 H40.5 V68 H37.5 Z M59.5 60 H62.5 V68 H59.5 Z', { ol: false }],
  ],
  // a wolf, front on
  wolf: () => [
    ['i', 'M50 26 L60 30 L68 14 L74 42 L82 54 L72 62 L66 74 L56 82 L50 88 L44 82 L34 74 L28 62 L18 54 L26 42 L32 14 L40 30 Z', {}],
    ...mir('b', 'M62 30 L68 20 L70 38 Z', { ol: false, a: 0.85 }),
    ...mir('s', 'M50 54 L60 62 L50 80 L40 62 Z', { ol: false, a: 0.55 }),
    ...mir('k', 'M54 46 L68 42 L64 52 L56 52 Z', { ol: false }),
    ...mir('g', 'M57 47 L66 45 L63 50 L58 50 Z', { ol: false }),
    ['k', 'M43 66 H57 L50 76 Z', { ol: false }],
    ...mir('s', 'M68 60 L78 66 L68 70 Z', { ol: false, a: 0.8 }),
  ],
  // an eagle with its wings spread
  eagle: () => [
    ...mir('s', 'M55 46 C66 38 80 30 92 36 L84 40 L92 46 L82 48 L88 58 L76 54 L78 64 L66 58 L56 68 Z'),
    ...mir('i', 'M55 48 C64 42 74 36 84 38 L78 42 L84 47 L76 50 L80 56 L70 53 L70 60 L60 56 Z', { ol: false, a: 0.85 }),
    ['i', 'M50 36 C56 36 58 42 58 50 L58 64 L50 74 L42 64 L42 50 C42 42 44 36 50 36 Z', {}],
    // the head in profile, turned to dexter: a hooked beak, a fierce eye, a ruff of neck feathers
    ['s', 'M43 40 L41 33 L45 35 L44 29 L49 33 L50 27 L54 33 L57 29 L57 36 L60 34 L57 41 Z', {}],
    ['i', 'M45 37 C41 31 42 22 49 19 C55 17 60 20 60 26 C60 31 57 35 55 38 Z', {}],
    ['b', 'M45.5 22.5 C40 21.5 35 24 34.5 29.5 C34.4 31 35.6 31.6 36.4 30.4 C38 28 41 27.6 44.6 28.4 Z', {}],
    ['k', 'M47.8 23.2 L53.4 21.6 L52.2 24.6 Z', { ol: false }], ['g', circle(51.4, 23.1, 0.85), { ol: false }],
    ['s', 'M43 72 H57 L60 88 L50 82 L40 88 Z', {}],
    ['d', 'M50 50 L55 58 L50 70 L45 58 Z', { ol: false, a: 0.7 }],
  ],
  // a lion's head and mane
  lion: () => [
    ['d', poly(starPts(50, 52, 14, 44, 33)), {}],
    ['b', poly(starPts(50, 52, 14, 37, 29)), { ol: false, a: 0.85 }],
    ['i', 'M50 26 C64 26 72 36 72 50 C72 62 66 72 58 78 L50 82 L42 78 C34 72 28 62 28 50 C28 36 36 26 50 26 Z', {}],
    ...mir('k', 'M36 46 L47 49 L45 53 L35 51 Z', { ol: false }),
    ...mir('g', 'M38 47.5 L45 49.5 L44 51.5 L37.5 50.5 Z', { ol: false }),
    ['s', 'M43 58 H57 L50 68 Z', { ol: false, a: 0.8 }], ['k', 'M44 57 H56 L50 63 Z', { ol: false }],
    ['k', 'M50 63 V70 M50 70 C46 74 42 73 40 70 M50 70 C54 74 58 73 60 70', { w: 1.6, ol: false }],
  ],
  // a bear's head
  bear: () => [
    ...mir('s', circle(29, 32, 11)), ...mir('b', circle(29, 32, 5.5), { ol: false }),
    ['i', 'M50 22 C70 22 80 36 80 52 C80 70 66 84 50 84 C34 84 20 70 20 52 C20 36 30 22 50 22 Z', {}],
    ['s', ellipse(50, 66, 15, 12), { ol: false }],
    ['k', 'M43 58 H57 L50 67 Z', { ol: false }],
    ['k', 'M50 67 V73 M50 73 C46 77 42 76 40 73 M50 73 C54 77 58 76 60 73', { w: 1.5, ol: false }],
    ...mir('k', 'M33 42 L47 47 L45 51 L33 47 Z', { ol: false }), ...mir('g', circle(40, 49, 2.4), { ol: false }),
  ],
  // a coiled serpent
  serpent: () => [
    ['k', 'M62 28 C34 20 22 46 46 52 C68 58 66 80 36 76', { w: 14, ol: false, a: 0.9 }],
    ['i', 'M62 28 C34 20 22 46 46 52 C68 58 66 80 36 76', { w: 10 }],
    ['b', 'M62 28 C34 20 22 46 46 52 C68 58 66 80 36 76', { w: 4.2, ol: false, a: 0.8 }],
    ['i', 'M58 22 C62 14 76 14 80 22 C82 28 74 34 66 33 C60 32 56 28 58 22 Z', {}],
    ['k', circle(70, 21, 1.8), { ol: false }], ['g', circle(70.4, 20.6, 0.9), { ol: false }],
    ['k', 'M80 24 L88 26 M88 26 L92 23 M88 26 L92 29', { w: 1.4, ol: false }],
  ],
  // a blue flame
  flame: () => [
    ['b', 'M50 8 C54 26 74 34 72 58 C71 74 62 86 50 86 C38 86 29 74 28 58 C27 46 34 40 38 28 C41 36 44 38 46 38 C44 28 46 18 50 8 Z', {}],
    ['i', 'M50 42 C53 54 62 58 61 70 C60 78 56 82 50 82 C44 82 40 78 39 70 C38 60 45 56 50 42 Z', {}],
    ['g', 'M50 60 C52 66 55 68 54 73 C53 77 51 78 50 78 C49 78 47 77 46 73 C45 68 48 66 50 60 Z', { ol: false, a: 0.9 }],
  ],
  // an eight-pointed compass star
  star: () => {
    const o = [], P = starPts(50, 50, 8, 40, 14);
    for (let i = 0; i < 8; i++) {
      const a = P[i * 2], b = P[(i * 2 + 1) % 16], c = P[(i * 2 + 15) % 16], long = i % 2 === 0, r = long ? 1 : 0.7;
      const tip = [50 + (a[0] - 50) * r, 50 + (a[1] - 50) * r];
      o.push([i % 2 ? 's' : 'i', poly([[50, 50], c, tip]), { ol: true }], ['b', poly([[50, 50], tip, b]), { ol: true, a: 0.95 }]);
    }
    o.push(['g', circle(50, 50, 5), {}]);
    return o;
  },
  moon: () => {
    const c1 = [46, 52, 35], c2 = [62, 42, 29], dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy);
    const a = (c1[2] ** 2 - c2[2] ** 2 + d * d) / (2 * d), h = Math.sqrt(c1[2] ** 2 - a * a), mx = c1[0] + (a * dx) / d, my = c1[1] + (a * dy) / d;
    const P1 = [mx + (h * dy) / d, my - (h * dx) / d], P2 = [mx - (h * dy) / d, my + (h * dx) / d];
    const A = (p) => f1(p[0]) + ' ' + f1(p[1]);
    return [
      ['i', `M${A(P1)} A${c1[2]} ${c1[2]} 0 1 0 ${A(P2)} A${c2[2]} ${c2[2]} 0 1 1 ${A(P1)} Z`, {}],
      ['g', poly(starPts(72, 62, 4, 11, 3.4)), {}],
      ['g', poly(starPts(66, 26, 4, 6.5, 2.2)), {}],
    ];
  },
  sun: () => [
    ['b', poly(starPts(50, 50, 12, 42, 24)), {}],
    ['i', poly(starPts(50, 50, 12, 36, 24, -Math.PI / 2 + Math.PI / 12)), { ol: false, a: 0.7 }],
    ['i', circle(50, 50, 19), {}], ['g', circle(50, 50, 12.5), { ol: false }], ['i', circle(46, 46, 4.5), { ol: false, a: 0.9 }],
  ],
  bolt: () => [
    ['b', 'M60 8 L26 54 H45 L38 92 L76 42 H55 Z', {}],
    ['i', 'M58 16 L34 50 H49 L44 78 L68 46 H52 Z', { ol: false, a: 0.9 }],
    ['g', 'M57 24 L42 46 H51 L48 62 L61 44 H52 Z', { ol: false, a: 0.8 }],
  ],
  pine: () => [
    ['s', 'M45 76 H55 V90 H45 Z', {}],
    ['d', 'M50 10 L66 34 H58 L72 54 H62 L80 76 H20 L38 54 H28 L42 34 H34 Z', {}],
    ['i', 'M50 10 L66 34 H58 L72 54 H62 L80 76 H50 Z', { ol: false, a: 0.88 }],
    ['b', 'M50 22 L58 34 L50 34 Z M50 44 L62 54 L50 54 Z M50 62 L68 76 L50 76 Z', { ol: false, a: 0.55 }],
  ],
  anchor: () => [
    ['k', 'M24 56 C26 76 40 84 50 84 C60 84 74 76 76 56 M50 30 V82 M36 40 H64', { w: 10.5, ol: false, a: 0.9 }],
    ['i', 'M50 30 V82 M36 40 H64', { w: 6.6 }],
    ['i', 'M24 56 C26 76 40 84 50 84 C60 84 74 76 76 56', { w: 6.6 }],
    ['i', 'M16 60 L26 50 L32 64 Z M84 60 L74 50 L68 64 Z', {}],
    ['i', circle(50, 22, 7.5), {}], ['k', circle(50, 22, 3.4), { ol: false }],
    ['b', 'M50 31 V80', { w: 2, ol: false, a: 0.7 }],
  ],
  arrows: () => [...arrow(-27), ...arrow(27), ...arrow(0)],
  // stag antlers over a skull
  stag: () => {
    const beam = 'M53 58 C62 46 64 34 72 16', tines = 'M62 42 L78 38 M65 32 L81 26 M69 22 L75 8 M57 52 L70 54';
    return [
      ['k', beam + tines, { w: 8, ol: false, a: 0.9, mx: 0 }], ['k', beam + tines, { w: 8, ol: false, a: 0.9, mx: 1 }],
      ['i', beam, { w: 5.2 }], ['i', beam, { w: 5.2, mx: 1 }], ['i', tines, { w: 3.4 }], ['i', tines, { w: 3.4, mx: 1 }],
      ...mir('s', 'M42 52 L24 56 L36 64 Z'),
      ['i', 'M40 52 C40 46 60 46 60 52 L58 72 L50 88 L42 72 Z', {}],
      ...mir('k', 'M43 58 L48 60 L46 63 Z', { ol: false }), ['k', 'M47 78 H53 L50 84 Z', { ol: false }],
    ];
  },
  // an ice crystal
  frost: () => {
    const o = [];
    const arm = 'M50 50 V14 M50 30 L40 20 M50 30 L60 20 M50 42 L42 34 M50 42 L58 34';
    for (let i = 0; i < 6; i++) o.push(['k', arm, { w: 7.4, r: i * 60, ol: false, a: 0.9 }]);
    for (let i = 0; i < 6; i++) o.push(['i', arm, { w: 4, r: i * 60, ol: false }]);
    o.push(['b', poly(starPts(50, 50, 6, 11, 8, 0)), {}], ['g', circle(50, 50, 4), { ol: false }]);
    return o;
  },
  // a knight's helm with a plume
  helm: () => [
    ['b', 'M50 20 C42 4 62 2 74 10 C66 12 62 18 58 26 Z', {}],
    ['i', 'M28 84 V46 C28 28 38 18 50 18 C62 18 72 28 72 46 V84 H62 V70 H38 V84 Z', {}],
    ['s', 'M28 84 V46 C28 40 29 36 32 32 L34 84 Z', { ol: false, a: 0.7 }],
    ['k', 'M33 44 H67 V52 H33 Z', { ol: false }], ['k', 'M46.5 52 H53.5 V68 H46.5 Z', { ol: false }],
    ['g', 'M35 46 H65 V49.5 H35 Z', { ol: false, a: 0.9 }],
    ['b', 'M38 66 H62 V70 H38 Z', { ol: false, a: 0.8 }],
  ],
  // a cut gem
  gem: () => [
    ['i', 'M26 36 L38 22 H62 L74 36 L50 84 Z', {}],
    ['b', 'M26 36 L38 22 L44 36 Z', { ol: false }], ['s', 'M74 36 L62 22 L56 36 Z', { ol: false }],
    ['i', 'M38 22 H62 L56 36 H44 Z', { ol: false }],
    ['b', 'M26 36 H44 L50 84 Z', { ol: false, a: 0.95 }], ['g', 'M44 36 H56 L50 84 Z', { ol: false }], ['d', 'M56 36 H74 L50 84 Z', { ol: false }],
    ['k', 'M26 36 H74 M38 22 L44 36 L50 84 L56 36 L62 22 M26 36 L44 36 M74 36 L56 36', { w: 1, ol: false, a: 0.55 }],
  ],
};
const FIELD_OF = {
  swords: 'navy', wings: 'deep', dragon: 'ink', axes: 'steel', heart: 'deep', crown: 'indigo', tower: 'navy', wolf: 'steel', eagle: 'deep', lion: 'indigo', bear: 'teal', serpent: 'ink',
  flame: 'ink', star: 'deep', moon: 'indigo', sun: 'navy', bolt: 'ink', pine: 'teal', anchor: 'deep', arrows: 'steel', stag: 'teal', frost: 'navy', helm: 'ink', gem: 'deep',
};

// --- drawing ---------------------------------------------------------------------------------------------
// Taste switch (the owner picks; default ships): 'forged' = forged-steel rim with rivets and a sapphire, enamelled field, embossed silver
// relief | 'gilded' = the same in gold | 'flat' = the old flat look.
export let CREST_STYLE = 'forged';
export const CREST_STYLES = ['forged', 'gilded', 'flat'];
const P2 = {};      // Path2D cache
const p2 = (d) => P2[d] || (P2[d] = new Path2D(d));
function grad(g, stops, y0 = 8, y1 = 92) { const gr = g.createLinearGradient(0, y0, 0, y1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; }
function drawOps(g, ops, F, lw) {
  for (const [st, d, o] of ops) {
    g.save();
    if (o.r) { const px = o.p ? o.p[0] : 50, py = o.p ? o.p[1] : 50; g.translate(px, py); g.rotate((o.r * Math.PI) / 180); g.translate(-px, -py); }
    if (o.mx) { g.translate(100, 0); g.scale(-1, 1); }
    if (o.a != null) g.globalAlpha = o.a;
    const path = p2(d), stops = F[st] || F.i;
    if (o.w) {                                          // stroke op: a ribbon of the given width
      g.lineWidth = o.w; g.strokeStyle = st === 'k' ? stops[0][1] : grad(g, stops); g.stroke(path);
    } else {
      g.fillStyle = grad(g, stops); g.fill(path);
      if (o.ol !== false) { g.lineWidth = lw; g.strokeStyle = OUT; g.stroke(path); }
    }
    g.restore();
  }
}

// ---- the old flat crest (CREST_STYLE 'flat')
const SHIELD0 = 'M13 8 H87 V50 C87 74 68 90 50 97 C32 90 13 74 13 50 Z';
const SHIELD0_IN = 'M19 14 H81 V50 C81 70 65 84 50 90 C35 84 19 70 19 50 Z';
function drawFlat(g, id, cx, cy, size) {
  const ops = (CHARGES[id] || CHARGES.swords)(), fld = FIELD[FIELD_OF[id]] || FIELD.navy;
  g.save();
  g.translate(cx - size / 2, cy - size / 2); g.scale(size / 100, size / 100);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.save(); g.translate(0, 2.4); g.fillStyle = 'rgba(0,6,20,0.45)'; g.fill(p2(SHIELD0)); g.restore();
  const rim = g.createLinearGradient(0, 8, 0, 97); rim.addColorStop(0, '#f2f8ff'); rim.addColorStop(0.45, '#aebdd2'); rim.addColorStop(1, '#5f7391');
  g.fillStyle = rim; g.fill(p2(SHIELD0)); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(p2(SHIELD0));
  const fg = g.createLinearGradient(0, 14, 0, 90); fg.addColorStop(0, fld[0]); fg.addColorStop(1, fld[1]);
  g.fillStyle = fg; g.fill(p2(SHIELD0_IN)); g.strokeStyle = 'rgba(2,9,24,0.8)'; g.lineWidth = 1.4; g.stroke(p2(SHIELD0_IN));
  g.save(); g.clip(p2(SHIELD0_IN)); const sh = g.createLinearGradient(0, 14, 0, 56); sh.addColorStop(0, 'rgba(255,255,255,0.20)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 14, 100, 42); g.restore();
  g.strokeStyle = 'rgba(190,225,255,0.5)'; g.lineWidth = 0.9; g.stroke(p2(SHIELD0_IN));
  g.save(); g.clip(p2(SHIELD0_IN)); g.translate(50, 53); g.scale(0.86, 0.86); g.translate(-50, -50);
  drawOps(g, ops, FILLS.flat, 1.5);
  g.restore(); g.restore();
}

// ---- the premium crest: rendered once per (id, pixel size, style) into an offscreen canvas, then blitted
// shield: a heater with a gently arched chief rising to a point in the middle (where the sapphire sits)
const SHIELD = 'M11 6 C25 9.5 38 9.5 50 4.5 C62 9.5 75 9.5 89 6 L87.5 50 C87.5 74 68.5 90.5 50 97.5 C31.5 90.5 12.5 74 12.5 50 Z';
const SHIELD_IN = 'M18.2 13.2 C28.5 15.6 39.5 15.4 50 11.6 C60.5 15.4 71.5 15.6 81.8 13.2 L81 50 C81 70 65 83.8 50 90.2 C35 83.8 19 70 19 50 Z';
const STUDS = [[17.2, 10.6], [82.8, 10.6], [32, 11.7], [68, 11.7], [15.5, 31], [84.5, 31], [15.7, 52], [84.3, 52], [26.4, 77.4], [73.6, 77.4], [50, 93.6]];
const CACHE = new Map();
function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// the alpha of `src` filled with one colour
function silhouette(src, color) { const c = cv(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c; }
// the rim of a silhouette that is not covered by itself shifted by (dx, dy): the lit / the shaded bevel of an embossed shape
function edgeBand(sil, dx, dy, color) { const c = cv(sil.width, sil.height), x = c.getContext('2d'); x.drawImage(sil, 0, 0); x.globalCompositeOperation = 'destination-out'; x.drawImage(sil, dx, dy); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c; }
// bevel of a vector shape (100-unit space): a light band along its upper-left edge, a dark one along the lower-right
function bevel(g, d, o, hi, lo) {
  const P = p2(d);
  const ring = (dx, dy) => { const q = new Path2D(); q.rect(-30, -30, 160, 160); q.addPath(P, new DOMMatrix().translate(dx, dy)); return q; };
  g.save(); g.clip(P);
  g.fillStyle = hi; g.fill(ring(o, o), 'evenodd');
  g.fillStyle = lo; g.fill(ring(-o, -o), 'evenodd');
  g.restore();
}
function stud(g, x, y, r, R) {
  g.fillStyle = 'rgba(0,4,14,0.6)'; g.beginPath(); g.arc(x + r * 0.22, y + r * 0.34, r * 1.08, 0, TAU); g.fill();
  const rg = g.createRadialGradient(x - r * 0.42, y - r * 0.46, r * 0.08, x, y, r); rg.addColorStop(0, R.stud[0]); rg.addColorStop(0.45, R.stud[1]); rg.addColorStop(1, R.stud[2]);
  g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
function sparkle(g, x, y, r, a = 0.95) {
  g.save(); g.globalAlpha = a; g.fillStyle = '#ffffff'; g.beginPath();
  for (let i = 0; i < 8; i++) { const an = (i * Math.PI) / 4, rr = i % 2 ? r * 0.16 : r; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
  g.closePath(); g.fill(); g.restore();
}
// a faceted sapphire in a metal bezel
function sapphire(g, x, y, r, R, big) {
  const bz = g.createRadialGradient(x - r * 0.5, y - r * 0.6, r * 0.1, x, y, r * 1.4); for (const [o, c] of R.bezel) bz.addColorStop(o, c);
  g.fillStyle = 'rgba(0,4,14,0.6)'; g.beginPath(); g.arc(x + r * 0.2, y + r * 0.35, r * 1.42, 0, TAU); g.fill();
  g.fillStyle = bz; g.beginPath(); g.arc(x, y, r * 1.36, 0, TAU); g.fill();
  const oct = []; for (let i = 0; i < 8; i++) { const an = Math.PI / 8 + (i * Math.PI) / 4; oct.push([x + Math.cos(an) * r, y + Math.sin(an) * r]); }
  const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y + r * 0.15, r * 1.05);
  rg.addColorStop(0, '#f2fdff'); rg.addColorStop(0.22, '#86e0ff'); rg.addColorStop(0.58, '#1d7fe6'); rg.addColorStop(1, '#051d55');
  g.fillStyle = rg; g.beginPath(); oct.forEach(([px, py]) => g.lineTo(px, py)); g.closePath(); g.fill();
  if (big) {                                            // table + facet lines
    g.strokeStyle = 'rgba(220,245,255,0.35)'; g.lineWidth = r * 0.07; g.beginPath();
    const t = oct.map(([px, py]) => [x + (px - x) * 0.5, y + (py - y) * 0.5]);
    t.forEach(([px, py]) => g.lineTo(px, py)); g.closePath();
    oct.forEach(([px, py], i) => { g.moveTo(px, py); g.lineTo(t[i][0], t[i][1]); });
    g.stroke();
  }
  g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.ellipse(x - r * 0.34, y - r * 0.38, r * 0.26, r * 0.16, -0.6, 0, TAU); g.fill();
}
// heraldic diaper (damask) chased into the enamel: a faint lozenge trellis with a tiny quatrefoil in each lozenge
function diaper(g) {
  g.save(); g.lineWidth = 0.35; g.strokeStyle = 'rgba(255,255,255,0.07)'; g.beginPath();
  for (let i = -100; i <= 200; i += 9) { g.moveTo(i, 0); g.lineTo(i + 100, 100); g.moveTo(i, 0); g.lineTo(i - 100, 100); }
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.09)';
  for (let y = 4.5, row = 0; y < 100; y += 9, row++) for (let x = (row % 2) * 4.5; x < 100; x += 9) {
    g.beginPath(); for (let k = 0; k < 4; k++) { const an = (k * Math.PI) / 2; g.moveTo(x, y); g.arc(x + Math.cos(an) * 0.7, y + Math.sin(an) * 0.7, 0.62, 0, TAU); } g.fill();
  }
  g.restore();
}
// mix two #rrggbb colours
function mixHex(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = (p, s) => (p >> s) & 255; let o = 0; for (const s of [16, 8, 0]) o |= Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t) << s; return '#' + o.toString(16).padStart(6, '0'); }
function renderCrest(id, S, style) {
  const k = S / 100, R = RIMS[style] || RIMS.forged, F = FILLS[style] || FILLS.forged;
  const big = S >= 96, mid = S >= 56, small = S < 76;          // small: DOM lists (24-36 css px) - brighter enamel, bolder outline, softer bevels
  const ops = (CHARGES[id] || CHARGES.swords)(), fld0 = FIELD[FIELD_OF[id]] || FIELD.navy;
  const fld = small ? [mixHex(fld0[0], '#ffffff', 0.08), mixHex(fld0[1], fld0[0], 0.42)] : fld0;
  const out = cv(S), g = out.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  // 1. soft drop shadow, forged rim with its bevel
  g.save(); g.scale(k, k);
  g.save(); g.shadowColor = 'rgba(0,4,16,0.62)'; g.shadowBlur = 2.4 * k; g.shadowOffsetY = 1.1 * k; g.fillStyle = '#081222'; g.fill(p2(SHIELD)); g.restore();
  const rim = g.createLinearGradient(14, 2, 86, 98); for (const [o, c] of R.rim) rim.addColorStop(o, small ? mixHex(c, '#ffffff', 0.22) : c);
  g.fillStyle = rim; g.fill(p2(SHIELD));
  if (big) {                                              // hammer marks on the forged steel
    g.save(); g.clip(p2(SHIELD)); let s = 7 + id.length * 13;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) { const x = 8 + rnd() * 84, y = 3 + rnd() * 95, r = 0.5 + rnd() * 1.1; g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,8,24,0.12)'; g.beginPath(); g.ellipse(x, y, r * 1.4, r, rnd() * 3, 0, TAU); g.fill(); }
    g.restore();
  }
  bevel(g, SHIELD, Math.max(0.9, 1.1 / k), R.hi, 'rgba(3,10,28,0.55)');
  g.lineWidth = Math.max(0.7, 0.9 / k); g.strokeStyle = R.line; g.stroke(p2(SHIELD));
  // 2. the field: enamel, lit from the upper left, sunk under the rim
  g.save(); g.clip(p2(SHIELD_IN));
  const fg = g.createRadialGradient(40, 28, 3, 50, 50, 64); fg.addColorStop(0, fld[0]); fg.addColorStop(1, fld[1]);
  g.fillStyle = fg; g.fillRect(0, 0, 100, 100);
  if (big) diaper(g);
  g.shadowColor = 'rgba(0,3,12,0.95)'; g.shadowBlur = 2.6 * k; g.shadowOffsetX = 0.5 * k; g.shadowOffsetY = 1.2 * k;
  g.lineWidth = 2.2; g.strokeStyle = 'rgba(0,3,12,0.9)'; g.stroke(p2(SHIELD_IN));
  g.restore();
  // the rim's inner lip catches the light along the lower right, a thin dark groove along the upper left
  g.save(); g.lineWidth = Math.max(0.5, 0.75 / k);
  g.strokeStyle = 'rgba(2,8,20,0.85)'; g.stroke(p2(SHIELD_IN));
  g.translate(0.45, 0.6); g.strokeStyle = 'rgba(220,236,255,0.35)'; g.clip(p2(SHIELD)); g.stroke(p2(SHIELD_IN)); g.restore();
  g.restore();
  // 3. the charge, embossed: cast shadow on the enamel, the relief, lit and shaded bevels, a specular sweep
  const ch = cv(S), c = ch.getContext('2d');
  c.lineJoin = 'round'; c.lineCap = 'round';
  const cs = small ? 0.88 : 0.82;                        // (big: a little smaller than before so wide charges stay inside the rim)
  c.scale(k, k); c.clip(p2(SHIELD_IN)); c.translate(50, small ? 53 : 53.5); c.scale(cs, cs); c.translate(-50, -50);
  drawOps(c, ops, F, S >= 160 ? 1.25 : S >= 80 ? 1.5 : 2.1);
  const sil = silhouette(ch, '#fff');
  g.save(); g.scale(k, k); g.clip(p2(SHIELD_IN)); g.setTransform(1, 0, 0, 1, 0, 0);
  g.shadowColor = 'rgba(0,3,12,0.8)'; g.shadowBlur = 1.8 * k; g.shadowOffsetX = 0.7 * k; g.shadowOffsetY = 1.5 * k;
  g.drawImage(silhouette(ch, 'rgba(0,3,12,0.9)'), 0, 0);
  g.restore();
  g.drawImage(ch, 0, 0);
  const b = Math.max(1, Math.round(0.8 * k));
  g.globalAlpha = small ? 0.45 : 0.8; g.drawImage(edgeBand(sil, b, b, R.hi), 0, 0);
  g.globalAlpha = small ? 0.3 : 0.55; g.drawImage(edgeBand(sil, -b, -b, R.lo), 0, 0);
  g.globalAlpha = 1;
  if (mid) {
    const sp = cv(S), x = sp.getContext('2d'); x.drawImage(sil, 0, 0); x.globalCompositeOperation = 'source-in';
    const lg = x.createLinearGradient(0.18 * S, 0.12 * S, 0.78 * S, 0.88 * S);
    lg.addColorStop(0, 'rgba(255,255,255,0.5)'); lg.addColorStop(0.3, 'rgba(255,255,255,0)'); lg.addColorStop(0.58, 'rgba(255,255,255,0)'); lg.addColorStop(0.66, 'rgba(255,255,255,0.16)'); lg.addColorStop(0.74, 'rgba(255,255,255,0)');
    x.fillStyle = lg; x.fillRect(0, 0, S, S); g.drawImage(sp, 0, 0);
  }
  // 4. rivets, the sapphire in the chief, glints
  g.save(); g.scale(k, k);
  if (mid) for (const [x, y] of STUDS) stud(g, x, y, 1.45, R);
  sapphire(g, 50, 8.6, S >= 56 ? 3.1 : 3.6, R, big);
  if (big) { sparkle(g, 48.6, 7.3, 3.4, 0.9); sparkle(g, 19.5, 18, 2.6, 0.55); }
  g.restore();
  return out;
}
export function drawCrest(g, id, cx, cy, size) {
  id = normEmblem(id);
  if (CREST_STYLE === 'flat') return drawFlat(g, id, cx, cy, size);
  const t = g.getTransform ? g.getTransform() : null, sc = t ? Math.hypot(t.a, t.b) || 1 : 1;
  const S = Math.max(16, Math.min(1024, Math.round(size * sc))), key = id + '|' + S + '|' + CREST_STYLE;
  let c = CACHE.get(key);
  if (!c) { c = renderCrest(id, S, CREST_STYLE); if (CACHE.size > 80) CACHE.delete(CACHE.keys().next().value); CACHE.set(key, c); }
  g.drawImage(c, cx - size / 2, cy - size / 2, size, size);
}
export function setCrestStyle(s) { if (!CREST_STYLES.includes(s) || s === CREST_STYLE) return; CREST_STYLE = s; CACHE.clear(); URLS.clear(); }

// --- DOM ---------------------------------------------------------------------------------------------------
const URLS = new Map();
export function crestURL(id, px = 64) {
  id = normEmblem(id);
  const k = id + '@' + px; let u = URLS.get(k); if (u) return u;
  const S = Math.round(px * 2), c = document.createElement('canvas'); c.width = S; c.height = S;
  drawCrest(c.getContext('2d'), id, S / 2, S / 2, S * 0.98);
  u = c.toDataURL('image/png'); URLS.set(k, u); return u;
}
export function crestImg(id, px = 24, cls = 'crest', style = 'display:block') {
  return `<img class="${cls}" src="${crestURL(id, px)}" width="${px}" height="${px}" alt="" draggable="false" style="${style};object-fit:contain;pointer-events:none">`;
}
