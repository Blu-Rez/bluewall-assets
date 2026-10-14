const R=__bw.renderer, S=__bw.battle.session, K=S.views.kinds, i=R.info.render, nf=__bw.frames-window.__f0, r2={nf,calls:i.calls,tris:i.triangles};
for(const k of window.__hid) K[k].group.visible=true; R.info.autoReset=true; R.info.reset();
return {with:window.__r1, without:r2, perFrameDelta:{calls:window.__r1.calls/window.__r1.nf-r2.calls/r2.nf, tris:window.__r1.tris/window.__r1.nf-r2.tris/r2.nf}};
