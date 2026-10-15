// shot: __SHOT__
// AN1_R3 in-game verification frame (dev only): a 2 m red/white ruler pole stands on the ground next to the animals, the camera looks along the ground, the game runs a few frames, then pauses again.
const B = __bw, THREE = B.THREE, c = B.ctl, A = __ARGS__;
const h = B.world.fastHeight;
if (window.__an1ruler) { B.scene.remove(window.__an1ruler); window.__an1ruler = null; }
const pole = new THREE.Group(); const cols = [0xd02020, 0xffffff, 0xd02020, 0xffffff];
for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), new THREE.MeshBasicMaterial({ color: cols[i] })); m.position.y = 0.25 + i * 0.5; pole.add(m); }
pole.position.set(A.pole[0], h(A.pole[0], A.pole[1]), A.pole[1]); B.scene.add(pole);
if (c._skipIntro) c._skipIntro();
c.target.set(A.t[0], h(A.t[0], A.t[1]) + A.ty, A.t[1]); c.dist = A.d; if (A.az != null) c.azim = A.az; if (A.pol != null) c.polar = A.pol;
B.pause(false); await new Promise((r) => setTimeout(r, A.wait || 6000));          // the screenshot is taken by the page runner right after this returns (the page must be running to produce a frame); the ruler stays until the next call
window.__an1ruler = pole;
return { cam: B.camera.position.toArray().map((v) => +v.toFixed(1)), dist: c.dist, azim: c.azim, polar: c.polar };
