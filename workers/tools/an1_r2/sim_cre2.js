// sim_cre2.js — dogs, wolves, knights' horses: what really touches the ground.  The lowest skinned vertices (hoof / paw geometry) are tracked in world space every frame; a vertex within 4 % of the body height
// above the creature's ground counts as planted, and its speed over the ground is the foot sliding (cm/s).  P = {secs, dt, warm, spots:[[x,z]]}
const B=__bw, W=B.world, cam=B.camera, THREE=B.THREE, sleep=ms=>new Promise(r=>setTimeout(r,ms));
B.pause(true); await sleep(250);
const hz=window.__herds, kn=window.__knights||[];
const list=[];
if(hz){ hz.dogs.list.forEach((c,i)=>list.push({c,label:'dog'+i,kind:'dog'})); hz.wolves.list.forEach((c,i)=>list.push({c,label:'wolf'+i,kind:'wolf'})); }
kn.forEach((c,i)=>list.push({c,label:'horse(knight)'+i,kind:'knight'}));
const p=new THREE.Vector3(), rp=new THREE.Vector3();
for(const o of list){ const c=o.c; c.root.updateMatrixWorld(true); const meshes=[]; c.inner.traverse(m=>{ if(!m.isSkinnedMesh) return; for(let q=m;q&&q!==c.inner;q=q.parent) if(q.userData&&q.userData.farRef) return; meshes.push(m); });
  let gmin=1e9,gmax=-1e9; const all=[]; for(const m of meshes){ const n=m.geometry.attributes.position.count; for(let i=0;i<n;i+=Math.max(1,Math.ceil(n/1500))){ m.getVertexPosition(i,p); p.applyMatrix4(m.matrixWorld); all.push([m,i,p.y]); if(p.y<gmin)gmin=p.y; if(p.y>gmax)gmax=p.y; } }
  o.H=gmax-gmin; o.cand=all.filter(a=>a[2]<gmin+0.2*o.H).map(a=>[a[0],a[1]]).slice(0,400); o.prev=[]; }
const r3=v=>Math.round(v*1000)/1000; const out=[]; let t=B.t+1;
for(const [sx,sz] of P.spots){
  cam.position.set(sx,60,sz); cam.lookAt(sx,0,sz+1); cam.updateMatrixWorld(true);
  const near=list.filter(o=>{ const q=o.c.root.getWorldPosition(new THREE.Vector3()); return Math.hypot(q.x-sx,q.z-sz)<250; });
  const rec=near.map(()=>[]); const n=Math.round(P.secs/P.dt), nw=Math.round((P.warm||0)/P.dt);
  near.forEach(o=>{ o.px=null; o.pp=null; });
  for(let i=-nw;i<n;i++){ t+=P.dt; W.update(t,P.dt,cam);
    near.forEach((o,j)=>{ const c=o.c; c.root.updateMatrixWorld(true); c.root.getWorldPosition(rp); const gy=rp.y;
      const cur=new Float32Array(o.cand.length*3), lowF=new Uint8Array(o.cand.length); const thr=gy+0.04*o.H;
      o.cand.forEach(([m,idx],k)=>{ m.getVertexPosition(idx,p); p.applyMatrix4(m.matrixWorld); cur[k*3]=p.x; cur[k*3+1]=p.y; cur[k*3+2]=p.z; lowF[k]=p.y<=thr?1:0; });
      let ss=0, sn=0;
      if(o.pp&&o.pk){ for(let k=0;k<o.cand.length;k++){ if(lowF[k]&&o.pk[k]){ const dx=cur[k*3]-o.pp[k*3], dz=cur[k*3+2]-o.pp[k*3+2]; ss+=Math.hypot(dx,dz)/P.dt; sn++; } } }
      o.pp=cur; o.pk=lowF;
      if(i>=0) rec[j].push({x:r3(rp.x),y:r3(rp.y),z:r3(rp.z),yaw:r3(c.root.rotation.y),clip:c.name||'',ts:c.act?r3(c.act.timeScale):0,ss:sn?r3(ss/sn*100):-1,sn}); }); }
  near.forEach((o,j)=>out.push({spot:[sx,sz],label:o.label,kind:o.kind,scale:o.c.scale,H:o.H,ncand:o.cand.length,rows:rec[j]}));
}
return {dt:P.dt,out};
