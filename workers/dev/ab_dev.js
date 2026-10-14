import { heroNeon } from '../bot/bluebot_v2/bluewall/client/src/spellart.js';
const items = [['shield', '#63e6be'], ['rally', '#ffe066'], ['banner', '#8ce0ff'], ['dive', '#ffd27a'], ['shadow', '#a78bff']];
document.body.style.margin = 0; document.body.style.background = '#0b1220'; document.body.style.padding = '10px';
const row = (size) => { const d = document.createElement('div'); d.style.cssText = 'display:flex;gap:14px;margin-bottom:12px;align-items:center'; d.innerHTML = items.map(([k, c]) => heroNeon(k, c, size)).join(''); document.body.appendChild(d); };
row(54); row(150);
window.__done = true;
