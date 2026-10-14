import { drawCrest, EMBLEM_IDS, crestURL, setCrestStyle } from '../../bot/bluebot_v2/bluewall/client/src/emblems.js';
import * as OLD from '/tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/heraldry/orig/emblems.js';
const q = new URLSearchParams(location.search), mode = q.get('m') || 'sheet';
const BG = '#0b1424';
document.body.style.cssText = 'margin:0;background:' + BG + ';color:#cfe6ff;font:15px Georgia';
function grid(title, draw, S, cols, ids = EMBLEM_IDS, pad = 10) {
  const h = document.createElement('div'); h.textContent = title; h.style.cssText = 'padding:10px 12px 2px;font-weight:bold'; document.body.appendChild(h);
  const c = document.createElement('canvas'), rows = Math.ceil(ids.length / cols); c.width = cols * (S + pad) + pad; c.height = rows * (S + pad + 16) + pad;
  const g = c.getContext('2d'); g.fillStyle = BG; g.fillRect(0, 0, c.width, c.height);
  ids.forEach((id, i) => { const x = pad + (i % cols) * (S + pad), y = pad + Math.floor(i / cols) * (S + pad + 16); draw(g, id, x + S / 2, y + S / 2, S); g.fillStyle = '#7f9cc2'; g.font = '12px Georgia'; g.textAlign = 'center'; g.fillText(id, x + S / 2, y + S + 12); });
  document.body.appendChild(c); document.body.appendChild(document.createElement('br'));
}
async function small(title, urlOf, px) {
  const h = document.createElement('div'); h.textContent = title; h.style.cssText = 'padding:8px 12px 2px'; document.body.appendChild(h);
  const row = document.createElement('div'); row.style.cssText = 'padding:4px 12px;display:flex;gap:8px;flex-wrap:wrap';
  for (const id of EMBLEM_IDS) { const im = new Image(); im.src = urlOf(id, px); im.width = im.height = px; row.appendChild(im); }
  document.body.appendChild(row);
}
if (mode === 'sheet') {
  setCrestStyle('forged');
  grid('AFTER — forged (default) at 256 px', drawCrest, 256, 6);
  await small('AFTER 32 px', crestURL, 32);
  await small('BEFORE 32 px', OLD.crestURL, 32);
  await small('AFTER 24 px', crestURL, 24);
  await small('BEFORE 24 px', OLD.crestURL, 24);
  grid('BEFORE at 256 px', OLD.drawCrest, 256, 6);
} else if (mode === 'styles') {
  const ids = ['swords', 'dragon', 'wolf', 'lion', 'eagle', 'frost'];
  for (const s of ['forged', 'gilded', 'flat']) { setCrestStyle(s); grid('CREST_STYLE = ' + s, drawCrest, 200, 6, ids); }
  for (const s of ['forged', 'gilded', 'flat']) { setCrestStyle(s); await small(s + ' 32px', crestURL, 32); }
  setCrestStyle('forged');
} else if (mode === 'one') {
  setCrestStyle(q.get('s') || 'forged');
  grid('', drawCrest, +(q.get('px') || 512), 2, (q.get('ids') || 'swords,lion').split(','));
}
await new Promise((r) => setTimeout(r, 300));
window.__ready = true;
