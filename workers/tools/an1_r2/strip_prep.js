// strip_prep.js — P = {sub:'vill'|'horse'|'trot'|'cow'|'dog'|'wolf'|'knight'|'gallop', spot:[x,z], D, fov}
const B=__bw, W=B.world, cam=B.camera, THREE=B.THREE, ws=W.ctx.wsLife, sleep=ms=>new Promise(r=>setTimeout(r,ms));
B.pause(true); await sleep(150);
const hid=[]; { let c=B.renderer.domElement; while(c&&c.parentElement){ for(const sib of c.parentElement.children) if(sib!==c){ hid.push([sib,sib.style.visibility]); sib.style.visibility='hidden'; } c=c.parentElement; } } window.__stHid=hid;
const pas=window.__pas, hz=window.__herds, kn=window.__knights||[];
cam.position.set(P.spot[0],60,P.spot[1]); cam.lookAt(P.spot[0],0,P.spot[1]+1); cam.updateMatrixWorld(true);
const pick=()=>{
  const out=[];
  if(P.sub==='vill') for(const a of ws.agents) if(!a.fixed&&a.p&&a.state==='walk'&&Math.hypot(a.p.x-P.spot[0],a.p.z-P.spot[1])<260) out.push({get:()=>({x:a.p.x,y:a.p.y,z:a.p.z,yaw:a.p.yaw}),gait:()=>a.walking||a.clip});
  if(P.sub==='cartman'||P.sub==='carthorse') for(const c of ws.carts){ const o=c.rt.pts[0]; if(Math.hypot(o[0]-P.spot[0],o[1]-P.spot[1])>290) continue; const q=P.sub==='cartman'?c.driver:c.horse; out.push({get:()=>({x:q.x,y:q.y,z:q.z,yaw:q.yaw}),gait:()=>q.name}); }
  if(P.sub==='horse'||P.sub==='trot') for(const a of pas.animals) if(a.kind==='horse') out.push({get:()=>({x:a.p.x,y:a.p.y,z:a.p.z,yaw:a.p.yaw}),gait:()=>a.gait||a.state});
  if(P.sub==='cow') for(const a of pas.animals) if(a.kind==='cow') out.push({get:()=>({x:a.p.x,y:a.p.y,z:a.p.z,yaw:a.p.yaw}),gait:()=>a.gait||a.state});
  if(P.sub==='dog') hz.dogs.list.forEach(c=>out.push({get:()=>({x:c.root.position.x,y:c.root.position.y,z:c.root.position.z,yaw:c.root.rotation.y}),gait:()=>c.name}));
  if(P.sub==='wolf') hz.wolves.list.forEach(c=>out.push({get:()=>({x:c.root.position.x,y:c.root.position.y,z:c.root.position.z,yaw:c.root.rotation.y}),gait:()=>c.name}));
  if(P.sub==='knight'||P.sub==='gallop') kn.filter(c=>c.root.position.y<(P.maxY||1e9)&&Math.hypot(c.root.position.x-P.spot[0],c.root.position.z-P.spot[1])<(P.near||1e9)).forEach(c=>out.push({get:()=>({x:c.root.position.x,y:c.root.position.y,z:c.root.position.z,yaw:c.root.rotation.y}),gait:()=>c.name}));
  return out;
};
const cand=pick(); if(!cand.length) return {err:'no subject'};
let t=B.t+1; { const ks=new Set([...Object.values(ws.kinds||{}),...(pas&&pas.kinds||[])]); for(const k of ks){ if(!k||!k.instances) continue; for(const p of k.instances){ const c=p.cur; if(c&&c.start>t) t=c.start+0.5; if(p.sw>t&&p.sw<1e8) t=p.sw+0.5; } } }   // the crowd clock must run ahead of every start / switch time the live game wrote (else the cross-fade stays on the previous clip)
const hist=cand.map(()=>[]); let chosen=null, steps=0; const want=P.sub==='trot'?'Trot':P.sub==='gallop'?'Gallop':null;
const occ=[]; B.scene.traverse(o=>{ if(!o.isMesh||o.isSkinnedMesh||!o.visible||o.name==='terrain'||o.name==='water') return; if(o.isInstancedMesh&&o.geometry.attributes.skinIndex) return; if(o.material&&(o.material.transparent||o.material.depthWrite===false)) return; let p=o; while(p){ if(p.visible===false) return; p=p.parent; } occ.push(o); });
const rc=new THREE.Raycaster(); const occBS=occ.map(o=>{ if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); return o.geometry.boundingSphere.clone().applyMatrix4(o.matrixWorld); });
const near=(s,r)=>occ.filter((o,i)=>occBS[i].center.distanceTo(new THREE.Vector3(s.x,s.y,s.z))<r+occBS[i].radius);
const movers=()=>{ const o=[]; const push=(p)=>{ if(p&&Number.isFinite(p.x)&&p.y>-500) o.push([p.x,p.z]); }; for(const a of ws.agents) push(a.p); for(const a of ws.animals) push(a.p); for(const c of ws.carts){ push(c.horse); push(c.driver); } for(const a of pas.animals) push(a.p); for(const p of pas.yard) push(p); if(hz){ hz.dogs.list.forEach(c=>push(c.root.position)); hz.wolves.list.forEach(c=>push(c.root.position)); } kn.forEach(c=>push(c.root.position)); return o; };
const segD=(px,pz,ax,az,bx,bz)=>{ const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1; let u=((px-ax)*dx+(pz-az)*dz)/l2; u=Math.max(0,Math.min(1,u)); return Math.hypot(px-(ax+u*dx),pz-(az+u*dz)); };
const freeSide=(c,side)=>{ const s=c.get(); const occN=near(s,P.D+14); const mv=movers(); const fx=Math.sin(s.yaw), fz=Math.cos(s.yaw), rx=Math.cos(s.yaw)*side, rz=-Math.sin(s.yaw)*side; const lim=Math.max(P.D,8);
  for(const d of [-4,-2,0,2,4,7]){ const tx=s.x+fx*d, tz=s.z+fz*d, ty=s.y+P.D*0.075+0.4; const cx=tx+rx*P.D, cz=tz+rz*P.D, cy=s.y+P.D*0.16+1.0; const dir=new THREE.Vector3(tx-cx,ty-cy,tz-cz); const L=dir.length(); dir.normalize(); rc.set(new THREE.Vector3(cx,cy,cz),dir); rc.far=L-0.5; const sides=occN.map(o=>{ const m=o.material; return Array.isArray(m)?m.map(x=>x.side):m.side; }); occN.forEach(o=>{ const m=o.material; (Array.isArray(m)?m:[m]).forEach(x=>{ x.side=THREE.DoubleSide; }); });
    const hit=rc.intersectObjects(occN,false).length; occN.forEach((o,i)=>{ const m=o.material; (Array.isArray(m)?m:[m]).forEach((x,j)=>{ x.side=Array.isArray(m)?sides[i][j]:sides[i]; }); }); if(hit) return false;
    for(const [mx,mz] of mv){ if(Math.hypot(mx-s.x,mz-s.z)<3.2) continue; if(segD(mx,mz,cx,cz,tx,tz)<2.4||Math.hypot(mx-cx,mz-cz)<4) return false; } } return true; };
