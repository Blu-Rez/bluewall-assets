const R=__bw.renderer, S=__bw.battle.session, K=S.views.kinds, i=R.info.render, nf=__bw.frames-window.__f0, r1={nf,calls:i.calls,tris:i.triangles};
window.__r1=r1; window.__hid=['pegasus','dragon','baby','dragon3','baby3','gryphon','gryphonknight','darkrider'].filter(k=>K[k]); for(const k of window.__hid) K[k].group.visible=false;
R.info.reset(); window.__f0=__bw.frames; return r1;
