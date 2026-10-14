import { drawCrest, EMBLEM_IDS } from '../bot/bluebot_v2/bluewall/client/src/emblems.js';
const wrap = document.getElementById('g');
for (const id of EMBLEM_IDS) {
  const d = document.createElement('div'); d.className = 'c';
  const c = document.createElement('canvas'); c.width = c.height = 220; drawCrest(c.getContext('2d'), id, 110, 110, 212);
  const l = document.createElement('div'); l.textContent = id; d.append(c, l); wrap.appendChild(d);
}
window.__ready = true;
