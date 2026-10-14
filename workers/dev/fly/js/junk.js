const S=__bw.battle.session, kk=S.views.kinds.dragon, root=kk.instances[0].c.root, a=[];
root.traverse(o=>{ if(o.isMesh&&!o.isSkinnedMesh){ const m=o.material; a.push([o.name, m.name, m.visible, m.opacity, m.transparent, m.colorWrite, m.depthWrite, o.visible, o.layers.mask, o.castShadow].join('|')); } });
return a.slice(0,5).concat([a.length]);
