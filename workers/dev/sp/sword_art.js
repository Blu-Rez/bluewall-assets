// Crossed swords (the ATTACK emblem): two real swords with a bevelled blade, fuller, gold guard with a gem, wrapped grip and pommel.
let uid = 0;
function sword(id, tone) {
  const gold = `url(#${id}g)`;
  return `<g>
    <path d="M0-61 5.9-47V20H-5.9V-47z" fill="#16264a"/>
    <path d="M0-58 4.5-45.5V18H0z" fill="url(#${id}br)"/><path d="M0-58-4.5-45.5V18H0z" fill="url(#${id}bl)"/>
    <path d="M0-47V14" stroke="#5d7396" stroke-width="1.5" stroke-linecap="round"/><path d="M-1.5-47V14" stroke="#fff" stroke-width=".8" opacity=".85"/>
    <path d="M-2.4-53-.9-46" stroke="#fff" stroke-width="1.1" opacity=".95"/>
    <path d="M-17 17.5Q-20.5 23.5-14.5 26L-5 22.8Q0 24.8 5 22.8L14.5 26Q20.5 23.5 17 17.5L6 18.6Q0 20.2-6 18.6z" fill="${gold}" stroke="#4a2f08" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M0 17.2l3.4 3.5L0 24.4-3.4 20.7z" fill="${tone}" stroke="#0b1f4a" stroke-width="1"/><path d="M-1.4 19.3l1.4-1.1" stroke="#fff" stroke-width=".9"/>
    <rect x="-3" y="24.5" width="6" height="16" rx="1.7" fill="#3a2414" stroke="#1c1008" stroke-width="1"/>
    <path d="M-3 27.6l6 2.7M-3 32.2l6 2.7M-3 36.8l6 2.7" stroke="#c9953a" stroke-width="1.1"/>
    <circle cx="0" cy="44.5" r="5.2" fill="${gold}" stroke="#4a2f08" stroke-width="1.5"/><circle cx="-1.5" cy="43" r="1.6" fill="#fff" opacity=".8"/></g>`;
}
function defs(id) {
  return `<defs><linearGradient id="${id}bl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7fcff"/><stop offset="1" stop-color="#c3d6ee"/></linearGradient>
  <linearGradient id="${id}br" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9db6d6"/><stop offset="1" stop-color="#5f7aa0"/></linearGradient>
  <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#e2a82e"/><stop offset="1" stop-color="#8a5a0e"/></linearGradient>
  <radialGradient id="${id}f" cx="50%" cy="32%" r="78%"><stop offset="0" stop-color="#2f6fc0"/><stop offset=".6" stop-color="#14346e"/><stop offset="1" stop-color="#060f26"/></radialGradient>
  <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f9ff"/><stop offset=".5" stop-color="#8fa9ca"/><stop offset="1" stop-color="#2a3b58"/></linearGradient>
  <filter id="${id}b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>`;
}
// swords only (transparent), for placing on any button
export function swords(size = 48, tone = '#6fd0ff', shared = null) {
  const id = shared || 'sw' + ++uid;
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}">${shared ? '' : defs(id)}
    <g transform="translate(48 37) rotate(-40) scale(.8) translate(0 20)" opacity=".45" filter="url(#${id}b)"><rect x="-6" y="-60" width="12" height="110" fill="#7fd0ff"/></g>
    <g transform="translate(48 37) rotate(40) scale(.8) translate(0 20)" opacity=".45" filter="url(#${id}b)"><rect x="-6" y="-60" width="12" height="110" fill="#7fd0ff"/></g>
    <g transform="translate(48 37) rotate(-40) scale(.8) translate(0 20)">${sword(id, tone)}</g>
    <g transform="translate(48 37) rotate(40) scale(.8) translate(0 20)">${sword(id, tone)}</g></svg>`;
}
// round steel-rimmed button with the swords on it
export function attackButton(size = 56) {
  const id = 'ab' + ++uid;
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}">${defs(id)}
    <circle cx="48" cy="52" r="45" fill="#000" opacity=".4" filter="url(#${id}b)"/>
    <circle cx="48" cy="48" r="45" fill="url(#${id}r)"/><circle cx="48" cy="48" r="41" fill="#06122c"/><circle cx="48" cy="48" r="38.5" fill="url(#${id}f)"/>
    <ellipse cx="40" cy="24" rx="24" ry="9" fill="#fff" opacity=".18" transform="rotate(-14 40 24)"/>
    <g transform="translate(48 50) scale(.7) translate(-48 -44)">${swords(96, '#6fd0ff', id).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>
    <circle cx="48" cy="48" r="38.5" fill="none" stroke="#9fd0ff" stroke-opacity=".55" stroke-width="1.4"/></svg>`.replace('</defs>', '</defs>');
}
