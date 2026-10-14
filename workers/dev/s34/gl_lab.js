import { paintEmblem } from '../../bot/bluebot_v2/bluewall/client/src/squadicon.js';
import { SQUAD_COLOR } from '../../bot/bluebot_v2/bluewall/client/src/squadring.js';
import { NAME } from '../../bot/bluebot_v2/bluewall/client/src/armyui.js';
const Q = new URLSearchParams(location.search), types = (Q.get('t') || 'spear,sword,guard,archer,cavalry,axerider,pegasus,baby,dragon,dragonling,giant,hill,imp,mage,catapult,ram,cannon,trebuchet,werewolf,shieldmaiden,lord').split(',');
const S = +(Q.get('s') || 200), cols = +(Q.get('c') || 5), rows = Math.ceil(types.length / cols), LAB = 34, c = document.createElement('canvas'); c.width = S * cols; c.height = (S + LAB) * rows; document.body.style.margin = 0; document.body.appendChild(c);
const g = c.getContext('2d'); g.fillStyle = '#6f8442'; g.fillRect(0, 0, c.width, c.height);
for (let i = 0; i < 12000; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60},${70 + Math.random() * 70},${20 + Math.random() * 30},.25)`; g.fillRect(Math.random() * c.width, Math.random() * c.height, 3, 3); }
types.forEach((t, i) => {
  const x = (i % cols) * S, y = ((i / cols) | 0) * (S + LAB);
  paintEmblem(g, x + S / 2, y + S / 2, S, t, SQUAD_COLOR[t] || '#7be28f');
  g.font = 'bold 17px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 4; const lab = (i + 1) + '  ' + (NAME[t] || t); g.strokeText(lab, x + S / 2, y + S + 22); g.fillText(lab, x + S / 2, y + S + 22);
});
window.__ready = true;
