const W=__bw.world; const out={n:0,shallow:0,deep:0,byLabel:{}};
for(const [x,z,y,lab] of P.pts){ const h=W.fastHeight(x,z); out.n++; const k=out.byLabel[lab]||(out.byLabel[lab]={n:0,shallow:0,deep:0}); k.n++; if(h<-0.75&&y<h+0.25){ if(h<-1.05){ out.deep++; k.deep++; } else { out.shallow++; k.shallow++; } } }
return out;
