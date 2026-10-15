// m4_seg.js — did the recorded steps cross a wall / prop?  P.segs = [[x0,z0,y0,x1,z1,kind]]  (chords of ~0.3 m of a walker's path).  Rays at 0.45 m and 1.2 m above the walker's own height, against the meshes of the nearest worksite.
const B=__bw, T=B.THREE, W=B.world, ws=W.ctx.wsLife, sc=B.scene; sc.updateMatrixWorld(true);
const sites=new Map(); for(const a of ws.agents){ if(!sites.has(a.S.site.id)) sites.set(a.S.site.id,a.S.site); }
const byId=new Map(); sc.traverse(o=>{ if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||!o.name||!o.name.startsWith('ws:')) return; if(/:far$|glass/.test(o.name)) return; if(o.material&&o.material.transparent) return; const id=o.name.split(':')[1]; (byId.get(id)||byId.set(id,[]).get(id)).push(o); });
const list=[...sites.values()];
const ray=new T.Raycaster(); const out={n:0,hit:0,byKind:{},bySite:{},skipped:0,examples:[]}; const dir=new T.Vector3();
for(const [x0,z0,y0,x1,z1,kind] of P.segs){
  let best=null,bd=1e9; for(const s of list){ const d=Math.hypot(s.x-x0,s.z-z0); if(d<bd){ bd=d; best=s; } } if(!best||bd>(best.r||22)*1.3+10){ out.skipped++; continue; }
  const ms=byId.get(best.id)||[]; if(!ms.length){ out.skipped++; continue; }
  const dx=x1-x0, dz=z1-z0, d=Math.hypot(dx,dz); if(d<0.02) continue; dir.set(dx/d,0,dz/d);
  let hit=null; for(const h of [0.45,1.2]){ ray.set(new T.Vector3(x0,y0+h,z0),dir); ray.far=d+0.12; const hs=ray.intersectObjects(ms,false); if(hs.length){ hit=hs[0]; break; } }
  const k=out.byKind[kind]||(out.byKind[kind]={n:0,hit:0}); k.n++; out.n++;
  if(hit){ k.hit++; out.hit++; const sid=best.id; out.bySite[sid]=(out.bySite[sid]||0)+1; if(out.examples.length<12) out.examples.push([sid,+x0.toFixed(1),+z0.toFixed(1),hit.object.name]); }
}
return out;
