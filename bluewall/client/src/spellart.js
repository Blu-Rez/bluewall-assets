// Spell icons (owner's choice: style A): a glossy glass potion-orb with a bright glyph, hand-built SVG (no external art).  orb(k, size) -> inline <svg>.
// Below ~30 px the blurred glow filters are left out (the HUD shows many icons; the filters add nothing at that size).
let uid = 0;
const P = {
  lightning: { c1: '#9fe0ff', c2: '#1f56ff', c3: '#06133f', glow: '#7fd0ff' },
  heal: { c1: '#9bffc2', c2: '#14a850', c3: '#032c18', glow: '#7dffb0' },
  freeze: { c1: '#e6fbff', c2: '#35a3ea', c3: '#05284a', glow: '#bff1ff' },
  rage: { c1: '#ffd36b', c2: '#e5391a', c3: '#3d0504', glow: '#ff9a4a' },
  quake: { c1: '#f0d6a2', c2: '#9a6a36', c3: '#2e1a0a', glow: '#ffb35a' },
};
let NOSTAR = false;                                                                                                       // the aged orbs have no glitter
const star = (x, y, r, o = 1) => NOSTAR ? '' : `<path d="M${x} ${y - r}Q${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y}Q${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r}Q${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y}Q${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}z" fill="#fff" opacity="${o}"/>`;
function flake(cx, cy, L, w) {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2, c = Math.cos(a), n = Math.sin(a), px = -n, py = c;
    const at = (t, off = 0) => `${(cx + c * L * t + px * off).toFixed(1)} ${(cy + n * L * t + py * off).toFixed(1)}`;
    s += `M${at(0.12)}L${at(1)}M${at(0.52)}L${at(0.72, L * 0.2)}M${at(0.52)}L${at(0.72, -L * 0.2)}M${at(0.78)}L${at(0.93, L * 0.13)}M${at(0.78)}L${at(0.93, -L * 0.13)}`;
  }
  return `<path d="${s}" fill="none" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// ------------------------------------------------------------------ glyphs (drawn in a 96 x 96 box, centred on 48,48, kept inside r ~ 32)
const G = {
  lightning: (id, orb) => `<path d="M57 12 27 51h17l-9 33 35-43H52l12-29z" fill="${P.lightning.glow}" opacity=".9" filter="url(#${id}g)" transform="translate(0 1)"/>
    <path d="M57 12 27 51h17l-9 33 35-43H52l12-29z" fill="url(#${id}b)" stroke="#0a1d52" stroke-width="3" stroke-linejoin="round"/>
    <path d="M55 20 36 48h13l-5 17 16-20H50z" fill="#fff" opacity=".75"/>
    <path d="M22 28l8 5M74 70l-7-4M72 26l-7 6M24 68l7-4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>${star(21, 60, 5.5, 0.95)}${star(76, 36, 5, 0.95)}`,
  heal: (id, orb) => `<path d="M40 16h16q4 0 4 4v15h15q4 0 4 4v17q0 4-4 4H60v15q0 4-4 4H40q-4 0-4-4V60H21q-4 0-4-4V39q0-4 4-4h15V20q0-4 4-4z" fill="${P.heal.glow}" opacity=".8" filter="url(#${id}g)"/>
    <path d="M40 16h16q4 0 4 4v15h15q4 0 4 4v17q0 4-4 4H60v15q0 4-4 4H40q-4 0-4-4V60H21q-4 0-4-4V39q0-4 4-4h15V20q0-4 4-4z" fill="url(#${id}b)" stroke="#06502a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M42 21h12v18h17v5H25v-5h17z" fill="#fff" opacity=".6"/><path d="M42 74h12v-13h-12z" fill="#2fbf6a" opacity=".35"/>${star(21, 23, 6.5, 0.95)}${star(77, 74, 5.5, 0.95)}${star(75, 21, 4, 0.85)}`,
  freeze: (id, orb) => `<g stroke="url(#${id}b)">${flake(48, 48, 33, orb ? 4.2 : 5)}</g><g stroke="#fff" opacity=".9">${flake(48, 48, 33, 1.6)}</g><path d="M48 39l8 4.5v9L48 57l-8-4.5v-9z" fill="#fff" stroke="${orb ? '#bff1ff' : '#0b2c55'}" stroke-width="${orb ? 1.4 : 2.4}" stroke-linejoin="round"/>${orb ? '' : ''}`,
  rage: (id, orb) => `<path d="M48 9c3 15 24 22 24 47 0 17-11 30-24 30S24 73 24 57c0-10 5-17 11-22 1 9 5 13 10 14-3-15-2-27 3-40z" fill="url(#${id}b)" stroke="${orb ? '#fff1d6' : '#4a0b02'}" stroke-width="${orb ? 1.6 : 3}" stroke-linejoin="round"/>
    <path d="M48 41c2 10 13 14 13 27 0 9-6 15-13 15s-13-6-13-14c0-7 4-11 8-15 1 4 3 6 5 6-1-6-1-13 0-19z" fill="#ffe37a" stroke="${orb ? 'none' : '#b8480a'}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M48 58c1 5 6 7 6 13 0 4-3 7-6 7s-6-3-6-7c0-3 2-5 3-7 1 1 2 2 3 2z" fill="#fff6c8"/>${star(70, 30, 4.4, 0.9)}${star(24, 38, 3.4, 0.8)}`,
  quake: (id, orb) => `<path d="M8 58 38 52l8 7-8 8 11 9-8 14H8z" fill="url(#${id}b)" stroke="#2e1a0a" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M88 54 60 52l-8 9 9 8-10 11 8 12h29z" fill="url(#${id}b)" stroke="#2e1a0a" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M46 59 38 67l11 9-8 14h20l-8-12 10-11-9-9z" fill="#ff6a12"/><path d="M46 62l-4 5 8 8-5 12h9l-5-11 7-8z" fill="#ffe27a"/>
    <path d="M24 46l9-10 9 6-5 10zM58 40l8-12 10 7-6 11zM42 28l7-9 7 6-4 8z" fill="url(#${id}b)" stroke="#2e1a0a" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M28 42l5-5M62 36l5-6M45 25l4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <path d="M10 52q-5-4-2-10M86 50q6-4 3-11" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".55"/>`,
};
function defs(id, k) {
  const p = P[k];
  return `<defs><radialGradient id="${id}o" cx="50%" cy="38%" r="72%"><stop offset="0" stop-color="${p.c1}"/><stop offset=".55" stop-color="${p.c2}"/><stop offset="1" stop-color="${p.c3}"/></radialGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">${k === 'lightning' ? '<stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#bfeaff"/><stop offset="1" stop-color="#4aa8ff"/>'
    : k === 'heal' ? '<stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#c6ffd9"/><stop offset="1" stop-color="#4fe08a"/>'
    : k === 'freeze' ? '<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9fe3ff"/>'
    : k === 'rage' ? '<stop offset="0" stop-color="#ffb347"/><stop offset=".5" stop-color="#ff5a1f"/><stop offset="1" stop-color="#c4150a"/>'
    : '<stop offset="0" stop-color="#d9b988"/><stop offset=".6" stop-color="#9a6a36"/><stop offset="1" stop-color="#5a3a1a"/>'}</linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f9ff"/><stop offset=".45" stop-color="#9db4d2"/><stop offset="1" stop-color="#2b3c58"/></linearGradient>
    <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <clipPath id="${id}c"><circle cx="48" cy="48" r="37"/></clipPath></defs>`;
}
export let SPELL_AGED = true;                                                                                              // owner OK 5 Oct 19:48: the old, worn look
export function setSpellAged(on) { SPELL_AGED = !!on; }
export function orb(k, size = 48, old = SPELL_AGED) {
  const p = P[k]; if (!p) return '';
  if (old) return orbAged(k, size);
  const id = 'o' + ++uid, lite = size < 30;
  let s = `<svg viewBox="0 0 96 96" width="${size}" height="${size}">${defs(id, k)}
    ${lite ? '' : `<circle cx="48" cy="50" r="45" fill="#000" opacity=".35" filter="url(#${id}g)"/>`}
    <circle cx="48" cy="48" r="44" fill="url(#${id}r)"/><circle cx="48" cy="48" r="40.5" fill="#06122c"/>
    <circle cx="48" cy="48" r="37" fill="url(#${id}o)"/>
    <g clip-path="url(#${id}c)"><circle cx="48" cy="52" r="26" fill="${p.glow}" opacity=".28" filter="url(#${id}g)"/>
    <g>${G[k](id, true)}</g>
    <ellipse cx="38" cy="22" rx="22" ry="10" fill="#fff" opacity=".30" transform="rotate(-18 38 22)"/>
    <path d="M18 62a32 32 0 0 0 60 8 36 36 0 0 1-60-8z" fill="${p.glow}" opacity=".35"/></g>
    <circle cx="48" cy="48" r="37" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/></svg>`;
  return lite ? s.replace(/ filter="url\(#\w+g\)"/g, '') : s;
}