const mv=(k)=>{ const h=hist[k]; if(h.length<24) return 0; const a=h[h.length-24], b=h[h.length-1]; return Math.hypot(b.x-a.x,b.z-a.z)/(23*0.0333); };
while(!chosen&&steps<(P.maxSteps||420)){ t+=0.0333; W.update(t,0.0333,cam); steps++;
  cand.forEach((c,k)=>{ hist[k].push(c.get()); if(hist[k].length>40) hist[k].shift(); });
  if(steps%6===0){ const cs=pick(); }   // keep alive
  cand.forEach((c,k)=>{ if(chosen) return; const v=mv(k); const g=String(c.gait()); const okG=want?new RegExp(want,'i').test(g)||(P.sub==='trot'&&g==='trot'):true; const h=hist[k]; if(h.length<24) return;
    const y0=h[h.length-24].yaw, y1=h[h.length-1].yaw, dy=Math.abs(Math.atan2(Math.sin(y1-y0),Math.cos(y1-y0)));
    if(okG && v>(P.vmin||0.8) && dy<0.05 && steps%12===0){ const sd=freeSide(c,1)?1:freeSide(c,-1)?-1:0; if(sd) chosen={c,k,v,side:sd}; } }); }
if(!chosen) return {err:'none cruising',steps};
window.__st={c:chosen.c,side:chosen.side,t,D:P.D,fov:P.fov||26,marks:[],cam0:{fov:cam.fov}};
// ground marks every 1 m along the subject's heading line, 0.8 m to the camera side
const s=chosen.c.get(), fx=Math.sin(s.yaw), fz=Math.cos(s.yaw), rx=Math.cos(s.yaw)*chosen.side, rz=-Math.sin(s.yaw)*chosen.side;
const mat=new THREE.MeshBasicMaterial({color:0xff2020}), mat2=new THREE.MeshBasicMaterial({color:0xffffff}), geo=new THREE.BoxGeometry(0.05,0.35,0.05);
const g=new THREE.Group(); g.name='stripMarks';
const span=P.span||14, step=P.mstep||1;
for(let d=-span;d<=span*1.5;d+=step){ const x=s.x+fx*d+rx*0.9, z=s.z+fz*d+rz*0.9; const m=new THREE.Mesh(geo,(Math.round(d/step)%5===0)?mat2:mat); m.position.set(x,W.fastHeight(x,z)+0.17,z); g.add(m); }
B.scene.add(g); window.__st.g=g;
return {ok:1,steps,v:chosen.v,gait:String(chosen.c.gait()),pos:s};
