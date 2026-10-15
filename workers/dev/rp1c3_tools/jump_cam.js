(async()=>{
 const api=window.__rp,S=api.S,cam=window.__bw.camera; api.pause(true); S.doorHook=()=>{}; S.cool=99; const out={};
 for (const [lab,mag] of [['stand',0],['walk',0.55],['run',1]]) {
  api.setPos(41,22,-0.73); S.camYaw=S.body=-0.73; S.inp.x=0; S.inp.y=mag; api.sim(1.6,1/60);
  const ys=[],hs=[],cx=[]; let n=0; S.tap=()=>{ ys.push(cam.position.y); hs.push(S.y); cx.push(Math.hypot(cam.position.x-S.x,cam.position.z-S.z)); };
  S.reqJump=true; api.sim(1.3,1/60); S.tap=null;
  let maxD=0, maxA=0; for(let i=1;i<ys.length;i++){ const d=(ys[i]-ys[i-1])*60; if(Math.abs(d)>maxD) maxD=Math.abs(d); if(i>1){ const a=Math.abs((ys[i]-2*ys[i-1]+ys[i-2]))*3600; if(a>maxA) maxA=a; } }
  const y0=ys[0], hy0=hs[0]; out[lab]={ camRise:+(Math.max(...ys)-y0).toFixed(3), heroRise:+(Math.max(...hs)-hy0).toFixed(3), camVmax:+maxD.toFixed(2), camAmax:+maxA.toFixed(1), distMin:+Math.min(...cx).toFixed(2), distMax:+Math.max(...cx).toFixed(2) };
  S.inp.y=0; api.sim(0.5,1/60);
 }
 return JSON.stringify(out);})()
