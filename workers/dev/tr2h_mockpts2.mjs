// tr2h_mockpts2.mjs — every bridge of the game with its crossing normal and the town-wall signed distance 18 m up / down the river (to pick a free spot for the preview mock)
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout } from '../bot/bluebot_v2/bluewall/client/src/nav.js';
const br = bridgesFromLayout(L); const out = [];
br.forEach((b, i) => { const tx = b.tx, tz = b.tz; out.push({ i, x: +b.x.toFixed(1), z: +b.z.toFixed(1), nx: +b.nx.toFixed(3), nz: +b.nz.toFixed(3), tx: +tx.toFixed(3), tz: +tz.toFixed(3), len: b.len, wid: b.wid, sdTown: +L.sdTown(b.x, b.z).toFixed(1), sdA: +L.sdTown(b.x + tx * 18, b.z + tz * 18).toFixed(1), sdB: +L.sdTown(b.x - tx * 18, b.z - tz * 18).toFixed(1) }); });
console.log(JSON.stringify(out));
