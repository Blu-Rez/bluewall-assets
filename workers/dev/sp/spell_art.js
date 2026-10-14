// Spell icons: two families of hand-built SVG art (no external assets).  orb(k, size) = glossy glass potion-orb; crest(k, size) = heraldic shield with an outlined glyph.
let uid = 0;
const P = {
  lightning: { c1: '#9fe0ff', c2: '#1f56ff', c3: '#06133f', glow: '#7fd0ff' },
  heal: { c1: '#9bffc2', c2: '#14a850', c3: '#032c18', glow: '#7dffb0' },
  freeze: { c1: '#e6fbff', c2: '#35a3ea', c3: '#05284a', glow: '#bff1ff' },
  rage: { c1: '#ffd36b', c2: '#e5391a', c3: '#3d0504', glow: '#ff9a4a' },
  quake: { c1: '#f0d6a2', c2: '#9a6a36', c3: '#2e1a0a', glow: '#ffb35a' },
};
const star = (x, y, r, o = 1) => `<path d="M${x} ${y - r}Q${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y}Q${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r}Q${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y}Q${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}z" fill="#fff" opacity="${o}"/>`;
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
export function orb(k, size = 48) {
  const p = P[k]; if (!p) return '';
  const id = 'o' + ++uid;
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}">${defs(id, k)}
    <circle cx="48" cy="50" r="45" fill="#000" opacity=".35" filter="url(#${id}g)"/>
    <circle cx="48" cy="48" r="44" fill="url(#${id}r)"/><circle cx="48" cy="48" r="40.5" fill="#06122c"/>
    <circle cx="48" cy="48" r="37" fill="url(#${id}o)"/>
    <g clip-path="url(#${id}c)"><circle cx="48" cy="52" r="26" fill="${p.glow}" opacity=".28" filter="url(#${id}g)"/>
    <g>${G[k](id, true)}</g>
    <ellipse cx="38" cy="22" rx="22" ry="10" fill="#fff" opacity=".30" transform="rotate(-18 38 22)"/>
    <path d="M18 62a32 32 0 0 0 60 8 36 36 0 0 1-60-8z" fill="${p.glow}" opacity=".35"/></g>
    <circle cx="48" cy="48" r="37" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/></svg>`;
}
export function crest(k, size = 48) {
  const p = P[k]; if (!p) return '';
  const id = 'c' + ++uid, sh = 'M48 5 82 15v34c0 21-15 34-34 42C29 83 14 70 14 49V15z';
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}">${defs(id, k)}
    <path d="${sh}" transform="translate(0 3)" fill="#000" opacity=".4" filter="url(#${id}g)"/>
    <path d="${sh}" fill="url(#${id}r)"/><path d="M48 10 77 19v30c0 17-12 29-29 36C31 78 19 66 19 49V19z" fill="url(#${id}o)" stroke="#0a1633" stroke-width="2"/>
    <path d="M48 10 77 19v14C64 29 55 22 48 17c-7 5-16 12-29 16V19z" fill="#fff" opacity=".2"/>
    <clipPath id="${id}s"><path d="M48 10 77 19v30c0 17-12 29-29 36C31 78 19 66 19 49V19z"/></clipPath><g clip-path="url(#${id}s)"><g transform="translate(48 48) scale(.84) translate(-48 -48)">${G[k](id, false)}</g></g>
    <path d="M48 5 82 15v34c0 21-15 34-34 42C29 83 14 70 14 49V15z" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/></svg>`;
}
export const KEYS = ['lightning', 'heal', 'freeze', 'rage', 'quake'];
