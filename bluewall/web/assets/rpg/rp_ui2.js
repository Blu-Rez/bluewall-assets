// UI2 — ONE visual language for the hero-mode markers, arrows and chips: the HUD's own blue / silver (the level plate and the round buttons of bhud.js / assist.js): a deep-blue radial plate, a thin silver bezel,
// an ice-cyan accent, white type with a dark edge.  NOT brown / gold (owner, 17 Oct 19:00; UI3 is building the shared palette in workers/docs/UI3_TOKENS.md — when it lands, PAL below is the only block to map).
// What lives here (everything is plain CSS + a canvas painter: no shader program, no image file, nothing in the boot bundle; rpg.js loads it with the hero, like rp_marker.js / rp_goup.js):
//   · PAL                the tokens (plate / bezel stops / ice / text)
//   · css(top, btm)      the HUD chip («33 m» + compass arrow) and the «Go up» pill, in three numbered looks
//                          1 = plaque (default): ONE navy plate with a silver bezel: the arrow turns on the left, «33 m» sits inside the same plate (nothing hangs under it, no second shape behind it)
//                          2 = neon tag: no plate: an ice neon chevron + the number with a dark edge and a soft dark shade (the ring emblems' thin-neon language)
//                          3 = medallion: a small round silver-bezel button with only the arrow, the number on a small plate touching its lower edge
//   · chipHtml()         the chip's markup (the arrow svg is the FIRST child, the number the LAST: rp_goup.js turns the one and writes the other)
//   · worldIcon(T)       the glass icon over the foot of a ramp (a THREE.CanvasTexture for the Points of rp_goup.js): navy plate, silver bezel, ice arrow
// Look switch: ?ui2=1|2|3 in the page (dev), ui.setLook(n) in the tests.   Budget: +0 shader programs (CSS / one canvas texture), 0 per-frame work (the chip is moved by rp_goup.js as before).
export const LOOKS = { 1: 'plaque: arrow + «33 m» in one navy plate with a silver bezel', 2: 'neon tag: ice neon chevron + number, no plate', 3: 'medallion: round silver-bezel arrow button + number plate' };
export const PAL = {
  navy: ['#2c5aa0', '#0e2350', '#050c1e'],                                    // the plate: radial, light at the top (bhud.js .bwb-loot)
  silver: [[0, '#f6faff'], [0.18, '#8aa0c0'], [0.36, '#e9f1ff'], [0.58, '#586f90'], [0.78, '#cfdcf0'], [1, '#f6faff']],   // the bezel: conic stops (bhud.js)
  ice: '#8fe8ff', iceHot: '#d9f6ff', edge: '#01060f', ink: '#eef6ff',
};
export const ARROW = 'M12 19V5M5.5 11.5L12 5l6.5 6.5';
const hex2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const SILVER_RGB = PAL.silver.map(([t, h]) => [t, hex2(h)]);
function silverAt(t) {                                                       // the bezel colour at the turn t (0..1)
  t -= Math.floor(t); for (let i = 1; i < SILVER_RGB.length; i++) { const a = SILVER_RGB[i - 1], b = SILVER_RGB[i]; if (t <= b[0]) { const u = (t - a[0]) / (b[0] - a[0] || 1); return `rgb(${(a[1][0] + (b[1][0] - a[1][0]) * u) | 0},${(a[1][1] + (b[1][1] - a[1][1]) * u) | 0},${(a[1][2] + (b[1][2] - a[1][2]) * u) | 0})`; } }
  return PAL.silver[0][1];
}
// the bezel on a canvas: 72 short arcs (no conic gradient in the canvas: older WebViews lack it), the same stops as the CSS bezel
export function bezel(g, cx, cy, R, w, from = 0.07) {
  const N = 72; g.save(); g.lineCap = 'butt'; g.lineWidth = w;
  for (let i = 0; i < N; i++) { const a0 = ((i / N) + from) * 6.2832, a1 = (((i + 1) / N) + from) * 6.2832 + 0.02; g.beginPath(); g.arc(cx, cy, R, a0, a1); g.strokeStyle = silverAt(i / N); g.stroke(); }
  g.restore();
}
// the glass icon over the foot of a ramp
export function worldIcon(T) {
  const C = 128, cv = document.createElement('canvas'); cv.width = cv.height = C; const g = cv.getContext('2d'), cx = C / 2, cy = C / 2, R = C * 0.43;
  const rg = g.createRadialGradient(cx - R * 0.25, cy - R * 0.55, R * 0.05, cx, cy, R); rg.addColorStop(0, PAL.navy[0]); rg.addColorStop(0.58, PAL.navy[1]); rg.addColorStop(1, PAL.navy[2]);
  g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fillStyle = rg; g.fill();
  g.beginPath(); g.arc(cx, cy, R + C * 0.035, 0, 6.2832); g.lineWidth = C * 0.02; g.strokeStyle = 'rgba(1,6,15,0.9)'; g.stroke();            // the dark edge outside the bezel (reads on the bright sky)
  bezel(g, cx, cy, R, C * 0.06);
  g.beginPath(); g.arc(cx, cy, R * 0.78, Math.PI * 1.1, Math.PI * 1.7); g.lineWidth = C * 0.028; g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineCap = 'round'; g.stroke();   // glass highlight
  g.save(); g.translate(cx - R * 0.6, cy - R * 0.6); const s = (R * 1.2) / 24; g.scale(s, s); g.lineCap = g.lineJoin = 'round'; const P = new Path2D(ARROW);
  g.lineWidth = 5; g.strokeStyle = 'rgba(1,6,15,0.55)'; g.stroke(P);                                                                               // a dark underlay, then the ice arrow with a white-hot core
  g.shadowColor = PAL.ice; g.shadowBlur = 5; g.lineWidth = 3.2; g.strokeStyle = PAL.ice; g.stroke(P); g.shadowBlur = 0; g.lineWidth = 1.2; g.strokeStyle = '#ffffff'; g.stroke(P); g.restore();
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 2; return t;
}
const PLATE = `border:2px solid transparent;background:radial-gradient(circle at 50% 22%,${PAL.navy[0]} 0,${PAL.navy[1]} 62%,${PAL.navy[2]} 100%) padding-box,conic-gradient(from 25deg,${PAL.silver.map(([t, h]) => h + ' ' + Math.round(t * 100) + '%').join(',')}) border-box;box-shadow:0 0 0 1px #0a1426,0 3px 8px rgba(0,0,0,.5),0 0 12px rgba(143,232,255,.26)`;
export function css(top, btm) {
  return `.rp-gu{position:absolute;pointer-events:none;z-index:41;font:700 14px/1 Vazirmatn,system-ui,sans-serif;font-variant-numeric:tabular-nums;color:${PAL.ink};text-shadow:0 1px 0 ${PAL.edge},0 0 4px rgba(1,6,15,.8)}
.rp-gu svg{stroke:${PAL.ice};fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px rgba(143,232,255,.7))}
.rp-gu i{font-style:normal;white-space:nowrap}
.rp-gu-chip{left:50%;top:calc(${top} + 8px);display:none;align-items:center}
.rs-open .rp-gu-chip{opacity:0;pointer-events:none}   /* MOTHER4 (RS2 x UI2): the sister fan is open — it needs the top row */
.rp-gu-chip[data-l="1"]{transform:translateX(-50%);height:34px;padding:0 14px 0 9px;gap:7px;border-radius:17px;${PLATE}}
.rp-gu-chip[data-l="1"] svg{width:22px;height:22px;flex:none}
.rp-gu-chip[data-l="1"] i{font-size:15px;min-width:2.5em}
.rp-gu-chip[data-l="2"]{transform:translateX(-50%);gap:6px;padding:4px 12px 4px 6px;border-radius:20px;background:radial-gradient(closest-side,rgba(3,10,26,.5),rgba(3,10,26,0))}
.rp-gu-chip[data-l="2"] svg{width:30px;height:30px;flex:none;stroke:${PAL.iceHot};stroke-width:2.8;filter:drop-shadow(0 0 1.5px ${PAL.edge}) drop-shadow(0 0 5px rgba(143,232,255,.95))}
.rp-gu-chip[data-l="2"] i{font-size:18px;text-shadow:0 0 7px rgba(143,232,255,.85),0 1px 3px ${PAL.edge},0 0 2px ${PAL.edge}}
.rp-gu-chip[data-l="3"]{margin-left:-23px;width:46px;height:46px;justify-content:center;border-radius:50%;${PLATE}}
.rp-gu-chip[data-l="3"] svg{width:26px;height:26px}
.rp-gu-chip[data-l="3"] i{position:absolute;left:50%;bottom:-15px;transform:translateX(-50%);padding:3px 9px;border-radius:10px;font-size:12px;background:rgba(5,12,30,.92);border:1px solid rgba(140,200,255,.45);box-shadow:0 2px 5px rgba(0,0,0,.45)}
.rp-gu-pill{left:50%;bottom:calc(${btm} + 34px);transform:translateX(-50%);display:none;align-items:center;gap:8px;padding:8px 18px 8px 10px;border-radius:24px;font-size:15px;${PLATE}}
.rp-gu-pill svg{width:24px;height:24px}`;
}
export const chipHtml = () => `<svg viewBox="0 0 24 24"><path d="${ARROW}"/></svg><i></i>`;
export function createUi2(G = {}) {
  const st = { look: Math.max(1, Math.min(3, G.look | 0 || 1)) };
  return { st, get look() { return st.look; }, setLook(n) { st.look = Math.max(1, Math.min(3, n | 0)); return st.look; }, css, chipHtml, worldIcon, PAL, LOOKS, ARROW };
}
