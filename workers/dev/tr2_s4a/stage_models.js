// stage 1: every S4a model on its lot footprint (3/4 view + top view), sizes in metres (tr2.info) — to look at scale, front and yard room
export async function run(api, { SET }) {
  const { THREE, tr2, R, mkScene, rect, cam, label, c2, cv, RES } = api;
  const FAM = { cottage: [9, 9], craftsman: [9, 10], merchant: [8, 11], noble: [12, 12] };
  const SIZE = { cottage: { w: 6.6 }, craftsman: { w: 7.8 }, merchant: { w: 7.4 }, noble: { w: 10.5 }, generic: { w: 7.5 } };
  const sets = {
    houses: [...['cottage', 'craftsman', 'merchant', 'noble'].flatMap((f) => [0, 1, 2].map((i) => ({ spec: `house_${f}_${i}`, lot: FAM[f], o: SIZE[f] || {} }))), ...['a', 'b', 'c', 'd'].map((c) => ({ spec: 'house_generic_' + c, lot: [8, 8], o: SIZE.generic || {} }))],
    civic: [{ spec: 'civic_hall_0', lot: [28, 22], o: { w: 20 } }, { spec: 'shrine_0', lot: [18, 28], o: { h: 15 } }, { spec: 'tavern_0', lot: [22, 20], o: { w: 12 } }, { spec: 'market_hall', lot: [32, 32], o: { w: 18 } }, { spec: 'well_stone', lot: [6, 6], o: { w: 4.2 } }, { spec: 'well_qanat', lot: [6, 6], o: { w: 4.2 } }, { spec: 'well_abanbar', lot: [6, 6], o: { w: 5 } }],
  };
  const list = (sets[SET] || sets.houses).map((x) => ({ ...x, o: JSON.parse(new URLSearchParams(location.search).get('o_' + x.spec.replace(/_[0-9a-d]$/, '')) || JSON.stringify(x.o)) }));
  await tr2.load(list.map((x) => x.spec));
  const W = 340, H = 280, cols = 6, rows = Math.ceil(list.length * 2 / cols);
  cv.width = W * cols; cv.height = H * rows; c2.fillStyle = '#1b2230'; c2.fillRect(0, 0, cv.width, cv.height);
  R.setSize(W, H);
  list.forEach((it, i) => {
    const sc = mkScene(); rect(sc, it.lot[0], it.lot[1]);
    const ps = tr2.parts(it.spec, it.o); for (const p of ps) sc.add(new THREE.Mesh(p.geometry, p.material));
    const inf = tr2.info(it.spec, it.o); RES.info[it.spec] = { size: inf.size.map((v) => +v.toFixed(2)), tris: Math.round(inf.tris), k: +inf.k.toFixed(3), ry: inf.ry };
    const big = Math.max(it.lot[0], it.lot[1]) * 1.1 + 6, row = Math.floor(i / (cols / 2));
    for (const [j, c] of [[0, cam(W, H, big * 1.35, 24, 28, inf.size[1] / 2.2)], [1, cam(W, H, big * 1.5, 86, 0, 0)]]) {
      R.render(sc, c); const k = (i * 2 + j), x = (k % cols) * W, y = Math.floor(k / cols) * H; c2.drawImage(R.domElement, x, y);
      label(`${it.spec}  ${RES.info[it.spec].size.join('×')} m  ${RES.info[it.spec].tris} tris${j ? '  (top)' : ''}`, x, y, W);
    }
  });
}
