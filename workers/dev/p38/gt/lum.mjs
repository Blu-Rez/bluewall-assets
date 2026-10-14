import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]); const R = doc.getRoot();
const walk = (n, acc) => { const m = n.getMesh(); if (m) for (const p of m.listPrimitives()) { const c = p.getAttribute('COLOR_0'); if (!c) continue; const cnt = c.getCount(); for (let i = 0; i < cnt; i++) { const e = c.getElement(i, []); acc.s += 0.2126 * e[0] + 0.7152 * e[1] + 0.0722 * e[2]; acc.n++; } } for (const ch of n.listChildren()) walk(ch, acc); };
const rows = []; for (const sc of R.listScenes()) for (const n of sc.listChildren()) { const acc = { s: 0, n: 0 }; walk(n, acc); if (acc.n) rows.push([n.getName(), +(acc.s / acc.n).toFixed(3)]); }
rows.sort((a, b) => a[1] - b[1]); console.log(rows.map((r) => r.join(' ')).join('\n'));
