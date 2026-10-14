// Ability emblems rendered from the game's own 3D assets (shield_heater.glb, spear.glb, banner.glb) into transparent 256 px stills -> window.__out = { shield: dataURL, rally: dataURL }
// The wood is repainted deep navy and the cloth royal blue (palette: deep/light blue, navy, steel; red only for danger).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const [sh, sp, bn] = await Promise.all(['shield_heater', 'spear', 'banner'].map((n) => ld.loadAsync('/assets/' + n + '.glb')));
  const Q = new URLSearchParams(location.search), SZ = +(Q.get('s') || 256);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(SZ, SZ);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0x000000, 0);
  document.body.style.cssText = 'margin:0;background:#222';
  document.body.appendChild(renderer.domElement);
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const mk = (build, fit) => {
    const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 1.0;
    scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x1a2540, 0.9));
    const key = new THREE.DirectionalLight(0xfff4e0, 2.0); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6fb4ff, 1.8); rim.position.set(5, 2, -4); scene.add(rim);
    const root = new THREE.Group(); scene.add(root); build(root);
    const b = new THREE.Box3().setFromObject(root), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    root.position.sub(c);
    const cam = new THREE.PerspectiveCamera(20, 1, 0.1, 500); const m = Math.max(s.x, s.y) * (fit || 1.12);
    cam.position.set(0, 0, m / (2 * Math.tan(THREE.MathUtils.degToRad(10)))); cam.lookAt(0, 0, 0);
    renderer.render(scene, cam); return renderer.domElement.toDataURL('image/png');
  };
  const paint = (o, cfg) => o.traverse((x) => {
    if (!x.isMesh) return;
    const ms = Array.isArray(x.material) ? x.material : [x.material];
    const out = ms.map((m) => {
      const n = (m.name || '').toLowerCase(); const q = m.clone();
      if (n.includes('wood')) { q.color.set(n.includes('dark') ? 0x0a1f4a : 0x143a82); q.roughness = 0.4; q.metalness = 0.2; }
      else if (n.includes('steel')) { q.color.set(n.includes('light') ? 0xdbe6f5 : 0xa9bdd9); q.metalness = 0.7; q.roughness = 0.34; }
      return q;
    });
    x.material = Array.isArray(x.material) ? out : out[0];
  });
  const out = {};
  // 1. shield wall: the heater shield, the planks repainted navy, the bands bright steel
  out.shield = mk((r) => { const o = sh.scene.clone(true); paint(o); o.rotation.set(0.08, -0.42, 0.04); r.add(o); }, 1.16);
  // 2. rally charge: a lance (lathe-built here: navy shaft, steel head) with the banner's own cloth streaming from it as a royal-blue pennant
  out.rally = mk((r) => {
    const L = 10, steel = new THREE.MeshStandardMaterial({ color: 0xc4d4ec, metalness: 0.75, roughness: 0.3 }), lacq = new THREE.MeshStandardMaterial({ color: 0xaebfd9, metalness: 0.7, roughness: 0.32 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, L, 16), lacq); r.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.72, 2.3, 4), steel); tip.position.y = L / 2 + 1.15; tip.rotation.y = Math.PI / 4; r.add(tip);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16), steel); collar.position.y = L / 2 + 0.05; r.add(collar);
    const butt = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 12), steel); butt.rotation.x = Math.PI; butt.position.y = -L / 2 - 0.4; r.add(butt);
    const top = L / 2;
    let cloth = null; bn.scene.traverse((x) => { if (x.isMesh && /banner/i.test((x.material && x.material.name) || '')) cloth = x; });
    if (!cloth) throw new Error('no cloth');
    const ng = cloth.geometry.clone(); ng.computeBoundingBox();
    const m = cloth.material.clone(); m.map = null; m.vertexColors = false; m.color.set(0x1a4fc0); m.roughness = 0.6; m.metalness = 0; m.side = THREE.DoubleSide;
    const flag = new THREE.Mesh(ng, m); const cb = ng.boundingBox, cs = cb.getSize(new THREE.Vector3()), cc = cb.getCenter(new THREE.Vector3());
    const k = (L * (+Q.get('hk') || 0.4)) / cs.x;
    const holder = new THREE.Group(); holder.add(flag); flag.position.set(-cc.x, -cb.max.y, -cc.z); holder.rotation.z = Math.PI / 2; holder.scale.setScalar(k);
    const wrap = new THREE.Group(); wrap.add(holder); wrap.position.set(0.28, top - 0.6, 0); r.add(wrap);
    r.rotation.z = -0.42; r.rotation.y = -0.2;
  }, 1.3);
  window.__out = out; window.__ready = true; window.__frames = 3;
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;background:#3a557f;padding:10px';
  for (const k in out) { const im = new Image(); im.src = out[k]; row.appendChild(im); }
  document.body.appendChild(row);
})().catch((e) => { window.__err = String(e.stack || e); console.error(e); });
