import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gemGeometry, gemMaterial } from '/home/claude/bot/bluebot_v2/bluewall/client/src/gemgeo.js';
const Q = new URLSearchParams(location.search), KIND = Q.get('k') || 'turq';
const COLS = 5, ROWS = 4, CW = 260, CH = 260;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(COLS * CW, ROWS * CH); r.setPixelRatio(1);
r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.setScissorTest(true); document.body.appendChild(r.domElement);
const pm = new THREE.PMREMGenerator(r);
function skyEnv() {   // like the game's: bright bluish sky, pale horizon, dark ground
  const s = new THREE.Scene(); const g = new THREE.SphereGeometry(50, 32, 16);
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying vec3 p;void main(){float h=normalize(p).y;vec3 top=vec3(.18,.42,.85)*1.6,hor=vec3(.85,.92,1.)*2.2,gr=vec3(.05,.07,.04);vec3 c=h>0.?mix(hor,top,pow(h,.6)):mix(hor,gr,smoothstep(0.,-.25,h));gl_FragColor=vec4(c,1.);}' });
  s.add(new THREE.Mesh(g, m)); return pm.fromScene(s, 0.02, 0.1, 100, { size: 128 }).texture;
}
function jewelEnv(k = 1) {   // dark blue room, a few crisp light panels: facets show either deep blue or a sharp glint, from every side
  const s = new THREE.Scene(); const room = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0b1d46).multiplyScalar(0.9), side: THREE.BackSide })); s.add(room);
  const panel = (w, h, pos, col, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(i * k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); };
  panel(34, 22, [-22, 36, 18], 0xffffff, 5.0); panel(8, 44, [42, 12, 8], 0xbfe9ff, 4.0); panel(8, 44, [-40, 6, -20], 0xa8d4ff, 3.0); panel(30, 8, [0, 10, -44], 0xdfeeff, 3.0); panel(40, 40, [0, -40, 0], 0x1f4fb0, 1.1); panel(10, 10, [20, 30, -28], 0xffffff, 6.0);
  return pm.fromScene(s, 0.01, 0.1, 100, { size: 128 }).texture;
}
const ENVS = [['sky', skyEnv(), 1.7], ['room', pm.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: 128 }).texture, 1.7], ['jewel1.0', jewelEnv(1), 1.0], ['jewel1.6', jewelEnv(1), 1.6]];
const scene = new THREE.Scene(); const sun = new THREE.DirectionalLight(0xfff2dd, 2.2); sun.position.set(-30, 60, 40); scene.add(sun, new THREE.HemisphereLight(0x6f8fd0, 0x2a3222, 1.3));
const mat = gemMaterial(KIND, { envMapIntensity: 1.7, glow: 0.3 }); const gem = new THREE.Mesh(gemGeometry(KIND), mat); gem.scale.setScalar(5.6); gem.position.y = 5.4; scene.add(gem);
const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshStandardMaterial({ color: 0x4a5a30, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 300);
const elev = [58, 40, 22, 62], angs = [0, 72, 144, 216, 288];
ENVS.forEach(([name, env, ints], row) => {
  mat.envMap = env; mat.envMapIntensity = ints; mat.needsUpdate = true;
  angs.forEach((a, col) => {
    const el = elev[row === 3 ? (col % 3) : (col % 3)] * Math.PI / 180, az = a * Math.PI / 180, d = 50;
    cam.position.set(Math.cos(az) * Math.cos(el) * d, 5 + Math.sin(el) * d, Math.sin(az) * Math.cos(el) * d); cam.lookAt(0, 6, 0);
    r.setViewport(col * CW, (ROWS - 1 - row) * CH, CW, CH); r.setScissor(col * CW, (ROWS - 1 - row) * CH, CW, CH); r.setClearColor(0x6d8a52); r.render(scene, cam);
  });
});
window.__done = true;
