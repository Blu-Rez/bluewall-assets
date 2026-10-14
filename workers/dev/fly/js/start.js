window.__f = window.__f || { sleep:(ms)=>new Promise(r=>setTimeout(r,ms)) };
const h=document.querySelector('.bwb'); 
const a=__bw.econ.st.army; a.army=window.__ARMY||{spear:4,pegasus:2,baby:2,dragon:2,baby3:2,dragon3:2}; a.forge=20; a.lv={};
const T={levels:{keep:20,wall:20,towers:20},seed:11,ratio:1.0,power:3000,loot:{turq:60,emerald:60,ruby:60},tesla:0,emblem:'swords',name:'Navid'};
__bw.battle.start(T,null,null);
for(let i=0;i<1800;i++){ await __f.sleep(500); if(__bw.battle.session && !__bw.battle.loading) break; }
const S=__bw.battle.session; S.cam.intro=0; S.cam.free=true;
window.__stage = { S, kinds:Object.keys(S.views.kinds) };
const hud=document.querySelector('.bwb'); if(hud) hud.style.display='none';
return {ok:!!S, types:[...new Set(S.sim.units.map(u=>u.type))], kinds:Object.keys(S.views.kinds), dp:S.sim.deploy, vp:[innerWidth,innerHeight], fov:__bw.camera.fov};
