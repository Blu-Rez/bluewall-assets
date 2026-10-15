// sim_cre.js — dogs, wolves, knights' horses (mixer creatures): direct foot-bone world tracking.  P = {secs, dt, spots:[[x,z]]}
const B=__bw, W=B.world, cam=B.camera, THREE=B.THREE, sleep=ms=>new Promise(r=>setTimeout(r,ms));
B.pause(true); await sleep(250);
const hz=window.__herds, kn=window.__knights||[];
const list=[]; 
if(hz){ hz.dogs.list.forEach((c,i)=>list.push({c,label:'dog'+i,kind:'dog'})); hz.wolves.list.forEach((c,i)=>list.push({c,label:'wolf'+i,kind:'wolf'})); }
kn.forEach((c,i)=>list.push({c,label:'horse(knight)'+i,kind:'knight'}));
for(const o of list){ const feet=[]; o.c.inner.traverse(b=>{ if(b.isBone&&/foot|hoof|toe|FootL|FootR|^FF\.|LowerLeg|Paw|paw/i.test(b.name)) feet.push(b); }); o.feet=feet; }
const r3=v=>Math.round(v*1000)/1000; const out=[];
const tmp=new THREE.Vector3();
let t=B.t+1;
for(const [sx,sz] of P.spots){
  cam.position.set(sx,60,sz); cam.lookAt(sx,0,sz+1); cam.updateMatrixWorld(true);
  const near=list.filter(o=>{ const q=o.c.root.getWorldPosition(new THREE.Vector3()); return Math.hypot(q.x-sx,q.z-sz)<250; });
  const rec=near.map(()=>[]); const T=[];
  const n=Math.round(P.secs/P.dt), nw=Math.round((P.warm||0)/P.dt);
  for(let i=-nw;i<n;i++){ t+=P.dt; W.update(t,P.dt,cam); if(i<0) continue; T.push(r3(t));
    near.forEach((o,j)=>{ const c=o.c; c.root.updateMatrixWorld(true); const p=c.root.getWorldPosition(new THREE.Vector3());
      const f=o.feet.map(b=>{ b.getWorldPosition(tmp); return [r3(tmp.x),r3(tmp.y),r3(tmp.z)]; });
      rec[j].push({x:r3(p.x),y:r3(p.y),z:r3(p.z),yaw:r3(c.root.rotation.y),clip:c.name||'',ts:c.act?r3(c.act.timeScale):0,st:c.state||'',feet:f}); }); }
  near.forEach((o,j)=>{ out.push({spot:[sx,sz],label:o.label,kind:o.kind,scale:o.c.scale,nfeet:o.feet.length,names:o.feet.map(b=>b.name),T,rows:rec[j]}); });
}
return {dt:P.dt,out,counts:{dogs:hz?hz.dogs.list.length:0,wolves:hz?hz.wolves.list.length:0,knights:kn.length}};
