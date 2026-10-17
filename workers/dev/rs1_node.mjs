// rs1_node.mjs — RS1: the pure parts of rp_sisters.js without a browser (prefs read / write, update rate) + a fake-THREE run of the stand-in rules.   node rs1_node.mjs  -> RS1_NODE OK
import { readPrefs, writePrefs, rateAt, freeModel } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rp_sisters.js';
let fails = 0; const t = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
// prefs: round trip, garbage in -> safe defaults, bad numbers dropped, far-away places dropped
const o = { on: true, h: 2, p: { elina: [12.5, -3.25, 1.5], aylar: [-40, 7, 0] } };
const back = readPrefs(writePrefs(o)); t(back.on === true && back.h === 2 && JSON.stringify(back.p) === JSON.stringify(o.p), 'prefs round trip');
for (const bad of [null, undefined, '', '{', 'null', '[]', '{"p":{"elina":["a",1,2]}}', '{"p":{"elina":[1,2]}}', '{"p":{"elina":[1e9,2,3]}}', '{"p":{"x":[NaN,1,2]}}', 42]) { const r = readPrefs(bad); t(r && r.on === false && typeof r.p === 'object' && Object.keys(r.p).length === 0, 'garbage -> defaults: ' + String(bad)); }
t(readPrefs('{"on":1,"p":5}').on === true && Object.keys(readPrefs('{"on":1,"p":5}').p).length === 0, 'a valid flag survives garbage places');
t(readPrefs('{"on":1,"h":99,"p":{"mobina":[1,2,3,4]}}').h === 9 && readPrefs('{"on":1,"h":99,"p":{"mobina":[1,2,3,4]}}').p.mobina.length === 3, 'hint count clamped, a place keeps 3 numbers');
t(writePrefs({ on: false, h: 0, p: {} }) === '{"v":1,"on":0,"h":0,"t":0,"p":{}}', 'stored shape'); t(readPrefs(writePrefs({ on: true, h: 1, t: 1234567, p: {} })).t === 1234567 && readPrefs('{"t":"x"}').t === 0 && readPrefs('{"t":-5}').t === 0, 'the change time round-trips, garbage -> 0');
// the update rate by distance: nearer = smoother
t(rateAt(5) === 15 && rateAt(30) === 7 && rateAt(80) === 3.5 && rateAt(19.99) > rateAt(20), 'rate by distance 15 / 7 / 3.5 Hz');
// freeModel: everything the model owns is disposed once, a second call does nothing, the shared contact-shadow parts are not touched
const disp = []; const mk = (n) => ({ dispose() { disp.push(n); } });
const tex = { isTexture: true, dispose() { disp.push('tex'); }, image: { close() { disp.push('bitmap'); } } };
const mesh = { geometry: mk('geo'), skeleton: mk('skel'), material: { map: tex, other: 5, dispose() { disp.push('mat'); } } };
const blobGeo = mk('SHARED-geo'); let removed = 0, stopped = 0, uncached = 0;
const m = { grp: { removeFromParent() { removed++; } }, model: { traverse(f) { f(mesh); } }, mixer: { stopAllAction() { stopped++; }, uncacheRoot() { uncached++; } }, blob: { geometry: blobGeo }, clips: [1], acts: {}, rise: [], toes: [], ik: {} };
freeModel(m); freeModel(m); t(disp.join() === 'geo,skel,tex,bitmap,mat' && removed === 1 && stopped === 1 && uncached === 1, 'freeModel: ' + disp.join() + ' (once)'); t(m.clips === null && m.acts === null && m.ik === null, 'freeModel drops its references'); t(!disp.some((x) => /SHARED/.test(x)), 'the shared contact shadow is not disposed');
freeModel(null); t(true, 'freeModel(null) is harmless');
console.log(fails ? 'RS1_NODE FAIL ' + fails : 'RS1_NODE OK'); process.exit(fails ? 1 : 0);
