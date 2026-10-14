import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read('/home/claude/dev/assets/kit_ws.glb');
function walk(n, f) { f(n); n.listChildren().forEach((c) => walk(c, f)); }
for (const n of doc.getRoot().listNodes()) {
  if (n.getName() !== 'ws_cart1') continue;
  const info = {};
  walk(n, (m) => { const mesh = m.getMesh(); if (!mesh) return; for (const p of mesh.listPrimitives()) { const mat = p.getMaterial(); const col = p.getAttribute('COLOR_0'); let avg = null; if (col) { const a = col.getArray(), c = col.getElementSize(); let s=[0,0,0]; const cnt=a.length/c; for (let i=0;i<a.length;i+=c){s[0]+=a[i];s[1]+=a[i+1];s[2]+=a[i+2];} avg = s.map(v=>(v/cnt).toFixed(2)); }
    const pos = p.getAttribute('POSITION'); let mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9]; const a=pos.getArray(); for (let i=0;i<a.length;i+=3) for (let k=0;k<3;k++){mn[k]=Math.min(mn[k],a[i+k]);mx[k]=Math.max(mx[k],a[i+k]);}
    console.log(m.getName(), 'mat', mat && mat.getName(), mat && mat.getBaseColorFactor().map(v=>v.toFixed(2)).join(','), 'vcol', avg, 'bbox', mn.map(v=>v.toFixed(2)).join(','), '|', mx.map(v=>v.toFixed(2)).join(',')); } });
}
