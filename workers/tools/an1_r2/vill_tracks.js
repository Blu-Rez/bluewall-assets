// vill_tracks.js — bone-based foot tracks of the Tripo villagers: L_Foot / R_Foot in the instance frame (metres, feet on y=0) at every baked frame of Walk_Loop, for the ORIGINAL clip (the 'before' state:
// root motion in Hip.position) and the clip as the game plays it now.  Also the frozen idle pose of both.  Needs window.__tr2life (dev peek in tr2_life.js).
const B=__bw, T=B.THREE, ws=B.world.ctx.wsLife, pas=window.__pas, TL=window.__tr2dev;
const kinds=new Map(); for(const [n,k] of Object.entries(ws.kinds)) if(k&&k.people&&!kinds.has(k)) kinds.set(k,'ws.'+n); (pas.kinds||[]).forEach((k,i)=>{ if(k&&k.people&&!kinds.has(k)) kinds.set(k,'pas.'+i); });
const out={keyOf:{},tracks:{}}; const r4=v=>+v.toFixed(4);
for(const [k,name] of kinds){ out.keyOf[name]=k.key; }
for(const key of new Set([...kinds.keys()].map(k=>k.key))){
  const kind=[...kinds.keys()].find(k=>k.key===key), v=TL.state.vill[key], S=kind.study, k=S.k, SLOW=TL.WALK_SLOW;
  const F=kind.info.Walk_Loop.count, dur=kind.info.Walk_Loop.dur;
  const res={k,F,dur,tf:S.tf,variants:{}};
  for(const [vn,clip] of [['before',v.walk0],['after',v.walk]]){
    const rig=TL.clone(v.scene); rig.updateMatrixWorld(true);
    const L=rig.getObjectByName('L_Foot'), R=rig.getObjectByName('R_Foot'), mixer=new T.AnimationMixer(rig), act=mixer.clipAction(clip); act.play();
    const p=new T.Vector3(); const S2=TL.study(rig,clip); const oy=-S2.minY*k;
    const sample=(time)=>{ mixer.setTime(time); rig.updateMatrixWorld(true); const r=[]; for(const b of [L,R]){ b.getWorldPosition(p); r.push([r4(p.x*k),r4(p.y*k+oy),r4(p.z*k)]); } return r; };
    const frames=[]; for(let f=0;f<F;f++) frames.push(sample((f/F)*dur*SLOW));
    const tf=S2.tf; res.variants[vn]={frames,tf,idle:sample(tf),minY:S2.minY,height:S2.height};
  }
  out.tracks[key]=res;
}
return out;
