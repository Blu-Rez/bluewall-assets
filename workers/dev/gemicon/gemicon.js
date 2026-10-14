import * as THREE from 'three';
import { gemGeometry, gemMaterials, GEM_LOOK } from '/home/claude/bot/bluebot_v2/bluewall/client/src/gemgeo.js';

function envScene() {
  const sc = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(vec3(0.02,0.04,0.09), vec3(0.35,0.5,0.8), smoothstep(-0.3,0.9,h)); gl_FragColor = vec4(c,1.0); }',
  }));
  sc.add(sky);
  const panel = (w, h, x, y, z, col, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide, toneMapped: false })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
  panel(18, 10, -22, 20, 14, 0xffffff, 9);      // key softbox
  panel(10, 20, 26, 6, 10, 0xfff0d8, 6);        // warm strip right
  panel(30, 6, 0, 28, -18, 0xdbe9ff, 5);        // top back
  panel(14, 14, 0, -26, 12, 0x8ec5ff, 3);       // bounce from below
  panel(6, 24, -30, 0, -10, 0xffffff, 4);       // rim left
  panel(8, 8, 18, 22, -20, 0xffffff, 8);        // hot spot
  return sc;
}

export function render(kinds, size = 512) {
  const out = {};
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(size, size, false); r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(r), env = pm.fromScene(envScene(), 0.0, 0.1, 100, { size: 256 }).texture;
  for (const kind of kinds) {
    const sc = new THREE.Scene(); sc.environment = env;
    const geo = gemGeometry(kind), { front } = gemMaterials(kind, kind === 'onyx' ? { envMapIntensity: 0.62, glow: 0.0 } : { envMapIntensity: 1.6, glow: 0.18 });
    const g = new THREE.Group(); sc.add(g);
    const mb = { geometry: geo }; const mf = new THREE.Mesh(geo, front); g.add(mf);
    g.rotation.set(0.0, kind === 'emerald' ? 0.42 : 0.3, 0);
    const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 50); cam.position.set(0, 1.9, 5.4); cam.lookAt(0, -0.2, 0); cam.fov = 26; cam.updateProjectionMatrix();
    const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(-3, 5, 4); sc.add(dl);
    r.render(sc, cam);
    // 2D composite: glow behind, gem, sparkle
    const c2 = document.createElement('canvas'); c2.width = c2.height = size; const x = c2.getContext('2d');
    const L = GEM_LOOK[kind], col = '#' + new THREE.Color(L.glow).getHexString();
    const gr = x.createRadialGradient(size / 2, size * 0.52, size * 0.06, size / 2, size * 0.52, size * 0.5);
    gr.addColorStop(0, col + '88'); gr.addColorStop(0.5, col + '30'); gr.addColorStop(1, col + '00');
    x.fillStyle = gr; x.fillRect(0, 0, size, size);
    x.drawImage(r.domElement, 0, 0, size, size);
    const sp = (cx, cy, s, a) => { x.save(); x.globalCompositeOperation = 'lighter'; x.translate(cx, cy);
      const g2 = x.createRadialGradient(0, 0, 0, 0, 0, s); g2.addColorStop(0, `rgba(255,255,255,${a})`); g2.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g2; x.fillRect(-s, -s, 2 * s, 2 * s);
      x.fillStyle = `rgba(255,255,255,${a})`; for (const [w, h] of [[s * 1.5, 3], [3, s * 1.5]]) { x.beginPath(); x.ellipse(0, 0, w, h, 0, 0, 7); x.fill(); } x.restore(); };
    sp(size * 0.36, size * 0.3, size * 0.075, 0.8); sp(size * 0.68, size * 0.6, size * 0.04, 0.55);
    out[kind] = c2.toDataURL('image/png');
    mb.geometry === geo; sc.clear();
  }
  return out;
}
window.__render = render;
