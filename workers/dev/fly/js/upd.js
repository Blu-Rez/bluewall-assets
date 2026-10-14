const S=__bw.battle.session, cam=__bw.camera; const n=30; for(let i=0;i<5;i++) S.views.update(S.t+0.033*(i+1),0.033,cam);
const t0=performance.now(); for(let i=0;i<n;i++){ S.views.update(S.t+0.2+0.033*(i+1),0.033,cam); } const ms=(performance.now()-t0)/n;
const vis={}; for(const [k,kk] of Object.entries(S.views.kinds)){ if(kk.drawn) vis[k]=kk.drawn[0]; }
return {msPerUpdate:+ms.toFixed(2), units:S.sim.units.length, vis};
