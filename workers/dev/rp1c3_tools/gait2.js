(async()=>{
 const api=window.__rp,S=api.S,h=S.hero; api.pause(true); S.doorHook=()=>{}; S.cool=99; const A=h.acts;
 function wrapPi(a){a=(a+Math.PI)%(Math.PI*2); if(a<0)a+=Math.PI*2; return a-Math.PI}
 const reset=()=>{ S.inp.x=0; S.inp.y=0; S.sprint=false; api.setPos(41,22,-0.73); S.camYaw=-0.73; api.sim(1.0); };
 reset(); S.inp.y=1; let t=0,tA=null,tA2=null; while(t<2){ api.sim(1/60); t+=1/60; const sp=Math.hypot(S.vx,S.vz); if(tA===null&&sp>=0.95*5.51) tA=t; }
 reset(); S.inp.y=0.55; let t2=0, tW=null; while(t2<2){ api.sim(1/60); t2+=1/60; const sp=Math.hypot(S.vx,S.vz); if(tW===null&&sp>=0.95*1.48) tW=t2; }
 // side-to-side flip while running: right then left (a 180 turn of travel, camera fixed)
 reset(); S.inp.x=1; S.inp.y=0; api.sim(1.6); const b0=S.body; S.inp.x=-1; t=0; const tr=[]; let maxRoll=0,t10=null,t90=null,minSp=9; while(t<1.4){ api.sim(1/60); t+=1/60; const d=Math.abs(wrapPi(S.body-b0)); if(t10===null&&d>0.1*Math.PI) t10=t; if(t90===null&&d>0.9*Math.PI) t90=t; maxRoll=Math.max(maxRoll,Math.abs(h.model.rotation.z)); minSp=Math.min(minSp,Math.hypot(S.vx,S.vz)); if(Math.round(t*60)%6==0) tr.push([+t.toFixed(2),+d.toFixed(2),+h.model.rotation.z.toFixed(3),+Math.hypot(S.vx,S.vz).toFixed(2)]); }
 reset();
 return JSON.stringify({accRun95:+tA.toFixed(2), accWalk95:+tW.toFixed(2), turn:{t10,t90,maxRoll:+maxRoll.toFixed(3),minSp:+minSp.toFixed(2),tr}})})()
