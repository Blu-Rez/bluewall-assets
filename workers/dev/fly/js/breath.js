// breath.js: window.__B = { type, k (index of the unit of that type), fwd, heads, big }
const S=__bw.battle.session, B=window.__B||{}; const us=S.sim.units.filter(u=>u.type===B.type); const u=us[B.k||0]; if(!u) return 'none';
const heads=B.heads||1, sx=Math.sin(u.face), sz=Math.cos(u.face), px=Math.cos(u.face), pz=-Math.sin(u.face), side=[0,-1,1];
for(let h=0;h<heads;h++){ const o=side[h]*(B.spread??12); S.views.event({k:'breath',u:u.id,from:[u.x,15,u.z],to:[u.x+sx*(B.fwd||50)+px*o,1,u.z+sz*(B.fwd||50)+pz*o],big:B.big!==false,head:h},S.t); }
return 'ok';
