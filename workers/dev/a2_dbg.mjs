import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
L.setMap('night'); L.STREAMS.length = 0; buildRoads();
hamlets().forEach((h, i) => console.log(i, 'hamlet', h.x.toFixed(0), h.z.toFixed(0), 'link', h.link.map((v) => v.toFixed(0)).join(','), 'spur len', Math.hypot(h.link[0] - h.x, h.link[1] - h.z).toFixed(0)));
for (const r of ROADS) if (!/ring|lane|mainst|westst/.test(r.name) && r.pts.some(([x, z]) => z < -100 && x > -150 && x < 260)) console.log(r.name, JSON.stringify(r.pts.map((p) => p.map(Math.round))));
