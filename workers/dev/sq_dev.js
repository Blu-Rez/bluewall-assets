import { paintAtlas } from '../bot/bluebot_v2/bluewall/client/src/squadicon.js';
const types = (location.search.match(/t=([^&]+)/) || [0, 'sword,archer,legionary,captain,ogre,gryphon,lich,treant,gryphonknight,darkrider,baby3,dragon3'])[1].split(',');
const COL = ['#4dabf7', '#74c0fc', '#63e6be', '#ffe066', '#ff922b', '#da77f2', '#a5d8ff', '#69db7c'];
const a = paintAtlas(types, (t) => COL[types.indexOf(t) % COL.length]);
document.body.style.margin = 0; document.body.style.background = '#0b1220'; a.canvas.style.width = (a.W / 2) + 'px'; document.body.appendChild(a.canvas);
const g = a.canvas.getContext('2d'); g.fillStyle = '#9fb4d6'; g.font = '16px sans-serif'; types.forEach((t, i) => g.fillText(t, (i % 4) * 256 + 8, ((i / 4) | 0) * 256 + 18));
window.__done = true;
