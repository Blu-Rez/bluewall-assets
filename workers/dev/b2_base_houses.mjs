// b2_base_houses.mjs — baseline: how many triangles / draw calls do the CURRENT generic town houses (town.js) cost?
// node-only: runs buildTown with a counting Batcher (the same Batcher class the game uses) and per-block deltas.
import * as THREE from 'three';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { Batcher } from '/home/claude/bot/bluebot_v2/bluewall/client/src/util.js';
import { buildTown } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town.js';
L.setMap('night'); buildRoads();
const mk = (n) => { const m = new THREE.MeshStandardMaterial({ vertexColors: true }); m.name = n; return m; };
// the real game has 7 distinct house materials (plaster, brick, stone, roof, wood, window, dark) + gold (church ball) - mirror that
const M = { plaster: mk('plaster'), roof: mk('roof'), stone: mk('brick'), stoneDark: mk('stone'), wood: mk('wood'), window: mk('window'), dark: mk('dark'), gold: mk('gold') };
const B = new Batcher();
const tris = () => { let t = 0; for (const g of B.groups.values()) for (const geo of g.geos) t += geo.attributes.position.count / 3; return t; };
const blocks = []; let last = 0, lastTgt = null;
const ctx = { B, M, height: (x, z) => L.height(x, z),
  tgt(t) { const now = tris(); if (lastTgt) blocks.push({ ...lastTgt, tris: now - last }); last = now; lastTgt = t; B.bid(1); return blocks.length + 1; },
  pick() {}, smokeAt() {}, inst() {}, hex() {}, torch() {}, innerTrees: [] };
const scene = new THREE.Scene();
const out = buildTown(ctx, {}, { level: process.argv[2] || 'high' }, scene);
const now = tris(); if (lastTgt) blocks.push({ ...lastTgt, tris: now - last });
const houses = out.houses.filter((h) => h.kind !== 'church');
let hT = 0, hN = 0, church = 0; for (const b of blocks) { if (b.type === 'church') church += b.tris; else { hT += b.tris; hN += b.n; } }
const draw = [...B.groups.entries()].filter(([, g]) => g.geos.length).length;
const perMat = [...B.groups.entries()].map(([m, g]) => `${m.name}:${g.geos.reduce((a, geo) => a + geo.attributes.position.count / 3, 0) | 0}`).join(' ');
console.log(JSON.stringify({ quality: process.argv[2] || 'high', lots: out.houses.length, townHouses: houses.length, blocks: blocks.length, housesInBlocks: hN, trisHouses: Math.round(hT), trisPerHouse: Math.round(hT / hN), trisChurch: Math.round(church), trisTotal: Math.round(now), drawCallsBatched: draw, perMaterialTris: perMat }));
