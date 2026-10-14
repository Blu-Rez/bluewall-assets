import { drawCrest, EMBLEM_IDS, crestURL, normEmblem } from '../bot/bluebot_v2/bluewall/client/src/emblems.js';
const c = document.createElement('canvas'); const COLS = 6, S = 168, rows = Math.ceil(EMBLEM_IDS.length / COLS);
c.width = COLS * S; c.height = rows * S + 80; document.body.appendChild(c); document.body.style.margin = 0; document.body.style.background = '#0b1220';
const g = c.getContext('2d'); g.fillStyle = '#0b1220'; g.fillRect(0, 0, c.width, c.height);
EMBLEM_IDS.forEach((id, i) => { drawCrest(g, id, (i % COLS) * S + S / 2, Math.floor(i / COLS) * S + S / 2, S - 16); });
// small row
EMBLEM_IDS.forEach((id, i) => { const im = new Image(); im.src = crestURL(id, 32); im.onload = () => g.drawImage(im, 8 + i * 40, rows * S + 24, 32, 32); });
window.__done = true;
