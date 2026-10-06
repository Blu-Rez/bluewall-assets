// Cups and leagues: the art only (the rules live on the server, social.py).  Six leagues, from plain steel to the Blue Crown; every one is a
// shield in its own colour with a little ornament that grows with the rank:  steel I  ·  azure II  ·  sapphire III  ·  cobalt star  ·  obsidian gem  ·  blue crown.
export const LEAGUES = [['steel', 'Steel', 0, '#a9b8cc'], ['azure', 'Azure', 300, '#7cc8ff'], ['sapphire', 'Sapphire', 700, '#3f8cff'],
  ['cobalt', 'Cobalt', 1200, '#5f86ff'], ['obsidian', 'Obsidian', 1900, '#9fd8ff'], ['crown', 'Blue Crown', 2800, '#43e0ff']].map(([id, name, from, color]) => ({ id, name, from, color }));
export const leagueIdx = (t) => { let i = 0; for (let k = 0; k < LEAGUES.length; k++) if (t >= LEAGUES[k].from) i = k; return i; };
export const leagueOf = (t) => LEAGUES[leagueIdx(t)];

const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
let uid = 0;
const SHIELD = 'M32 3L58 12V35C58 51 47 62 32 69C17 62 6 51 6 35V12Z';
const ORN = [
  (c) => `<path d="M20 38L32 29L44 38" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  (c) => `<path d="M20 42L32 33L44 42M20 31L32 22L44 31" fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  (c) => `<path d="M20 46L32 38L44 46M20 36L32 28L44 36M20 26L32 18L44 26" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  (c) => `<path d="M32 17L36.4 28.6L48.8 29.4L39.2 37.2L42.4 49.2L32 42.4L21.6 49.2L24.8 37.2L15.2 29.4L27.6 28.6Z" fill="${c}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/>`,
  (c) => `<path d="M32 15L47 35L32 55L17 35Z" fill="none" stroke="${c}" stroke-width="3.4" stroke-linejoin="round"/><path d="M32 24L40 35L32 46L24 35Z" fill="${c}"/>`,
  (c) => `<path d="M16 48L16 26L25 36L32 20L39 36L48 26L48 48Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><path d="M16 53H48" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`,
];
// league badge: i = 0..5
export function leagueBadge(i, sz = 64, cls = 'lgb') {
  const L = LEAGUES[Math.max(0, Math.min(5, i))], c = L.color, id = 'lg' + (uid++), dark = i === 4;
  const t = dark ? '#33415f' : mix(c, '#ffffff', 0.18), m = dark ? '#0b1022' : mix(c, '#0b2350', 0.52), b = dark ? '#02040a' : '#071634';
  const orn = dark ? '#bfe8ff' : mix(c, '#ffffff', i === 5 ? 0.9 : 0.72);
  const glow = i === 5 ? `filter:drop-shadow(0 0 5px ${c})` : i >= 3 ? `filter:drop-shadow(0 0 3px ${mix(c, '#000000', 0.3)})` : '';
  return `<svg class="${cls}" viewBox="0 0 64 72" width="${sz}" height="${Math.round(sz * 72 / 64)}" style="display:block;${glow}" aria-label="${L.name}"><defs>
    <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t}"/><stop offset=".55" stop-color="${m}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, '#06122b', 0.5)}"/></linearGradient></defs>
    <path d="${SHIELD}" fill="url(#${id}a)" stroke="url(#${id}b)" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="${SHIELD}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1" transform="translate(32 36) scale(.82) translate(-32 -36)"/>
    ${ORN[Math.max(0, Math.min(5, i))](orn)}</svg>`;
}
// the little cup (line icon, currentColor)
export const cupSvg = (sz = 18, color = 'currentColor') => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="${color}" fill-opacity=".22"/><path d="M7 6H4.5v1.6A3.2 3.2 0 0 0 7.7 10.8M17 6h2.5v1.6a3.2 3.2 0 0 1-3.2 3.2M12 14v4M8 20h8"/></svg>`;
