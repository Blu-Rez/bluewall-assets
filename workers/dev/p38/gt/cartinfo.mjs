import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read('/home/claude/dev/assets/kit_ws.glb');
for (const n of doc.getRoot().listNodes()) {
  if (!['ws_cart1_n','ws_logs_n','ws_stoneblocks_n','ws_boulderA_n'].includes(n.getName())) continue;
  const mesh = n.getMesh(); if (!mesh) { console.log(n.getName(), 'children', n.listChildren().map(c=>c.getName())); continue; }
  const pos = mesh.listPrimitives().flatMap(p => Array.from(p.getAttribute('POSITION').getArray()));
  let mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9]; for (let i=0;i<pos.length;i+=3) for (let k=0;k<3;k++){mn[k]=Math.min(mn[k],pos[i+k]);mx[k]=Math.max(mx[k],pos[i+k]);}
  console.log(n.getName(), 'min', mn.map(v=>v.toFixed(2)), 'max', mx.map(v=>v.toFixed(2)), 'T', n.getTranslation(), 'S', n.getScale());
  if (n.getName()==='ws_cart1_n') { // y layers
    const ys = {}; for (let i=0;i<pos.length;i+=3){ const y=Math.round(pos[i+1]*4)/4; ys[y]=(ys[y]||0)+1; } console.log(JSON.stringify(ys));
    const hi = []; for (let i=0;i<pos.length;i+=3) if (pos[i+1]>1.2) hi.push([pos[i],pos[i+2]]); console.log('high verts', hi.length, hi.slice(0,6));
  }
}
