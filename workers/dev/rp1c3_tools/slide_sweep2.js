(async()=>{
 const api=window.__rp,S=api.S,h=S.hero; api.pause(true); S.doorHook=()=>{}; S.cool=99;
 const V=h.grp.position.constructor; const toes=[]; h.model.traverse(o=>{if(o.isBone&&/toe/i.test(o.name)) toes.push(o)}); const v=new V();
 const meas=(mag,spr)=>{ api.setPos(41,22,-0.73); S.camYaw=-0.73; api.sim(0.5); S.inp.x=0; S.inp.y=mag; S.sprint=!!spr; api.sim(1.4);
  const rec=[[],[]]; const n=240; let vs=0, hx=Math.sin(S.body), hz=Math.cos(S.body); for(let i=0;i<n;i++){ api.sim(1/60); h.grp.updateMatrixWorld(true); vs+=Math.hypot(S.vx,S.vz); toes.forEach((o,k)=>{o.getWorldPosition(v); rec[k].push([v.x,v.y-S.y,v.z])}); }
  const sg=[], ab=[]; for(let k=0;k<2;k++){ const R=rec[k]; const mn=Math.min(...R.map(p=>p[1])); for(let i=2;i<R.length;i++){ if(R[i][1]<mn+0.04 && R[i-1][1]<mn+0.04){ const dx=(R[i][0]-R[i-1][0])*60, dz=(R[i][2]-R[i-1][2])*60; sg.push((dx*hx+dz*hz)*100); ab.push(Math.hypot(dx,dz)*100);} } }
  const mean=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length); ab.sort((a,b)=>a-b);
  return {v:+(vs/n).toFixed(2), n:sg.length, signed:+mean(sg).toFixed(1), abs:+mean(ab).toFixed(1), med:+(ab[Math.floor(ab.length/2)]||0).toFixed(1)}; };
 const out={}; const G0=api.gait();
 out.run=[]; for(const f of [0.8,0.9,1.0,1.1,1.2,1.3]){ api.gait({sr:G0.sr*f}); out.run.push([f, meas(1,0)]); } api.gait({sr:G0.sr});
 out.walk=[]; for(const f of [0.8,0.9,1.0,1.1,1.2]){ api.gait({sw:G0.sw*f}); out.walk.push([f, meas(0.55,0)]); } api.gait({sw:G0.sw});
 S.inp.y=0; S.sprint=false; return JSON.stringify({G0,out})})()
