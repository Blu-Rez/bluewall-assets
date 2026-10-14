// u3_icons.js — draws the neon squad emblems of the two new units next to two old ones (the same paintEmblem the ring atlas uses), big, on the game's dark ground.  Page: u3_icons.html
import { paintEmblem } from '../bot/bluebot_v2/bluewall/client/src/squadicon.js';
const S = 384, types = [['mage', '#8fa8ff'], ['dragon3', '#8a7bff'], ['lich', '#b8a2ff'], ['darkrider', '#8a7bff']];
const c = document.createElement('canvas'); c.width = S * types.length; c.height = S; document.body.appendChild(c);
const g = c.getContext('2d'); g.fillStyle = '#1d2c44'; g.fillRect(0, 0, c.width, c.height);
types.forEach(([t, col], i) => paintEmblem(g, i * S + S / 2, S / 2, S, t, col));
g.fillStyle = '#9fb6d8'; g.font = '16px sans-serif'; types.forEach(([t], i) => g.fillText(t, i * S + 10, 20));
