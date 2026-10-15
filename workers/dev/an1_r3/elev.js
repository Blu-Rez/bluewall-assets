// AN1_R3 A3 — body of an async function (an1_r3_page.py RPC): front elevations (orthographic, +Z side) of game models at their game scale, with a metre ruler, a 1.75 m man and the 1.96 m hero for comparison.
// ARGS.items = [{ id, url, w|h|s, ry (deg, from swap.json), note }] -> { id: dataURL(png) , dims }.  Pure measuring aid (dev only).
const R = window.__R3, THREE = R.THREE, B = __bw, r = B.renderer;
const out = {};
const swap = await (await fetch('assets/tr2/swap.json')).json();
const P = ARGS.px || [480, 340];
for (const it of ARGS.items) {
  try {
    const g = await R.load(it.url); let root = g.scene.clone(true);
    if (it.node) { const n = root.getObjectByName(it.node); if (!n) throw new Error('no node ' + it.node); root = n.clone(true); root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); root.scale.set(1, 1, 1); if (it.k) root.scale.setScalar(it.k); }
    const ry = (it.ry != null ? it.ry : ((swap.models && swap.models[it.key] && swap.models[it.key].ry) || 0)) * Math.PI / 180;
    const holder = new THREE.Group(); holder.add(root); holder.rotation.y = ry; holder.updateMatrixWorld(true);
    let bb = new THREE.Box3().setFromObject(holder, true), sz = bb.getSize(new THREE.Vector3());
    const s = it.s || (it.w ? it.w / Math.max(sz.x, sz.z) : it.h ? it.h / sz.y : it.len ? it.len / sz.x : 1);
    holder.scale.setScalar(s); holder.updateMatrixWorld(true); bb = new THREE.Box3().setFromObject(holder, true); sz = bb.getSize(new THREE.Vector3());
    holder.position.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); holder.updateMatrixWorld(true);
    const sc = new THREE.Scene(); sc.add(holder); sc.add(new THREE.AmbientLight(0xffffff, 1.6)); const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(1, 2, 3); sc.add(dl);
    sc.background = new THREE.Color(0xd9e2ea);
    const hw = Math.max(sz.x / 2 + 1.6, 3), Hh = Math.max(sz.y + 0.6, 3);
    const ppm = Math.min(P[0] / (2 * hw), P[1] / Hh), W = P[0], H = P[1];
    const cam = new THREE.OrthographicCamera(-W / 2 / ppm, W / 2 / ppm, (H - 20) / ppm - 0.0, -20 / ppm, 0.1, 400);
    cam.position.set(0, 0, 100); cam.lookAt(0, 0, 0);
    const rt = new THREE.WebGLRenderTarget(W, H, { samples: 0 }); const old = r.getRenderTarget();
    r.setRenderTarget(rt); r.render(sc, cam); const buf = new Uint8Array(W * H * 4); r.readRenderTargetPixels(rt, 0, 0, W, H, buf); r.setRenderTarget(old); rt.dispose();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c2 = cv.getContext('2d'), im = c2.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = ((H - 1 - y) * W + x) * 4, b = (y * W + x) * 4; im.data[b] = buf[a]; im.data[b + 1] = buf[a + 1]; im.data[b + 2] = buf[a + 2]; im.data[b + 3] = 255; }
    c2.putImageData(im, 0, 0);
    // ruler: horizontal line every 0.5 m (labels every 1 m) from the ground; ground y px = H-20
    const gy = H - 20; c2.font = '11px sans-serif'; c2.textBaseline = 'middle';
    for (let m = 0; m * 0.5 * ppm < gy; m++) { const y = gy - m * 0.5 * ppm, whole = m % 2 === 0; c2.strokeStyle = whole ? 'rgba(200,0,0,0.65)' : 'rgba(200,0,0,0.28)'; c2.lineWidth = whole ? 1 : 0.7; c2.beginPath(); c2.moveTo(0, y); c2.lineTo(W, y); c2.stroke(); if (whole) { c2.fillStyle = '#a00'; c2.fillText((m / 2) + ' m', 3, y - 6); c2.fillText((m / 2) + ' m', W - 34, y - 6); } }
    // a 1.75 m man (flat bar) and the 1.96 m hero at the right side of the panel
    const bar = (x, h, col, lab) => { c2.fillStyle = col; c2.fillRect(x, gy - h * ppm, 0.45 * ppm, h * ppm); c2.fillStyle = '#000'; c2.fillText(lab, x - 4, gy - h * ppm - 7); };
    bar(W - 70, 1.75, 'rgba(40,90,40,0.85)', 'man 1.75'); bar(W - 36, 1.96, 'rgba(120,40,120,0.85)', 'hero 1.96');
    c2.fillStyle = '#000'; c2.font = 'bold 12px sans-serif'; c2.fillText((it.id) + '  ' + sz.x.toFixed(1) + ' x ' + sz.y.toFixed(1) + ' x ' + sz.z.toFixed(1) + ' m  (s=' + s.toFixed(3) + ', ' + ppm.toFixed(0) + ' px/m)', 90, 11);
    out[it.id] = { png: cv.toDataURL('image/png'), size: sz.toArray().map((v) => +v.toFixed(2)), s: +s.toFixed(4), ppm: +ppm.toFixed(1) };
  } catch (e) { out[it.id] = { err: String(e).slice(0, 200) }; }
}
return out;