// ------------------------------------------------------------------ the AGED look (owner 5 Oct 19:25: «اسپل ها همینطور خوبن، فقط از نو بودن بکنشون کهنه که جذاب‌تر باشن»)
// Same art, same glyphs, same sizes — only the surface is old: a tarnished steel bezel with rust speckles and a worn edge, a thin tarnished-brass inner bezel, matte glass
// (no gloss blob, no glitter), muted enamel colours, grain, a dark worn vignette, a few hairline scratches.  Static (no animation); the noise is one SVG filter per icon.
function orbAged(k, size) {
  const p = P[k], id = 'a' + ++uid, lite = size < 30, sd = 3 + (uid * 7) % 40;
  NOSTAR = true; let glyph; try { glyph = G[k](id, true); } finally { NOSTAR = false; }
  const noise = lite ? '' : `<filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${sd}"/><feColorMatrix type="matrix" values="0 0 0 0 .43  0 0 0 0 .27  0 0 0 0 .14  0 0 0 2.4 -1.05"/></filter>
    <filter id="${id}m" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="${sd + 5}"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.9 -.78"/></filter>`;
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}">${defs(id, k).replace('</defs>', '')}
    <linearGradient id="${id}t" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#d6dce6"/><stop offset=".3" stop-color="#8e99a9"/><stop offset=".68" stop-color="#4a5468"/><stop offset="1" stop-color="#171d2c"/></linearGradient>
    <radialGradient id="${id}v" cx="50%" cy="46%" r="56%"><stop offset=".6" stop-color="#1a1005" stop-opacity="0"/><stop offset="1" stop-color="#160c02" stop-opacity=".42"/></radialGradient>
    <filter id="${id}d"><feColorMatrix type="saturate" values=".84"/></filter>
    <clipPath id="${id}q"><path fill-rule="evenodd" d="M48 4a44 44 0 1 0 .01 0zM48 7.5a40.5 40.5 0 1 1-.01 0z"/></clipPath>${noise}</defs>
    ${lite ? '' : `<circle cx="48" cy="50" r="45" fill="#000" opacity=".4" filter="url(#${id}g)"/>`}
    <circle cx="48" cy="48" r="44" fill="url(#${id}t)"/>
    ${lite ? '' : `<g clip-path="url(#${id}q)"><rect width="96" height="96" filter="url(#${id}n)" opacity=".9"/></g>`}
    <circle cx="48" cy="48" r="43.2" fill="none" stroke="#0d1220" stroke-opacity=".55" stroke-width="1.2"/>
    <circle cx="48" cy="48" r="40.5" fill="#0a0f1c"/><circle cx="48" cy="48" r="39.4" fill="none" stroke="#b9a77c" stroke-opacity=".55" stroke-width="1.1"/>
    <circle cx="48" cy="48" r="37" fill="url(#${id}o)" filter="url(#${id}d)"/>
    <g clip-path="url(#${id}c)">${lite ? '' : `<rect width="96" height="96" filter="url(#${id}m)" opacity=".3"/>`}<g opacity=".97">${glyph}</g>
    <rect width="96" height="96" fill="#b08a45" opacity=".08"/>
    <circle cx="48" cy="48" r="37" fill="url(#${id}v)"/>
    <ellipse cx="38" cy="22" rx="20" ry="8" fill="#fff" opacity=".06" transform="rotate(-18 38 22)"/>
    <path d="M17 36L41 31M55 78L79 66M62 14L70 30M22 66L33 74" stroke="#fff" stroke-opacity=".22" stroke-width=".8" stroke-linecap="round" fill="none"/>
    <path d="M30 20L35 27L33 35" stroke="#000" stroke-opacity=".25" stroke-width=".9" fill="none"/></g>
    <circle cx="48" cy="48" r="37" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.2"/>
    <path d="M71 12.5a44 44 0 0 1 9 8" stroke="#0d1220" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </svg>`;
}
export const SPELL_KEYS = Object.keys(P);


// ------------------------------------------------------------------ hero powers (owner 5 Oct 13:07: "minimal but beautiful and high quality")
// The spell orb's steel rim around a calm deep-navy disc and ONE ice-white glyph: a shield (Shield Wall) and a pennant (Rally Charge).  No sparkles, no gloss blobs, no second object.
// (owner's pick 5 Oct 13:12: the Shield Wall button = the solid shield, the Rally Charge button = the thin-line pennant)
const SH = 'M24 25Q36 25 48 19Q60 25 72 25V46C72 63 62 74 48 81C34 74 24 63 24 46Z';              // the shield silhouette (48 wide, 62 high, a soft crest)
const HERO = {
  shield: (id) => `<g transform="translate(48 49) scale(.92) translate(-48 -50)"><path d="${SH}" fill="#7fb4ff" opacity=".5" filter="url(#${id}g)"/>
    <path d="${SH}" fill="url(#${id}w)"/>
    <g transform="translate(48 50.5) scale(.82) translate(-48 -50.5)"><path d="${SH}" fill="#1c4fc2"/><path d="${SH}" fill="#4a90f5" clip-path="url(#${id}l)"/></g></g>`,
  rally: (id) => `<g transform="translate(48 49) scale(.86) translate(-54 -48)"><path d="M36 22C48 17 60 27 74 22L64.5 35 74 48C60 53 48 43 36 48Z" fill="#7fb4ff" opacity=".4" stroke="#7fb4ff" stroke-width="7" stroke-linejoin="round" filter="url(#${id}g)"/>
    <path d="M34 17V82" stroke="url(#${id}w)" stroke-width="4.4" stroke-linecap="round"/><circle cx="34" cy="15.5" r="3.4" fill="url(#${id}w)"/>
    <path d="M36 22C48 17 60 27 74 22L64.5 35 74 48C60 53 48 43 36 48Z" fill="#8cc0ff" fill-opacity=".14" stroke="url(#${id}w)" stroke-width="4.4" stroke-linejoin="round"/></g>`,
  // scout (S8): a dot, a ring, a dashed ring = "how far do they reach"
  scout: (id) => `<circle cx="48" cy="48" r="26" fill="none" stroke="#7fb4ff" stroke-width="8" opacity=".35" filter="url(#${id}g)"/>
    <circle cx="48" cy="48" r="5.4" fill="url(#${id}w)"/><circle cx="48" cy="48" r="15" fill="none" stroke="url(#${id}w)" stroke-width="4.4"/><circle cx="48" cy="48" r="27" fill="none" stroke="url(#${id}w)" stroke-width="4.4" stroke-dasharray="10 7.2"/>`,
  // squad tools (S9): half = a circle with its left half filled; focus = a crosshair
  half: (id) => `<circle cx="48" cy="48" r="23" fill="none" stroke="#7fb4ff" stroke-width="9" opacity=".4" filter="url(#${id}g)"/>
    <circle cx="48" cy="48" r="22" fill="none" stroke="url(#${id}w)" stroke-width="4.6"/><path d="M48 26A22 22 0 0 0 48 70Z" fill="url(#${id}w)"/>`,
  focus: (id) => `<circle cx="48" cy="48" r="22" fill="none" stroke="#7fb4ff" stroke-width="9" opacity=".4" filter="url(#${id}g)"/>
    <circle cx="48" cy="48" r="20" fill="none" stroke="url(#${id}w)" stroke-width="4.4"/><path d="M48 14V30M48 66V82M14 48H30M66 48H82" stroke="url(#${id}w)" stroke-width="4.4" stroke-linecap="round"/><circle cx="48" cy="48" r="4.6" fill="url(#${id}w)"/>`,
};
export function abilOrb(k, size = 54) {
  const g = HERO[k]; if (!g) return '';
  const id = 'h' + ++uid;
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}"><defs>
    <radialGradient id="${id}o" cx="50%" cy="30%" r="78%"><stop offset="0" stop-color="#2d66c4"/><stop offset=".55" stop-color="#11347a"/><stop offset="1" stop-color="#040c24"/></radialGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f9ff"/><stop offset=".45" stop-color="#9db4d2"/><stop offset="1" stop-color="#2b3c58"/></linearGradient>
    <linearGradient id="${id}w" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="84"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#a8c8f4"/></linearGradient>
    <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.4"/></filter>
    <clipPath id="${id}l"><rect x="0" y="0" width="48" height="96"/></clipPath><clipPath id="${id}c"><circle cx="48" cy="48" r="37"/></clipPath></defs>
    <circle cx="48" cy="50" r="45" fill="#000" opacity=".35" filter="url(#${id}g)"/>
    <circle cx="48" cy="48" r="44" fill="url(#${id}r)"/><circle cx="48" cy="48" r="40.5" fill="#06122c"/><circle cx="48" cy="48" r="37" fill="url(#${id}o)"/>
    <g clip-path="url(#${id}c)"><g>${g(id)}</g><ellipse cx="40" cy="20" rx="24" ry="8" fill="#fff" opacity=".1" transform="rotate(-14 40 20)"/></g>
    <circle cx="48" cy="48" r="37" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.2"/></svg>`;
}

