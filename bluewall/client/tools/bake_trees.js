import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { Tree } from '../node_modules/@dgreenheck/ez-tree/src/lib/index.js';
const SPECS = JSON.parse(new URLSearchParams(location.search).get('s'));
window.__out = {};
(async () => {
  await new Promise((r) => setTimeout(r, 2500)); // let EZ-Tree textures load
  const ex = new GLTFExporter();
  for (const sp of SPECS) {
    const t = new Tree(); t.loadPreset(sp.preset); t.options.seed = sp.seed;
    const o = t.options;
    if (sp.leaves) o.leaves.count = Math.round(o.leaves.count * sp.leaves);
    if (sp.lsize) o.leaves.size *= sp.lsize;
    if (sp.tint != null) o.leaves.tint = sp.tint;
    if (sp.lod) { for (const k of Object.keys(o.branch.sections)) o.branch.sections[k] = Math.max(3, Math.round(o.branch.sections[k] * sp.lod)); for (const k of Object.keys(o.branch.segments)) o.branch.segments[k] = Math.max(2, Math.round(o.branch.segments[k] * sp.lod)); }
    if (sp.levels != null) o.branch.levels = sp.levels;
    t.generate();
    t.updateMatrixWorld(true);
    const tris = (m) => (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
    const bb = new THREE.Box3().setFromObject(t);
    const glb = await ex.parseAsync(t, { binary: true });
    let bin = ''; const u8 = new Uint8Array(glb); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    window.__out[sp.name] = { b64: btoa(bin), info: `${sp.name} branches ${tris(t.branchesMesh)} leaves ${tris(t.leavesMesh)} h ${(bb.max.y - bb.min.y).toFixed(1)}` };
  }
  window.__done = true;
})();
