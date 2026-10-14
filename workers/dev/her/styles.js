// taste sheet: cloth palettes, plaque styles, crest styles (the default is the first of each)
import { heraldryDebug, setGateName, setHeraldryStyle } from '../../bot/bluebot_v2/bluewall/client/src/her_flags.js';
import { setEmblem } from '../../bot/bluebot_v2/bluewall/client/src/textures.js';
import { drawCrest, setCrestStyle } from '../../bot/bluebot_v2/bluewall/client/src/emblems.js';
document.body.style.cssText = 'margin:0;background:#0b1424;color:#cfe6ff;font:15px Georgia;width:1500px';
await document.fonts.load('900 64px Cinzel').catch(() => {});
const row = (title) => { const d = document.createElement('div'); d.style.cssText = 'display:flex;gap:14px;padding:4px 12px 10px;align-items:flex-end'; const h = document.createElement('div'); h.textContent = title; h.style.cssText = 'padding:12px 12px 0;font-weight:bold'; document.body.append(h, d); return d; };
const cell = (row, c, sx, sy, sw, sh, w, label) => { const o = document.createElement('canvas'); o.width = w; o.height = Math.round(w * sh / sw); const g = o.getContext('2d'); g.fillStyle = '#3a4250'; g.fillRect(0, 0, o.width, o.height); g.drawImage(c, sx, sy, sw, sh, 0, 0, o.width, o.height); const f = document.createElement('figure'); f.style.margin = '0'; const cap = document.createElement('figcaption'); cap.textContent = label; cap.style.cssText = 'font-size:13px;color:#8fb0d8;text-align:center'; f.append(o, cap); row.append(f); };
setEmblem('wolf'); setGateName('Blꪊe Heart');
const D = heraldryDebug();
const r1 = row('CLOTH (her_flags.CLOTH): flag + tall banner + square banner');
for (const s of ['navy', 'royal', 'night']) { setHeraldryStyle({ cloth: s }); cell(r1, D.atlas, 0, 0, 1024, 850, 470, s + (s === 'navy' ? ' (default)' : '')); }
const r2 = row('GATE PLAQUE (her_flags.PLAQUE_STYLE)');
for (const s of ['slate', 'bronze', 'marble']) { setHeraldryStyle({ plaque: s }); cell(r2, D.plaque.col, 0, 0, D.plaque.col.width, D.plaque.col.height, 470, s + (s === 'slate' ? ' (default)' : '')); }
setHeraldryStyle({ cloth: 'navy', plaque: 'slate' });
const r3 = row('CREST (emblems.CREST_STYLE)');
for (const s of ['forged', 'gilded', 'flat']) { setCrestStyle(s); const o = document.createElement('canvas'); o.width = 470; o.height = 170; const g = o.getContext('2d'); ['wolf', 'lion', 'dragon'].forEach((id, i) => drawCrest(g, id, 80 + i * 155, 85, 160)); const f = document.createElement('figure'); f.style.margin = '0'; const cap = document.createElement('figcaption'); cap.textContent = s + (s === 'forged' ? ' (default)' : ''); cap.style.cssText = 'font-size:13px;color:#8fb0d8;text-align:center'; f.append(o, cap); r3.append(f); }
setCrestStyle('forged');
await new Promise((r) => setTimeout(r, 300)); window.__ready = true;
