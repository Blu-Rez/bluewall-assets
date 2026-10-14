import fs from 'fs';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
L.setMap('night'); buildRoads();
const base = JSON.parse(fs.readFileSync('/home/claude/dev/a2_records_base.json', 'utf8')).NOMADS, now = nomads();
now.forEach((h, i) => console.log(i, 'now', h.x.toFixed(1), h.z.toFixed(1), 'r', h.r, '| base', base[i] && base[i].x.toFixed(1), base[i] && base[i].z.toFixed(1)));
const S = L.STREAMS; for (const h of now) console.log('dist to streams', S.map((s) => Math.min(...s.pts.map((p) => Math.hypot(p[0] - h.x, p[1] - h.z))).toFixed(0)).join(' '));
