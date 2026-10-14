const S=__bw.battle.session, K=S.views.kinds, out={};
const vis=(o)=>{ for(let p=o;p;p=p.parent) if(p.visible===false) return false; return true; };
for(const k of ['pegasus','dragon','baby','dragon3','baby3','gryphon','gryphonknight','darkrider']){
  const kk=K[k]; if(!kk){ out[k]='nokind'; continue; }
  let root=kk.group; const i0=kk.instances&&kk.instances[0]; if(i0&&i0.c&&i0.c.root) root=i0.c.root;
  let n=0,tris=0,sk=0,skt=0,inv=0,invt=0; const parts=[];
  root.traverse(o=>{ if(!o.isMesh) return; const g=o.geometry, t=Math.round((g.index?g.index.count:g.attributes.position.count)/3); if(vis(o)&&o.material&&o.material.visible!==false){ n++; tris+=t; if(o.isSkinnedMesh){ sk++; skt+=t; } parts.push(t); } else { inv++; invt+=t; } });
  out[k]={drawnMeshes:n, drawnTris:tris, skinned:sk, skinnedTris:skt, hiddenMeshes:inv, hiddenTris:invt, parts:parts.sort((a,b)=>b-a).slice(0,9).join(',')};
}
return out;