// ---- the hero powers (owner 5 Oct 18:34: «نئون، جذاب، درست و خوشگل، دورش نورانی»): thin neon lines in the hero's own ring colour on a dark glass disc, a glowing rim with fine ticks and
// diamonds (the rings' vocabulary), a soft halo round the whole button.  Same four passes as the ring emblems (squadicon.js): engraved shadow, wide glow, coloured line, bright core.
const NEON = {
  shield: ['M50 8L80 19L80 47Q80 74 50 92Q20 74 20 47L20 19Z', { d: 'M50 18L71 26L71 47Q71 66 50 81Q29 66 29 47L29 26Z', soft: 1 }, 'M42 49A8 8 0 1 0 58 49A8 8 0 1 0 42 49Z', { d: 'M50 30L50 38M50 60L50 71M32 49L40 49M60 49L68 49', soft: 1 }, { d: 'M26 30L74 30', soft: 1 }],
  rally: ['M28 94L28 10', 'M28 14L86 24L68 36L86 48L28 58Z', { d: 'M36 26L70 30M36 40L66 40', soft: 1 }, 'M50 70L62 80L50 90', 'M66 70L78 80L66 90', { d: 'M20 94L36 94', soft: 1 }],
  // p35: the three new hero powers -- Banner (a standard with a square swallow-tail cloth, two chevrons rising: "hit harder"), Dive Strike (a spear head falling between two swept wings), Shadow Breath (a dark flame with an eye)
  banner: ['M62 96L62 6', 'M58 12L62 3L66 12Z', 'M62 18H90V58L76 48L62 58Z', { d: 'M68 28H84M68 38H84', soft: 1 }, 'M14 62L26 50L38 62', 'M14 80L26 68L38 80', { d: 'M54 96H70', soft: 1 }],
  dive: ['M50 94L41 68H59Z', 'M50 68V26', 'M46 52L8 24L18 46L6 52L22 64L46 68', 'M54 52L92 24L82 46L94 52L78 64L54 68', { d: 'M50 26L44 14M50 26L56 14', soft: 1 }, { d: 'M28 94H72', soft: 1 }, { d: 'M20 50L40 58M80 50L60 58', soft: 1 }],
  shadow: ['M50 5Q71 30 66 52Q77 44 74 33Q93 56 77 78Q66 94 50 94Q30 94 23 75Q17 56 36 40Q36 52 42 54Q39 30 50 5Z', { d: 'M50 38Q61 56 56 70Q50 78 44 70Q40 57 50 38Z', soft: 1 }, 'M42 66L50 57L58 66L50 75Z'],
};
export function heroNeon(k, color = '#8fe8ff', size = 54) {
  const items = NEON[k]; if (!items) return abilOrb(k, size);
  const id = 'n' + ++uid, P = (it) => (typeof it === 'string' ? { d: it } : it), n = 28;
  const ticks = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, r0 = i % 7 === 0 ? 38.5 : 41, r1 = 44.5; return `M${(48 + Math.cos(a) * r0).toFixed(1)} ${(48 + Math.sin(a) * r0).toFixed(1)}L${(48 + Math.cos(a) * r1).toFixed(1)} ${(48 + Math.sin(a) * r1).toFixed(1)}`; }).join('');
  const dia = [0, 1, 2, 3].map((i) => `<path d="M0 -3.4L2.6 0L0 3.4L-2.6 0Z" transform="translate(${(48 + Math.cos(i * Math.PI / 2 - Math.PI / 2) * 46.5).toFixed(1)} ${(48 + Math.sin(i * Math.PI / 2 - Math.PI / 2) * 46.5).toFixed(1)}) rotate(${i * 90})" fill="#fff" opacity=".9"/>`).join('');
  const paths = (cls) => items.map((it) => { const o = P(it); return `<path d="${o.d}" class="${cls}${o.soft ? ' s' : ''}"/>`; }).join('');
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" style="--c:${color}"><defs>
    <radialGradient id="${id}d" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${color}" stop-opacity=".30"/><stop offset=".6" stop-color="#0a1c44" stop-opacity=".92"/><stop offset="1" stop-color="#030a1c" stop-opacity=".97"/></radialGradient>
    <filter id="${id}g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6"/></filter><filter id="${id}h" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
    <style>#${id} .g{fill:none;stroke:${color};stroke-width:6.5;stroke-linecap:round;stroke-linejoin:round;opacity:.55}#${id} .g.s{stroke-width:4;opacity:.3}#${id} .l{fill:${color}1f;stroke:#fff;stroke-opacity:.0;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}
    #${id} .l{stroke:${color};stroke-opacity:.95}#${id} .l.s{fill:none;stroke-width:1.6;stroke-opacity:.55}#${id} .c{fill:none;stroke:#fff;stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round;opacity:.95}#${id} .c.s{stroke-width:.7;opacity:.5}
    #${id} .d{fill:none;stroke:#020814;stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round;opacity:.5}</style>
    <circle cx="48" cy="48" r="47" fill="${color}" opacity=".28" filter="url(#${id}h)"/>
    <circle cx="48" cy="48" r="43" fill="url(#${id}d)"/>
    <circle cx="48" cy="48" r="43" fill="none" stroke="${color}" stroke-width="5.5" opacity=".5" filter="url(#${id}g)"/><circle cx="48" cy="48" r="43" fill="none" stroke="${color}" stroke-width="2.4"/><circle cx="48" cy="48" r="43" fill="none" stroke="#fff" stroke-width=".8" opacity=".85"/>
    <circle cx="48" cy="48" r="35.5" fill="none" stroke="${color}" stroke-width="1" opacity=".45"/>
    <path d="${ticks}" stroke="${color}" stroke-width="1.1" opacity=".7" fill="none"/>${dia}
    <g id="${id}" transform="translate(48 48) scale(.62) translate(-50 -50)"><g transform="translate(2 3)">${paths('d')}</g>${paths('g').replace(/<path /g, '<path filter="url(#' + id + 'g)" ')}${paths('l')}${paths('c')}</g>
    <ellipse cx="38" cy="19" rx="24" ry="7" fill="#fff" opacity=".07" transform="rotate(-14 38 19)"/></svg>`;
}
