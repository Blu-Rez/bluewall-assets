// AN1_R3 in-game verification frame (dev only): the REAL game scene (all the game's meshes, lights, shadows; no post effects) seen from a low camera beside the animals / people, a 2 m red-white ruler pole standing on the ground.
// Renders into a render target (the page does not have to produce compositor frames: the software-GL page is paused).  ARGS = { cam: [x, z, eyeAboveGround], look: [x, z, y above ground], pole: [x, z] | null, steps: 150, label: '' }
const B = __bw, THREE = B.THREE, r = B.renderer, h = B.world.fastHeight, A = ARGS, cam = B.camera, W = 844, H = 390;
const poles = []; const cols = [0xd02020, 0xffffff, 0xd02020, 0xffffff];
for (const pp of (A.poles || (A.pole ? [A.pole] : []))) { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshBasicMaterial({ color: cols[i] })); m.position.y = 0.25 + i * 0.5; g.add(m); } g.position.set(pp[0], h(pp[0], pp[1]), pp[1]); B.scene.add(g); poles.push(g); }
cam.position.set(A.cam[0], h(A.cam[0], A.cam[1]) + A.cam[2], A.cam[1]); cam.lookAt(A.look[0], h(A.look[0], A.look[1]) + A.look[2], A.look[1]); cam.updateMatrixWorld(true);
let t = B.t || 0; for (let i = 0; i < (A.steps || 150); i++) { t += 1 / 30; B.world.update(t, 1 / 30, cam); }
cam.updateMatrixWorld(true);
const rt = new THREE.WebGLRenderTarget(W, H, { samples: 0 }); const old = r.getRenderTarget(); r.setRenderTarget(rt); r.render(B.scene, cam);
const buf = new Uint8Array(W * H * 4); r.readRenderTargetPixels(rt, 0, 0, W, H, buf); r.setRenderTarget(old); rt.dispose();
for (const g of poles) B.scene.remove(g);
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c2 = cv.getContext('2d'), im = c2.createImageData(W, H), lut = new Uint8Array(256).map((_, i) => Math.round(255 * Math.pow(i / 255, 1 / 2.2)));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = ((H - 1 - y) * W + x) * 4, b = (y * W + x) * 4; im.data[b] = lut[buf[a]]; im.data[b + 1] = lut[buf[a + 1]]; im.data[b + 2] = lut[buf[a + 2]]; im.data[b + 3] = 255; }
c2.putImageData(im, 0, 0); c2.fillStyle = 'rgba(255,255,255,0.8)'; c2.fillRect(0, H - 18, W, 18); c2.fillStyle = '#000'; c2.font = '11px sans-serif'; c2.fillText((A.label || '') + '  (game scene, software GL, no post effects; ruler: red / white = 0.5 m)', 6, H - 6);
return { png: cv.toDataURL('image/png'), cam: cam.position.toArray().map((v) => +v.toFixed(1)) };
