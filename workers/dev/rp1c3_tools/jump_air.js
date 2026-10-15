(async()=>{
 const api=window.__rp,S=api.S,h=S.hero; api.pause(true); S.doorHook=()=>{}; S.cool=99; const out=[];
 const Vv=h.grp.position.constructor; const v=new Vv(); const pel=h.model.getObjectByName('Pelvis');
 for(const [lab,mag] of [['stand',0],['walk',0.5],['run',1]]){
  api.setPos(41,22,-0.73); S.camYaw=-0.73; api.sim(1.0); S.inp.x=0; S.inp.y=mag; api.sim(1.2); const g0=S.y, v0=Math.hypot(S.vx,S.vz); const x0=S.x,z0=S.z;
  api.jump(); let n=0, tTake=null, tLand=null, hmin=9, tHmin=null, vAtLand=null, hsLand=null;
  while(n<150){ api.sim(1/60); n++; const t=n/60; if(tTake===null && S.y>g0+0.002) tTake=t; if(tTake!==null&&tLand===null&&S.st==='land'){tLand=t; hsLand=Math.hypot(S.vx,S.vz);}
   if(tLand!==null){ h.grp.updateMatrixWorld(true); pel.getWorldPosition(v); const hy=v.y-S.y; if(hy<hmin){hmin=hy;tHmin=t;} if(t-tLand>0.5) break; } }
  const dx=S.x-x0, dz=S.z-z0;
  out.push({lab, v0:+v0.toFixed(2), air:+(tLand-tTake+1/60).toFixed(3), landAt:+tLand.toFixed(3), absorbBottom:+(tHmin-tLand).toFixed(3), hsLand:+hsLand.toFixed(2)});
 }
 S.inp.y=0; return JSON.stringify(out)})()
