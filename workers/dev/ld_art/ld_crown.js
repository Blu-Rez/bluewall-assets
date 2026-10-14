// Blue Wall loader — OFFLINE render of the royal crown: polished silver/steel, sapphires, aquamarines, ice diamonds, pearls,
// four pearled arches over a navy velvet cap, fleurs-de-lis and pointed fleurons, a monde crowned by a faceted ice diamond.
// Transparent background; PBR metal lit by a studio environment (PMREM); gems use a custom faceted refraction shader on a cube env.
// URL: ?w=600&h=560&ss=2&el=12
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const Q = new URLSearchParams(location.search);
const OW = +(Q.get('w') || 600), OH = +(Q.get('h') || 560), SS = +(Q.get('ss') || 2), W = OW * SS, H = OH * SS;
const EL = +(Q.get('el') || 12) * Math.PI / 180;
const NO = 8;                        // ornaments around the band (fleur-de-lis on 0/90/180/270°, pointed fleurons between)
const RB = 1.0;                      // band radius
const BT = 0.455;                    // band top

// ------------------------------------------------------------------ studio environment: graded dome (bright top, dark floor), soft boxes, strips, cool rim, warm kicker
function studio() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x0b111c);
  { const g = new THREE.SphereGeometry(30, 64, 32); const p = g.attributes.position, c = [];
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 30; const k = y > 0 ? 0.3 + 1.6 * Math.pow(y, 1.6) : 0.3 * Math.pow(1 + y, 1.6) + 0.06;
      const col = new THREE.Color(0xc9dcf5).multiplyScalar(k); c.push(col.r, col.g, col.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }))); }
  const panel = (w, h, col, k, pos, look = [0, 0.6, 0]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(...look); s.add(m); };
  panel(10, 6, 0xffffff, 4.0, [0, 12, 2]);                    // overhead soft box
  panel(1.2, 10, 0xeaf3ff, 7, [-9, 3, 3]);                    // strip left
  panel(1.2, 10, 0xeaf3ff, 5, [9, 3, 1]);                     // strip right
  panel(5, 5, 0xffffff, 3.2, [-5, 4, 9]);                     // key front-left
  panel(4, 3, 0xe6f0ff, 1.6, [5, 1, 9]);                      // fill front-right
  panel(12, 3, 0x5aa6ff, 5, [0, 4, -10]);                     // cool rim behind
  panel(3, 1.8, 0xffb860, 2.6, [7, -0.5, 6]);                 // warm torch-gold kicker
  panel(3.5, 0.35, 0xffffff, 16, [2, 6, 8]);                  // thin hot strip (crisp specular line)
  panel(0.5, 0.5, 0xffffff, 40, [-3, 7, 7]);                  // point-like hot spots for gem fire
  panel(0.4, 0.4, 0xdff0ff, 40, [4, 5, 7]);
  return s;
}

