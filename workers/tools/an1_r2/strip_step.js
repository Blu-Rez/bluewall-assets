// strip_step.js — P={dt, last?}: advance the world dt seconds with the camera following the subject from its right side, render
const B=__bw, W=B.world, cam=B.camera, R=B.renderer, sc=B.scene, S=window.__st; if(!S) return {err:'no strip'};
const n=Math.max(1,Math.round(P.dt/0.0333)); let t=S.t;
const place=()=>{ const s=S.c.get(), rx=Math.cos(s.yaw)*S.side, rz=-Math.sin(s.yaw)*S.side; cam.fov=S.fov; cam.updateProjectionMatrix(); cam.position.set(s.x+rx*S.D,s.y+S.D*0.16+1.0,s.z+rz*S.D); cam.lookAt(s.x,s.y+S.D*0.075+0.4,s.z); cam.updateMatrixWorld(true); return s; };
place();
for(let i=0;i<n;i++){ t+=0.0333; W.update(t,0.0333,cam); place(); }
S.t=t; const s=place(); R.render(sc,cam);
return {gait:String(S.c.gait()),x:+s.x.toFixed(2),z:+s.z.toFixed(2),y:+s.y.toFixed(2)};
