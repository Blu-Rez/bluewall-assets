const S=__bw.battle.session, K=S.views.kinds, out={}, R=__bw.renderer;
const info=(root)=>{ const a=[]; root.traverse(o=>{ if(!o.isMesh) return; const g=o.geometry; a.push({n:(o.name||o.type).slice(0,14), sk:!!o.isSkinnedMesh, inst:o.isInstancedMesh?o.count:0, tris:Math.round((g.index?g.index.count:g.attributes.position.count)/3), verts:g.attributes.position.count, bones:o.skeleton?o.skeleton.bones.length:0, sh:!!o.castShadow}); }); return a; };
for(const k of ['pegasus','dragon','baby','dragon3','baby3','gryphon','gryphonknight','darkrider']){
  const kk=K[k]; if(!kk){ out[k]='nokind'; continue; }
  let root=kk.group; const i0=kk.instances&&kk.instances[0]; if(i0&&i0.c&&i0.c.root) root=i0.c.root;
  const m=info(root);
  out[k]={meshes:m.length, tris:m.reduce((s,x)=>s+x.tris,0), skinned:m.filter(x=>x.sk).length, instanced:m.filter(x=>x.inst>=0&&x.n!=='Object3D').length, bones:Math.max(0,...m.map(x=>x.bones)), shadow:m.filter(x=>x.sh).length, detail:m.slice(0,14).map(x=>x.n+':'+x.tris+(x.inst?'x'+x.inst:'')).join(' ')};
}
return out;
