(() => { const bw = __bw, R = bw.world.rings, st = R.state();
  const ringOf = new Map(); for (const id of ['inner', 'outer', 'town']) for (const t of R.rings[id].tids) ringOf.set(t, id);
  const shown = { inner: 0, outer: 0, town: 0 }, gone = { inner: 0, outer: 0, town: 0 }, total = { inner: 0, outer: 0, town: 0 }, meshes = [];
  bw.scene.traverse((o) => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.aB || !/^(static|troof|props|her-)/.test(o.name || '')) return;
    const g = o.geometry, ab = g.attributes.aB.array, cloth = o.name === 'her-cloth', at = cloth ? g.attributes.aPin : g.attributes.position; if (!at || at.isInterleavedBufferAttribute) return;
    const S = at.itemSize, a = at.array; let n = 0;
    for (let i = 0; i < ab.length; i++) { const id = ringOf.get(ab[i]); if (!id) continue; n++; total[id]++; const dead = cloth ? a[i * S + 1] <= -3999 : (a[i * S] === 0 && a[i * S + 1] === 0 && a[i * S + 2] === 0); if (dead) gone[id]++; else shown[id]++; }
    if (n) meshes.push(o.name + ':' + n); });
  return { level: st.level, active: st.active, shown, collapsed: gone, total, meshes: meshes.slice(0, 24) }; })()