// ------------------------------------------------------------------ gem shader (faceted, fake refraction + internal bounce + dispersion)
function gemMat(env, tint, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { env: { value: env }, tint: { value: new THREE.Color(tint) }, ior: { value: o.ior ?? 1.77 }, bright: { value: o.bright ?? 1.6 }, spark: { value: o.spark ?? 1.0 }, deep: { value: new THREE.Color(o.deep ?? tint).multiplyScalar(o.deepK ?? 0.12) } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform samplerCube env; uniform vec3 tint, deep; uniform float ior, bright, spark; varying vec3 vW;
      vec3 h33(vec3 p){ p = fract(p * vec3(.1031,.1030,.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
      void main(){
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
        vec3 v = normalize(vW - cameraPosition); if (dot(n, v) > 0.) n = -n;
        float cosi = max(dot(-v, n), 0.);
        float fr = 0.06 + 0.94 * pow(1. - cosi, 5.);
        vec3 refl = textureCube(env, reflect(v, n)).rgb;
        vec3 jit = h33(floor(n * 23.0 + 7.0)) - 0.5;
        vec3 col = vec3(0.);
        for (int c = 0; c < 3; c++) {
          float e = ior + (float(c) - 1.) * 0.04;
          vec3 t = refract(v, n, 1. / e);
          vec3 b1 = reflect(t, normalize(-n + jit * 1.4));
          vec3 b2 = reflect(b1, normalize(n + jit.zxy * 1.2));
          col[c] = textureCube(env, b2)[c];
        }
        float facet = 0.55 + 0.9 * h33(floor(n * 31.0 + 3.0)).x;    // facet-to-facet brightness variation
        vec3 body = col * tint * bright * facet + deep;
        vec3 o = mix(body, refl, fr) + refl * 0.1;
        o += spark * pow(max(dot(reflect(v, n), normalize(vec3(-0.35, 0.75, 0.55))), 0.), 220.) * 9.;
        o += spark * pow(max(dot(reflect(v, n), normalize(vec3(0.45, 0.55, 0.7))), 0.), 260.) * 6.;
        gl_FragColor = vec4(o, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
// faceted gem (lathe with few segments → facets). shape: 'round' | 'oval' | 'pear'. Table faces +z.
function gemGeo(r, shape = 'round', seg = 12) {
  const pts = [new THREE.Vector2(0.0001, -0.62 * r), new THREE.Vector2(0.55 * r, -0.28 * r), new THREE.Vector2(r, -0.02 * r), new THREE.Vector2(r, 0.03 * r), new THREE.Vector2(0.78 * r, 0.2 * r), new THREE.Vector2(0.52 * r, 0.3 * r), new THREE.Vector2(0.0001, 0.3 * r)];
  let g = new THREE.LatheGeometry(pts, seg); g = g.toNonIndexed();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), z = p.getZ(i);
    if (shape === 'oval') z *= 0.74;
    if (shape === 'pear') { const t = z / r; x *= 0.66 * (1 - 0.42 * Math.max(0, t)); z = z * 1.15 + (t > 0 ? t * t * 0.35 * r : 0); }
    p.setXYZ(i, x, p.getY(i), z); }
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------ bending helper: flat piece (x along the band, y up, z outward) → band cylinder
function bend(geo, theta0, R) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = theta0 + x / R, rr = R + z; p.setXYZ(i, Math.sin(a) * rr, y, Math.cos(a) * rr); }
  geo.computeVertexNormals(); return geo;
}
const place = (geo, theta, R, y, out = 0) => { const g = geo.clone(); g.rotateY(theta); g.translate(Math.sin(theta) * (R + out), y, Math.cos(theta) * (R + out)); return g; };

// engraving bump (scrolls & beads) for the band
function engraveTex() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, 2048, 256);
  const per = 2048 / (NO * 2);
  x.strokeStyle = '#c8c8c8'; x.lineWidth = 4; x.lineCap = 'round';
  for (let k = 0; k < NO * 2; k++) {
    const ox = k * per;
    for (const [sx, sy, dir] of [[ox + per * 0.28, 96, 1], [ox + per * 0.72, 160, -1]]) { x.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 3.0, rr = 22 * (1 - i / 46); x.lineTo(sx + Math.cos(a) * rr * dir, sy + Math.sin(a) * rr * dir); } x.stroke(); }
  }
  x.fillStyle = '#383838'; x.fillRect(0, 0, 2048, 16); x.fillRect(0, 240, 2048, 16);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// fleur-de-lis outline (x: -w/2..w/2, y: 0..h)
function fleurShape(w, h) {
  const s = new THREE.Shape(), k = w / 2;
  s.moveTo(-0.16 * k, 0);
  s.lineTo(-0.16 * k, 0.22 * h);
  // left petal: sweeps out and curls down
  s.bezierCurveTo(-0.45 * k, 0.2 * h, -1.0 * k, 0.28 * h, -0.98 * k, 0.55 * h);
  s.bezierCurveTo(-0.97 * k, 0.72 * h, -0.7 * k, 0.8 * h, -0.55 * k, 0.66 * h);
  s.bezierCurveTo(-0.66 * k, 0.6 * h, -0.62 * k, 0.48 * h, -0.5 * k, 0.45 * h);
  s.bezierCurveTo(-0.38 * k, 0.43 * h, -0.27 * k, 0.48 * h, -0.2 * k, 0.56 * h);
  // central petal
  s.bezierCurveTo(-0.34 * k, 0.72 * h, -0.2 * k, 0.9 * h, 0, h);
  s.bezierCurveTo(0.2 * k, 0.9 * h, 0.34 * k, 0.72 * h, 0.2 * k, 0.56 * h);
  // right petal
  s.bezierCurveTo(0.27 * k, 0.48 * h, 0.38 * k, 0.43 * h, 0.5 * k, 0.45 * h);
  s.bezierCurveTo(0.62 * k, 0.48 * h, 0.66 * k, 0.6 * h, 0.55 * k, 0.66 * h);
  s.bezierCurveTo(0.7 * k, 0.8 * h, 0.97 * k, 0.72 * h, 0.98 * k, 0.55 * h);
  s.bezierCurveTo(1.0 * k, 0.28 * h, 0.45 * k, 0.2 * h, 0.16 * k, 0.22 * h);
  s.lineTo(0.16 * k, 0);
  s.lineTo(-0.16 * k, 0);
  return s;
}
// pointed fleuron (ogee leaf)
function leafShape(w, h) {
  const s = new THREE.Shape(), k = w / 2;
  s.moveTo(-k, 0);
  s.bezierCurveTo(-k * 1.05, h * 0.35, -k * 0.2, h * 0.5, -k * 0.12, h * 0.78);
  s.bezierCurveTo(-k * 0.06, h * 0.9, 0, h * 0.95, 0, h);
  s.bezierCurveTo(0, h * 0.95, k * 0.06, h * 0.9, k * 0.12, h * 0.78);
  s.bezierCurveTo(k * 0.2, h * 0.5, k * 1.05, h * 0.35, k, 0);
  s.lineTo(-k, 0);
  return s;
}

(async () => {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || 1.0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const st = studio();
  const pm = new THREE.PMREMGenerator(renderer); const envTex = pm.fromScene(st, 0.01).texture; scene.environment = envTex;
  const crt = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType }); const cc = new THREE.CubeCamera(0.1, 100, crt); st.add(cc); cc.position.set(0, 0.6, 0); cc.update(renderer, st);

  const metal = new THREE.MeshPhysicalMaterial({ color: 0xe6edf7, metalness: 1, roughness: 0.14, envMapIntensity: 1.15 });
  const metalEng = metal.clone(); metalEng.bumpMap = engraveTex(); metalEng.bumpScale = 1.0; metalEng.roughness = 0.2;
  const satin = new THREE.MeshPhysicalMaterial({ color: 0xc9d6e8, metalness: 1, roughness: 0.3, envMapIntensity: 1.0 });
  const pearl = new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, roughness: 0.25, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.6, iridescenceIOR: 1.6, sheen: 0.5, sheenColor: new THREE.Color(0xcfe2ff), envMapIntensity: 1.0 });
  const velvet = new THREE.MeshPhysicalMaterial({ color: 0x071848, roughness: 0.95, sheen: 0.8, sheenColor: new THREE.Color(0x2f66e0), sheenRoughness: 0.5, envMapIntensity: 0.25 });
  const sapphire = gemMat(crt.texture, 0x2c64ff, { ior: 1.77, bright: 2.6, deep: 0x0b2a9a, deepK: 0.35 });
  const aqua = gemMat(crt.texture, 0x8adfff, { ior: 1.58, bright: 2.0, deep: 0x2a8fd0, deepK: 0.25 });
  const ice = gemMat(crt.texture, 0xeef7ff, { ior: 2.42, bright: 1.5, deep: 0x8fb8e8, deepK: 0.1 });
  const G = { metal: [], eng: [], satin: [], pearl: [], velvet: [], sapphire: [], aqua: [], ice: [] };
  const GEMS = [];   // positions for runtime sparkles (k: 1 small .. 3 big)

  // ---- band (lathe: rolled rims, flared body)
  const prof = [[0.955, 0.0], [1.0, 0.0], [1.045, 0.012], [1.07, 0.04], [1.06, 0.07], [1.03, 0.085], [1.035, 0.35], [1.06, 0.365], [1.085, 0.39], [1.088, 0.42], [1.07, 0.445], [1.04, BT], [0.965, BT], [0.955, 0.0]].map(([r, y]) => new THREE.Vector2(r * RB, y));
  G.eng.push(new THREE.LatheGeometry(prof, 256));
  // ---- pearls along both rims
  const pg = new THREE.SphereGeometry(0.02, 14, 10);
  for (const [y, r, n] of [[0.04, 1.082, 150], [0.415, 1.1, 156]]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const g = pg.clone(); g.translate(Math.sin(a) * r, y, Math.cos(a) * r); G.pearl.push(g); }
  // ---- band jewels: under every fleur-de-lis a big oval sapphire, under every fleuron an ice diamond cluster, small aquamarines between
  for (let i = 0; i < NO * 2; i++) {
    const a = i / (NO * 2) * Math.PI * 2, y = 0.225;
    const kind = i % 4 === 0 ? 'sap' : i % 2 === 0 ? 'dia' : 'aq';
    const r = kind === 'sap' ? 0.1 : kind === 'dia' ? 0.06 : 0.035;
    const gm = gemGeo(r, kind === 'sap' ? 'oval' : 'round', kind === 'sap' ? 16 : 12); if (kind === 'sap') gm.rotateZ(Math.PI / 2);
    G[kind === 'sap' ? 'sapphire' : kind === 'dia' ? 'ice' : 'aqua'].push(place(gm, a, RB * 1.035, y, 0.035));
    const bz = new THREE.TorusGeometry(r * 1.1, kind === 'aq' ? 0.008 : 0.012, 8, 40); if (kind === 'sap') bz.scale(0.76, 1.0, 1); G.metal.push(place(bz, a, RB * 1.035, y, 0.03));
    if (kind !== 'aq') for (let k = 0; k < 4; k++) { const pa = k / 4 * Math.PI * 2 + Math.PI / 4; const pr = new THREE.SphereGeometry(0.012, 8, 6); pr.translate(Math.cos(pa) * r * (kind === 'sap' ? 0.78 : 1.0), Math.sin(pa) * r * (kind === 'sap' ? 1.05 : 1.0), 0.03); G.metal.push(place(pr, a, RB * 1.035, y, 0.03)); }
    if (kind === 'dia') for (let k = 0; k < 4; k++) { const pa = k / 4 * Math.PI * 2; const pp = new THREE.SphereGeometry(0.019, 12, 8); pp.translate(Math.cos(pa) * 0.1, Math.sin(pa) * 0.1, 0.02); G.pearl.push(place(pp, a, RB * 1.035, y, 0.03)); }
    GEMS.push({ p: new THREE.Vector3(Math.sin(a) * 1.13, y, Math.cos(a) * 1.13), k: kind === 'sap' ? 3 : kind === 'dia' ? 2 : 1 });
  }
  // ---- ornaments on the rim
  for (let i = 0; i < NO; i++) {
    const a = i / NO * Math.PI * 2, fleur = i % 2 === 0;
    const w = fleur ? 0.46 : 0.3, h = fleur ? 0.5 : 0.3;
    const sh = fleur ? fleurShape(w, h) : leafShape(w, h);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.014, bevelSegments: 4, curveSegments: 36 });
    eg.translate(0, BT - 0.03, -0.03);
    const p = eg.attributes.position; for (let k = 0; k < p.count; k++) { const yy = Math.max(0, p.getY(k) - BT); p.setZ(k, p.getZ(k) + yy * yy * 0.12); }
    G.metal.push(bend(eg, a, RB * 1.045));
    if (fleur) {
      const gm = gemGeo(0.05, 'round', 12); G.sapphire.push(place(gm, a, RB * 1.045 + 0.065, BT + h * 0.33, 0));
      const bz = new THREE.TorusGeometry(0.055, 0.01, 8, 32); G.metal.push(place(bz, a, RB * 1.045 + 0.055, BT + h * 0.33, 0));
      GEMS.push({ p: new THREE.Vector3(Math.sin(a) * 1.16, BT + h * 0.33, Math.cos(a) * 1.16), k: 2 });
    } else {
      const pe = new THREE.SphereGeometry(0.042, 24, 16); const tr = RB * 1.045 + h * h * 0.12; pe.translate(Math.sin(a) * tr, BT + h + 0.025, Math.cos(a) * tr); G.pearl.push(pe);
      const pr = gemGeo(0.045, 'pear', 14); pr.rotateZ(Math.PI); G.aqua.push(place(pr, a, RB * 1.045 + 0.06, BT + h * 0.36, 0));
      GEMS.push({ p: new THREE.Vector3(Math.sin(a) * 1.15, BT + h * 0.36, Math.cos(a) * 1.15), k: 1 });
    }
  }
  // ---- four pearled arches from the fleurs-de-lis to the monde (depressed at the centre)
  const TOP = 1.36;
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2;
    const P = (r, y) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    const curve = new THREE.CatmullRomCurve3([P(1.07, BT + 0.42), P(1.02, BT + 0.66), P(0.84, BT + 0.95), P(0.5, TOP + 0.08), P(0.2, TOP + 0.02), P(0.0, TOP - 0.02)]);
    G.metal.push(new THREE.TubeGeometry(curve, 160, 0.04, 16, false));
    for (let k = 1; k < 18; k++) { const t = 0.04 + k / 18 * 0.88; const c = curve.getPoint(t); const o = c.clone().sub(new THREE.Vector3(0, 0.5, 0)).normalize(); const g = new THREE.SphereGeometry(0.026, 14, 10); g.translate(c.x + o.x * 0.06, c.y + o.y * 0.06, c.z + o.z * 0.06); G.pearl.push(g); }
  }
  // ---- velvet cap, puffed between the arches
  {
    const cg = new THREE.SphereGeometry(0.98, 160, 60, 0, Math.PI * 2, 0, Math.PI / 2); const p = cg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const th = Math.atan2(x, z);
      const puff = 1 + 0.07 * Math.pow(Math.abs(Math.sin(th * 2)), 0.8) * Math.sin(Math.min(1, y * 1.4) * Math.PI);
      p.setXYZ(i, x * puff, BT - 0.04 + y * (TOP - BT - 0.05) * (0.92 + 0.12 * Math.abs(Math.sin(th * 2))), z * puff); }
    cg.computeVertexNormals(); G.velvet.push(cg);
  }
  // ---- monde: steel orb with a jewelled girdle, crowned by a big faceted ice diamond
  {
    const oy = TOP + 0.11;
    G.metal.push(new THREE.SphereGeometry(0.11, 48, 32).translate(0, oy, 0));
    const gi = new THREE.TorusGeometry(0.112, 0.012, 10, 48); gi.rotateX(Math.PI / 2); gi.translate(0, oy, 0); G.satin.push(gi);
    const me = new THREE.TorusGeometry(0.112, 0.01, 10, 48); me.translate(0, oy, 0); G.satin.push(me);
    for (let k = 0; k < 10; k++) { const aa = k / 10 * Math.PI * 2; const g = new THREE.SphereGeometry(0.014, 8, 6); g.translate(Math.sin(aa) * 0.12, oy, Math.cos(aa) * 0.12); G.pearl.push(g); }
    const cup = new THREE.CylinderGeometry(0.035, 0.02, 0.05, 16); cup.translate(0, oy + 0.13, 0); G.metal.push(cup);
    const dg = gemGeo(0.075, 'round', 16); dg.rotateX(-Math.PI / 2); dg.scale(1, 1.35, 1); dg.translate(0, oy + 0.2, 0); G.ice.push(dg);
    GEMS.push({ p: new THREE.Vector3(0, oy + 0.24, 0), k: 3 });
  }
  const M = { metal, eng: metalEng, satin, pearl, velvet, sapphire, aqua, ice };
  for (const k in G) if (G[k].length) {
    const g = mergeGeometries(G[k].map((x) => (x.index ? x.toNonIndexed() : x)).map((x) => { for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; }));
    const mesh = new THREE.Mesh(g, M[k]); mesh.castShadow = k !== 'velvet'; mesh.receiveShadow = true; scene.add(mesh);
  }
  // direct lights: cool moon rim from upper-left-behind, soft key, warm torch kicker from lower right
  const rim = new THREE.DirectionalLight(0xbcd8ff, 2.2); rim.position.set(-4, 6, -3); scene.add(rim);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-3, 5, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 1, far: 20 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.01; scene.add(key);
  const warm = new THREE.DirectionalLight(0xffb066, 0.8); warm.position.set(5, -0.5, 4); scene.add(warm);
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x0a1020, 0.3));

  const cam = new THREE.PerspectiveCamera(+(Q.get('fov') || 20), W / H, 0.1, 100);
  const dist = +(Q.get('dist') || 8.2), ty = +(Q.get('ty') || 0.78);
  cam.position.set(0, ty + Math.sin(EL) * dist, Math.cos(EL) * dist); cam.lookAt(0, ty, 0);
  const rot = +(Q.get('rot') || 0) * Math.PI / 180; scene.rotation.y = rot;
  scene.updateMatrixWorld(true);
  renderer.render(scene, cam);
  const img = renderer.domElement.toDataURL('image/png');
  const proj = (v) => { const p = v.clone().applyMatrix4(scene.matrixWorld).project(cam); return [+(p.x * 0.5 + 0.5).toFixed(4), +(0.5 - p.y * 0.5).toFixed(4), +p.z.toFixed(4)]; };
  const gems = GEMS.filter((g) => g.p.clone().applyMatrix4(scene.matrixWorld).z > 0.1 || g.p.y > 1.3).map((g) => [...proj(g.p), g.k]);
  window.__out = { img, gems }; window.__done = true;
})().catch((e) => { window.__err = String(e && e.stack || e); console.error(e); });
