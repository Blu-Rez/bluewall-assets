import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, prune, dedup, textureCompress, quantize, meshopt, dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from "fs";
await MeshoptDecoder.ready; await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder});
const tris = d => { let t=0; for (const m of d.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i=p.getIndices(); t+=(i?i.getCount():p.getAttribute('POSITION').getCount())/3; } return Math.round(t); };
const src=process.argv[2], outf=process.argv[3], target=+process.argv[4], w=+process.argv[5]||1, flags=(process.argv[6]||'Permissive').split(',').filter(Boolean);
const d=await io.read(src); await d.transform(dequantize()); await d.transform(weld()); const before=tris(d);
const p=d.getRoot().listMeshes()[0].listPrimitives()[0];
const ia=Uint32Array.from(p.getIndices().getArray()); const pa=Float32Array.from(p.getAttribute('POSITION').getArray()); const uv=Float32Array.from(p.getAttribute('TEXCOORD_0').getArray());
const tgt=Math.min(target, Math.floor(ia.length/3));
const [ni,err]= tgt>=ia.length/3 ? [ia,0] : MeshoptSimplifier.simplifyWithAttributes(ia,pa,3,uv,2,[w,w],null,tgt*3,1.0,flags);
console.log('simplifyWithAttributes ->',ni.length/3,'err',err.toFixed(4),flags.join('+'),'w',w);
const usedV=new Map(); const out=new Uint32Array(ni.length);
for(let k=0;k<ni.length;k++){const v=ni[k];let m=usedV.get(v);if(m===undefined){m=usedV.size;usedV.set(v,m);}out[k]=m;}
for(const sem of p.listSemantics()){const acc=p.getAttribute(sem);const es=acc.getElementSize();const srcA=acc.getArray();const arr=new Float32Array(usedV.size*es);for(const [v,m] of usedV)for(let k=0;k<es;k++)arr[m*es+k]=srcA[v*es+k];acc.setArray(arr);}
p.getIndices().setArray(out);
await d.transform(prune(), dedup());
await d.transform(textureCompress({encoder:sharp, targetFormat:'webp', resize:[1024,1024], quality:80}));
await d.transform(quantize(), meshopt({encoder:MeshoptEncoder, level:'medium'}));
await io.write(outf,d); console.log('written',tris(d),Math.round(fs.statSync(outf).size/1024)+'KB');
