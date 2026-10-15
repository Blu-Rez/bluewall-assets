// sim_kin.js — drives the paused game with a fixed step near each spot and records every mover (x,y,z,yaw, clip base, rate, start).  P = {spots:[[x,z]], secs, dt, warm}
const B=__bw, W=B.world, cam=B.camera, ws=W.ctx.wsLife, pas=window.__pas, sleep=ms=>new Promise(r=>setTimeout(r,ms));
B.pause(true); await sleep(250);
const kn=new Map(); for(const [n,k] of Object.entries(ws.kinds)) if(!kn.has(k)) kn.set(k,'ws.'+n); (pas.kinds||[]).forEach((k,i)=>kn.set(k,'pas.'+i));
const kindOf=(p)=>{ for(const [k,n] of kn) if(k.instances&&k.instances.includes(p)) return n; return '?'; };
const infoName=(p,name)=>{ const k=[...kn.entries()].find(([k,n])=>n===name); if(!k) return null; const kk=k[0]; for(const [c,i] of Object.entries(kk.info||{})) if(i.base===p.cur.base) return c; return null; };
const r3=v=>Math.round(v*1000)/1000;
const rp=window.__rp, SS=rp&&rp.S, nav=SS&&SS.nav;
const hit=(x,z)=>{ if(!nav) return null; if(nav.isWet(x,z)) return 'wet'; for(const q of SS.solids){ const dx=x-q[0],dz=z-q[1]; if(dx*dx+dz*dz<q[2]*q[2]) return 'solid'; } for(const b of SS.boxes){ const dx=x-b.x,dz=z-b.z,u=dx*b.ux+dz*b.uz,v=dx*b.vx+dz*b.vz; if(Math.abs(u)<b.hw&&Math.abs(v)<b.hd) return 'box'; } return null; };
let t=B.t+1; const out=[];
for(const [sx,sz] of P.spots){
  cam.position.set(sx,60,sz); cam.lookAt(sx,0,sz+1); cam.updateMatrixWorld(true);
  const list=[];
  const add=(p,label,extra)=>{ if(p&&!list.some(q=>q.p===p)) list.push({p,label,kind:kindOf(p),extra}); };
  for(const a of ws.agents) if(!a.fixed&&Math.hypot(a.S.site.x-sx,a.S.site.z-sz)<290) add(a.p,'agent');
  for(const a of ws.animals) if(Math.hypot(a.S.site.x-sx,a.S.site.z-sz)<290) add(a.p,'animal:'+a.sp);
  for(const c of ws.carts){ const o=c.rt.pts[0]; if(Math.hypot(o[0]-sx,o[1]-sz)<290){ add(c.horse,'cart.horse'); add(c.driver,'cart.driver'); } }
  for(const a of pas.animals) if(Math.hypot(a.p.x-sx,a.p.z-sz)<290) add(a.p,'pas.'+a.kind);
  for(const p of pas.yard) if(Math.hypot(p.x-sx,p.z-sz)<290) add(p,'pas.yard');
  const rec=list.map(()=>[]); const T=[];
  const n=Math.round(P.secs/P.dt), nw=Math.round((P.warm||0)/P.dt);
  for(let i=-nw;i<n;i++){ t+=P.dt; W.update(t,P.dt,cam); if(i<0) continue; T.push(r3(t));
    list.forEach((o,j)=>{ const p=o.p,c=p.cur; rec[j].push([r3(p.x),r3(p.y),r3(p.z),r3(p.yaw),c.base,r3(c.rate),r3(c.start),r3(p.sw||-1e9)]); }); }
  const items=[];
  list.forEach((o,j)=>{ const R=rec[j]; let mx=0; for(const r of R) mx=Math.max(mx,Math.hypot(r[0]-R[0][0],r[2]-R[0][2])); const clips=new Set(R.map(r=>r[4]));
    if(mx<1.0 && !(clips.size>1)) return;     // never moves and never changes clip: nothing to measure
    const blk={}; let nb=0; for(let j=0;j<R.length;j+=3){ const h=hit(R[j][0],R[j][2]); if(h){ blk[h]=(blk[h]||0)+1; if(nb++<2) blk.at=(blk.at||[]).concat([[R[j][0],R[j][2],h]]); } }
    items.push({label:o.label,kind:o.kind,scale:o.p.scale,lift:o.p.lift||0,blk,rows:R}); });
  out.push({spot:[sx,sz],T,items,total:list.length});
}
// clip name by base for every kind
const clips={}; for(const [k,n] of kn){ clips[n]=Object.fromEntries(Object.entries(k.info||{}).map(([c,i])=>[i.base,{name:c,count:i.count,dur:i.dur}])); }
return {dt:P.dt,out,clips};
