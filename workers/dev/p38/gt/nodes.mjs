import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]); const R = doc.getRoot();
const rows = [];
for (const n of R.listNodes()) { const m = n.getMesh(); if (!m) continue; let t = 0; const mats = new Set(); for (const p of m.listPrimitives()) { const ix = p.getIndices(); t += (ix ? ix.getCount() : p.getAttribute('POSITION').getCount()) / 3; const mt = p.getMaterial(); if (mt) mats.add((mt.getName() || '?') + ':' + mt.getBaseColorFactor().map((v) => v.toFixed(2)).join(',') + (mt.getBaseColorTexture() ? '+tex' : '')); } rows.push([n.getName(), Math.round(t), [...mats].join(' | ')]); }
rows.sort((a, b) => b[1] - a[1]);
const only = process.argv[3];
for (const r of rows) if (!only || r[0].includes(only)) console.log(r[0].padEnd(24), String(r[1]).padStart(7), r[2].slice(0, 160));
console.log('total nodes', rows.length, 'tris', rows.reduce((s, r) => s + r[1], 0));
