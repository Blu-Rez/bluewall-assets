import { orb, SPELL_KEYS } from '../../bot/bluebot_v2/bluewall/client/src/spellart.js';
const Q = new URLSearchParams(location.search), keys = SPELL_KEYS;
document.body.style.cssText = 'margin:0;background:#4f6a34;font:14px sans-serif;color:#fff';
const row = (title, size, old, bg) => `<div style="padding:10px 14px;background:${bg}"><div style="opacity:.8;margin-bottom:6px">${title}</div><div style="display:flex;gap:16px;align-items:center">${keys.map((k) => `<div style="position:relative;width:${size}px;height:${size}px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6))">${orb(k, size, old)}<b style="position:absolute;right:-6px;bottom:-4px;min-width:26px;height:20px;padding:0 4px;border-radius:10px;display:grid;place-items:center;font-size:12px;color:#fff;background:linear-gradient(180deg,#2b6bff,#0b2a8a);border:1.5px solid #cfe6ff;text-shadow:0 1px 0 #000;font-family:serif">×2</b></div>`).join('')}</div></div>`;
document.body.innerHTML = row('now', 120, false, '#5a7a3a') + row('aged', 120, true, '#5a7a3a') + row('now (HUD size)', 48, false, '#6d7f43') + row('aged (HUD size)', 48, true, '#6d7f43');
window.__ready = true;
