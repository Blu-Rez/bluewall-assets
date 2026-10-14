import { heraldryDebug, setGateName } from '../../bot/bluebot_v2/bluewall/client/src/her_flags.js';
import { setEmblem } from '../../bot/bluebot_v2/bluewall/client/src/textures.js';
const q = new URLSearchParams(location.search);
document.body.style.cssText = 'margin:0;background:#0b1424;color:#cfe6ff;font:14px Georgia';
const add = (c, w, title) => { const d = document.createElement('div'); d.textContent = title; d.style.padding = '6px 10px 2px'; document.body.appendChild(d); const im = new Image(); im.src = c.toDataURL(); im.style.cssText = 'display:block;margin:0 10px;width:' + w + 'px;background:repeating-conic-gradient(#223 0 25%,#334 0 50%) 0 0/16px 16px'; document.body.appendChild(im); };
await document.fonts.load('900 64px Cinzel').catch(() => {}); await document.fonts.load('900 64px Vazirmatn').catch(() => {});
if (q.get('e')) setEmblem(q.get('e'));
const D = heraldryDebug();
if (q.get('m') !== 'plaque') add(D.atlas, 900, 'atlas (crest ' + (q.get('e') || 'swords') + ')');
for (const n of (q.get('names') || 'Blꪊe Heart|دیوار آبی|Kingdom of the Northern Ice Shore|').split('|')) { setGateName(n); D.repaint(); add(D.plaque.col, 900, 'plaque: "' + n + '"'); }
if (q.get('nrm')) add(D.plaque.nrm, 900, 'normal');
await new Promise((r) => setTimeout(r, 300)); window.__ready = true;
