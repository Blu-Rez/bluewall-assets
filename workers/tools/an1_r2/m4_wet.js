const W=__bw.world; const out={n:0,wet:0,byLabel:{}};
for(const [x,z,y,lab] of P.pts){ const h=W.fastHeight(x,z); out.n++; const k=out.byLabel[lab]||(out.byLabel[lab]={n:0,wet:0}); k.n++; if(h<-0.75&&y<h+0.25){ out.wet++; k.wet++; } }
return out;
