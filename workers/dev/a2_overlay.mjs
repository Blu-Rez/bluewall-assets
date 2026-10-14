// projects the two stream courses (and the moat centre line) through the owner's camera -> /tmp/a2_overlay.json  (screen coords in the 1999x923 reference)
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { makeCam } from '/home/claude/dev/a2_cam.mjs';
import fs from 'fs';
L.setMap('night');
const cam = makeCam(), out = {};
for (const S of L.STREAMS) out[S.id] = S.pts.map(([x, z]) => [...cam.proj(x, Math.max(L.height(x, z), -0.75), z), x, z]);
fs.writeFileSync('/tmp/a2_overlay.json', JSON.stringify(out)); console.log(Object.keys(out).map((k) => k + ' ' + out[k].length).join(', '));
