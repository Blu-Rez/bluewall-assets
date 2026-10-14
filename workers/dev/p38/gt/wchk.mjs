import { WS_SITES } from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
console.log(WS_SITES.map((s) => s.id + ':' + (s.water ? 'W' : '-')).join(' '));
