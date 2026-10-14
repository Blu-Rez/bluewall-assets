import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { makeCam } from '/home/claude/dev/a2_cam.mjs';
L.setMap('night'); const cam = makeCam();
const P = (n, x, y, z) => { const p = cam.proj(x, y, z); console.log(n.padEnd(34), p[0].toFixed(0) + ',' + p[1].toFixed(0)); };
P('S1 fall foot (-158,2,-417)', -158, 2.3, -417); P('S1 fall crest (-161,94,-437)', -161, 93.7, -437);
P('S2 cand foot (-27,2,-430)', -27, 2.3, -430); P('S2 cand crest (-23,120,-451)', -23, 119.8, -451);
P('S2 mouth (-33,6,-394)', -33, 6, -394);
P('S2 alt P0 (-60,?,-420)', -60, L.height(-60, -420), -420);
