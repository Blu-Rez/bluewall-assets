// cup_lab: a 3D golden chalice rendered to a transparent PNG (the HUD cup icon, 176 px webp) — gold, not bronze
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const Q = new URLSearchParams(location.search), S = +(Q.get('s') || 352);
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(S, S); r.setPixelRatio(1); r.setClearColor(0x000000, 0);
r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = +(Q.get('x') || 1.05);
document.body.style.margin = 0; document.body.style.background = 'transparent'; document.body.appendChild(r.domElement);
const sc = new THREE.Scene(); { const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture; sc.environmentIntensity = +(Q.get('e') || 1.25); }
const key = new THREE.DirectionalLight(0xfff1cf, 2.2); key.position.set(-3, 5, 6); sc.add(key);
const rim = new THREE.DirectionalLight(0xbfe0ff, 1.1); rim.position.set(4, 3, -4); sc.add(rim);
const gold = new THREE.MeshStandardMaterial({ color: new THREE.Color(+('0x' + (Q.get('c') || 'ffcf3f'))), metalness: 1, roughness: +(Q.get('r') || 0.26) });
const gold2 = new THREE.MeshStandardMaterial({ color: 0xffe28a, metalness: 1, roughness: 0.18 });
const cup = new THREE.Group(); sc.add(cup);
const yb = (y) => (y > 1.0 ? 1.0 + (y - 1.0) * 1.24 : y);                                                                                         // a taller bowl
const P = (a) => a.map(([x, y]) => new THREE.Vector2(x, yb(y)));
// base + stem + knop + bowl, one lathe profile (x = radius, y = height); the bowl is a shell so the inside shows gold too
const prof = P([[0, 0], [0.66, 0], [0.7, 0.05], [0.68, 0.11], [0.5, 0.15], [0.36, 0.2], [0.22, 0.3], [0.14, 0.42], [0.13, 0.56], [0.22, 0.62], [0.28, 0.7], [0.22, 0.78], [0.14, 0.86], [0.13, 0.98], [0.26, 1.06], [0.52, 1.16], [0.74, 1.32], [0.84, 1.52], [0.86, 1.72], [0.84, 1.9], [0.8, 1.96], [0.77, 1.94], [0.78, 1.74], [0.76, 1.54], [0.66, 1.4], [0.44, 1.3], [0, 1.27]]);
cup.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 56), gold));
{ const m = new THREE.Mesh(new THREE.TorusGeometry(0.805, 0.035, 10, 56), gold2); m.rotation.x = Math.PI / 2; m.position.y = yb(1.955); cup.add(m); }      // lip ring
{ const m = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.04, 10, 40), gold2); m.rotation.x = Math.PI / 2; m.position.y = 0.7; cup.add(m); }           // knop ring
{ const m = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.03, 10, 56), gold2); m.rotation.x = Math.PI / 2; m.position.y = 0.12; cup.add(m); }          // base ring
for (const e of [-1, 1]) {                                                                                                                      // two ear handles
  const c = new THREE.CatmullRomCurve3([[0.82, 1.82], [1.12, 1.9], [1.32, 1.62], [1.2, 1.28], [0.96, 1.14], [0.62, 1.22]].map(([x, y]) => new THREE.Vector3(e * x, yb(y) - 0.06, 0)));
  cup.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.07, 10), gold));
}
// the jewel on the bowl: a turquoise cut stone in a gold collar
{ const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshPhysicalMaterial({ color: 0x12a8f2, metalness: 0.15, roughness: 0.1, clearcoat: 1, emissive: 0x053a66, emissiveIntensity: 0.5 }));
  gem.scale.set(1, 1.28, 0.8); gem.position.set(0, 1.62, 0.84); gem.rotation.x = -0.18; cup.add(gem);
  const col = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 10, 30), gold2); col.position.set(0, 1.62, 0.82); col.rotation.x = -0.18; cup.add(col);
  for (const e of [-1, 1]) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), gold2); d.position.set(e * 0.33, 1.62, 0.78); cup.add(d); }
}
cup.rotation.y = +(Q.get('ry') || 0.35); cup.position.y = -1.0;
const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 50); cam.position.set(0, 1.6, 8.6); cam.lookAt(0, 0.28, 0);
r.render(sc, cam);
// two little four-point sparkles (like the other HUD icons)
window.__ready = true;
