// Blue Wall loader — OFFLINE render of a jewelled steel/silver crown (sapphires, aquamarine pears, ice diamonds, pearls, navy velvet cap).
// Transparent background; PBR metal in a studio environment (PMREM), facet gems via a custom refraction shader on a cube env.
// URL: ?w=640&h=440&ss=3&cap=1&el=9
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const Q = new URLSearchParams(location.search);
const OW = +(Q.get('w') || 640), OH = +(Q.get('h') || 440), SS = +(Q.get('ss') || 3), W = OW * SS, H = OH * SS;
const CAP = Q.get('cap') !== '0', EL = +(Q.get('el') || 9) * Math.PI / 180;
const NF = 10;                       // fleurons around (alternating tall / short)
const RB = 1.0;                      // band radius

// ------------------------------------------------------------------ studio environment: black room, soft boxes, strip lights, a cool rim and a warm torch-gold kicker
function studio() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x020306);
  const panel = (w, h, col, k, pos, look) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(...look); s.add(m); };
  panel(9, 5, 0xffffff, 5.5, [0, 9, 1], [0, 0, 0]);                 // overhead soft box
  panel(1.0, 9, 0xeaf3ff, 12, [-8, 2, 3], [0, 0, 0]);              // strip left
  panel(1.0, 9, 0xeaf3ff, 9, [8, 2, 2], [0, 0, 0]);                // strip right
  panel(4, 4, 0xffffff, 5, [-4, 3, 8], [0, 0, 0]);                 // key front-left
  panel(10, 3, 0x6fb4ff, 4.5, [0, 3, -9], [0, 0, 0]);              // cool rim behind
  panel(2.4, 1.6, 0xffc070, 3.2, [6, -0.5, 6], [0, 0, 0]);         // warm torch-gold kicker
  panel(14, 14, 0x0b1424, 1.0, [0, -6, 0], [0, 0, 0]);             // dim floor bounce
  panel(3, 0.4, 0xffffff, 14, [2, 5, 7], [0, 0, 0]);               // thin hot strip (crisp specular line)
  return s;
}

// ------------------------------------------------------------------ gem shader (faceted, fake refraction + internal bounce + dispersion)
function gemMat(env, tint, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { env: { value: env }, tint: { value: new THREE.Color(tint) }, ior: { value: o.ior ?? 1.77 }, bright: { value: o.bright ?? 1.6 }, spark: { value: o.spark ?? 1.0 } },
    vertexShader: `varying vec3 vW; varying vec3 vL; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vL = position; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform samplerCube env; uniform vec3 tint; uniform float ior, bright, spark; varying vec3 vW; varying vec3 vL;
      vec3 h33(vec3 p){ p = fract(p * vec3(.1031,.1030,.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
      void main(){
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
        vec3 v = normalize(vW - cameraPosition); if (dot(n, v) > 0.) n = -n;
        float cosi = max(dot(-v, n), 0.);
        float fr = 0.07 + 0.93 * pow(1. - cosi, 5.);
        vec3 refl = textureCube(env, reflect(v, n)).rgb;
        vec3 jit = h33(floor(n * 23.0 + 7.0)) - 0.5;              // per-facet pseudo pavilion orientation (stable across a facet)
        vec3 col = vec3(0.);
        for (int c = 0; c < 3; c++) {                               // dispersion: three iors
          float e = ior + (float(c) - 1.) * 0.035;
          vec3 t = refract(v, n, 1. / e);
          vec3 b1 = reflect(t, normalize(-n + jit * 1.3));
          vec3 b2 = reflect(b1, normalize(n + jit.zxy * 1.1));
          vec3 s = textureCube(env, b2).rgb;
          col[c] = s[c];
        }
        vec3 body = col * tint * bright + tint * 0.05;
        vec3 o = mix(body, refl, fr) + refl * 0.12;
        o += spark * pow(max(dot(reflect(v, n), normalize(vec3(-0.4, 0.8, 0.5))), 0.), 180.) * 6.;
        gl_FragColor = vec4(o, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
// brilliant-ish faceted gem (lathe with few segments → facets). shape: 'round' | 'oval' | 'pear'
function gemGeo(r, shape = 'round', seg = 12) {
  const pts = [new THREE.Vector2(0.0001, -0.62 * r), new THREE.Vector2(0.55 * r, -0.28 * r), new THREE.Vector2(r, -0.02 * r), new THREE.Vector2(r, 0.03 * r), new THREE.Vector2(0.78 * r, 0.2 * r), new THREE.Vector2(0.52 * r, 0.3 * r), new THREE.Vector2(0.0001, 0.3 * r)];
  let g = new THREE.LatheGeometry(pts, seg); g = g.toNonIndexed();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), z = p.getZ(i);
    if (shape === 'oval') z *= 0.72;
    if (shape === 'pear') { const t = z / r; x *= 0.62 * (1 - 0.45 * Math.max(0, t)); z = z * 1.15 + (t > 0 ? t * t * 0.35 * r : 0); }
    p.setXYZ(i, x, p.getY(i), z); }
  g.rotateX(Math.PI / 2);   // table faces +z (outward)
  g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------ bending helper: maps a flat piece (x along the band, y up, z outward) onto the band cylinder
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
  const per = 2048 / NF;
  x.strokeStyle = '#d0d0d0'; x.lineWidth = 5; x.lineCap = 'round';
  for (let k = 0; k < NF; k++) {
    const ox = k * per;
    x.beginPath(); for (let i = 0; i <= 60; i++) { const t = i / 60; const px = ox + t * per, py = 128 + Math.sin(t * Math.PI * 2) * 40; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    for (const [sx, sy, dir] of [[ox + per * 0.25, 88, 1], [ox + per * 0.75, 168, -1]]) { x.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 3.2, rr = 26 * (1 - i / 46); x.lineTo(sx + Math.cos(a) * rr * dir, sy + Math.sin(a) * rr * dir); } x.stroke(); }
    x.fillStyle = '#e8e8e8'; for (const [dx, dy] of [[0.5, 70], [0.5, 186], [0.06, 128], [0.94, 128]]) { x.beginPath(); x.arc(ox + per * dx, dy, 7, 0, 7); x.fill(); }
  }
  x.fillStyle = '#404040'; x.fillRect(0, 0, 2048, 18); x.fillRect(0, 238, 2048, 18);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

(async () => {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || 1.05);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const st = studio();
  const pm = new THREE.PMREMGenerator(renderer); const envTex = pm.fromScene(st, 0.012).texture; scene.environment = envTex;
  const crt = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType }); const cc = new THREE.CubeCamera(0.1, 100, crt); st.add(cc); cc.update(renderer, st);

  const metal = new THREE.MeshPhysicalMaterial({ color: 0xe9eef6, metalness: 1, roughness: 0.17, envMapIntensity: 1.25, clearcoat: 0.4, clearcoatRoughness: 0.08 });
  const metalEng = metal.clone(); metalEng.bumpMap = engraveTex(); metalEng.bumpScale = 1.2; metalEng.roughness = 0.2;
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x9aa6b8, metalness: 1, roughness: 0.32, envMapIntensity: 0.9 });
  const pearl = new THREE.MeshPhysicalMaterial({ color: 0xf3f1ec, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.7, iridescenceIOR: 1.6, sheen: 0.5, sheenColor: new THREE.Color(0xcfe2ff), envMapIntensity: 1.1 });
  const velvet = new THREE.MeshPhysicalMaterial({ color: 0x0c2a72, roughness: 0.95, sheen: 1.0, sheenColor: new THREE.Color(0x4f8cff), sheenRoughness: 0.42, envMapIntensity: 0.6 });
  const sapphire = gemMat(crt.texture, 0x1f5cff, { ior: 1.77, bright: 2.2 });
  const aqua = gemMat(crt.texture, 0x7fd8ff, { ior: 1.58, bright: 1.7 });
  const ice = gemMat(crt.texture, 0xe8f6ff, { ior: 2.42, bright: 1.25 });
  const G = { metal: [], eng: [], dark: [], pearl: [], velvet: [], sapphire: [], aqua: [], ice: [] };
  const GEMS = [];   // positions for runtime sparkles

  // ---- band (lathe: rolled rims, flared body, inner wall)
  const prof = [[0.955, 0.0], [1.0, 0.0], [1.045, 0.012], [1.07, 0.04], [1.06, 0.07], [1.03, 0.085], [1.035, 0.37], [1.06, 0.385], [1.085, 0.41], [1.088, 0.44], [1.07, 0.465], [1.04, 0.475], [0.965, 0.475], [0.955, 0.0]].map(([r, y]) => new THREE.Vector2(r * RB, y));
  const band = new THREE.LatheGeometry(prof, 256); G.eng.push(band);
  // ---- pearls along both rims
  const pg = new THREE.SphereGeometry(0.021, 14, 10);
  for (const [y, r, n] of [[0.04, 1.082, 150], [0.44, 1.1, 156]]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const g = pg.clone(); g.translate(Math.sin(a) * r, y, Math.cos(a) * r); G.pearl.push(g); }
  // ---- band jewels: big oval sapphires alternating with round ice diamonds, in bezels with prongs
  for (let i = 0; i < NF; i++) {
    const a = i / NF * Math.PI * 2, big = i % 2 === 0, y = 0.23;
    const r = big ? 0.085 : 0.05;
    const gm = gemGeo(r, big ? 'oval' : 'round', big ? 16 : 12); if (big) gm.rotateZ(Math.PI / 2);
    G[big ? 'sapphire' : 'ice'].push(place(gm, a, RB * 1.035, y, 0.035));
    const bz = new THREE.TorusGeometry(big ? r * 1.08 : r * 1.12, 0.012, 8, 40); if (big) bz.scale(0.74, 1.0, 1); G.metal.push(place(bz, a, RB * 1.035, y, 0.03));
    for (let k = 0; k < 4; k++) { const pa = k / 4 * Math.PI * 2 + Math.PI / 4; const pr = new THREE.SphereGeometry(0.011, 8, 6); pr.translate(Math.cos(pa) * r * (big ? 0.75 : 1.0), Math.sin(pa) * r * (big ? 1.05 : 1.0), 0.03); G.metal.push(place(pr, a, RB * 1.035, y, 0.03)); }
    GEMS.push({ p: new THREE.Vector3(Math.sin(a) * 1.12, y, Math.cos(a) * 1.12), k: big ? 2 : 1 });
    // small pearls flanking each jewel
    for (const s of [-1, 1]) { const g = new THREE.SphereGeometry(0.024, 14, 10); const aa = a + s * (Math.PI / NF); g.translate(Math.sin(aa) * 1.068, y, Math.cos(aa) * 1.068); G.pearl.push(g); }
  }
  // ---- fleurons: tall gothic lancets with an aquamarine pear inside + diamond at the tip; short ones with a pearl
  for (let i = 0; i < NF; i++) {
    const a = i / NF * Math.PI * 2 + Math.PI / NF * 0, tall = i % 2 === 0;
    const h = tall ? 0.78 : 0.42, w = tall ? 0.34 : 0.22;
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.bezierCurveTo(-w / 2, h * 0.42, -w * 0.18, h * 0.72, 0, h); sh.bezierCurveTo(w * 0.18, h * 0.72, w / 2, h * 0.42, w / 2, 0); sh.lineTo(-w / 2, 0);
    if (tall) { const ho = new THREE.Path(); const hw = w * 0.56, h0 = 0.1, h1 = h * 0.7; ho.moveTo(-hw / 2, h0); ho.bezierCurveTo(-hw / 2, h0 + (h1 - h0) * 0.45, -hw * 0.15, h0 + (h1 - h0) * 0.75, 0, h1); ho.bezierCurveTo(hw * 0.15, h0 + (h1 - h0) * 0.75, hw / 2, h0 + (h1 - h0) * 0.45, hw / 2, h0); ho.lineTo(-hw / 2, h0); sh.holes.push(ho); }
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.012, bevelSegments: 4, curveSegments: 40 });
    eg.translate(0, 0.455, -0.03);
    // gentle outward lean: rotate about x before bending
    const p = eg.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k) - 0.455; p.setZ(k, p.getZ(k) + yy * yy * 0.18); }
    G.metal.push(bend(eg, a, RB * 1.045));
    const tipY = 0.455 + h, tipR = RB * 1.045 + h * h * 0.18;
    if (tall) {
      const pear = gemGeo(0.07, 'pear', 14); pear.rotateZ(Math.PI); pear.rotateX(0); G.aqua.push(place(pear, a, RB * 1.045 + 0.06, 0.455 + 0.1 + (h * 0.7 - 0.1) * 0.42, 0.02));
      GEMS.push({ p: new THREE.Vector3(Math.sin(a) * (RB * 1.16), 0.455 + h * 0.36, Math.cos(a) * (RB * 1.16)), k: 1 });
      const tip = gemGeo(0.05, 'round', 12); tip.rotateX(-0.3); G.ice.push(place(tip, a, tipR, tipY + 0.035, 0.0));
      const ring = new THREE.TorusGeometry(0.052, 0.01, 8, 32); G.metal.push(place(ring, a, tipR, tipY + 0.035, 0.0));
      GEMS.push({ p: new THREE.Vector3(Math.sin(a) * (tipR + 0.05), tipY + 0.04, Math.cos(a) * (tipR + 0.05)), k: 3 });
    } else {
      const g = new THREE.SphereGeometry(0.045, 24, 16); g.translate(Math.sin(a) * tipR, tipY + 0.03, Math.cos(a) * tipR); G.pearl.push(g);
      const sg = new THREE.SphereGeometry(0.03, 14, 10); sg.translate(Math.sin(a) * (RB * 1.09), 0.455 + h * 0.4, Math.cos(a) * (RB * 1.09)); G.sapphire.push(sg);
    }
  }
  // ---- velvet cap (navy, gathered into soft bulges between fleurons) + an ermine-free inner rim
  if (CAP) {
    const cg = new THREE.SphereGeometry(0.98, 128, 48, 0, Math.PI * 2, 0, Math.PI / 2); const p = cg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const th = Math.atan2(x, z); const k = 1 + 0.045 * Math.cos(th * NF / 2) * Math.min(1, y * 2.5); p.setXYZ(i, x * k, 0.42 + y * 0.62, z * k); }
    cg.computeVertexNormals(); G.velvet.push(cg);
    // monde: a small steel orb + ice diamond at the crest
    const orb = new THREE.SphereGeometry(0.075, 32, 20); orb.translate(0, 1.11, 0); G.metal.push(orb);
    const cr = new THREE.TorusGeometry(0.075, 0.009, 8, 40); cr.rotateX(Math.PI / 2); cr.translate(0, 1.11, 0); G.metal.push(cr);
    const tg = gemGeo(0.05, 'round', 12); tg.rotateX(-Math.PI / 2); tg.translate(0, 1.21, 0); G.ice.push(tg);
    GEMS.push({ p: new THREE.Vector3(0, 1.23, 0), k: 3 });
  }
  const M = { metal, eng: metalEng, dark, pearl, velvet, sapphire, aqua, ice };
  for (const k in G) if (G[k].length) { const g = mergeGeometries(G[k].map((x) => (x.index ? x.toNonIndexed() : x)).map((x) => { for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a); if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; })); scene.add(new THREE.Mesh(g, M[k])); }

  // the band is front-facing (+z); turn the crown so a big sapphire faces the camera
  const cam = new THREE.PerspectiveCamera(+(Q.get('fov') || 20), W / H, 0.1, 100);
  const dist = +(Q.get('dist') || 7.6), ty = +(Q.get('ty') || 0.6);
  cam.position.set(0, ty + Math.sin(EL) * dist, Math.cos(EL) * dist); cam.lookAt(0, ty, 0);
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x0a1020, 0.25));
  renderer.render(scene, cam);
  const img = renderer.domElement.toDataURL('image/png');
  const proj = (v) => { const p = v.clone().project(cam); return [+(p.x * 0.5 + 0.5).toFixed(4), +(0.5 - p.y * 0.5).toFixed(4), +p.z.toFixed(4)]; };
  // keep only gems facing the camera
  const gems = GEMS.filter((g) => g.p.z > -0.2).map((g) => [...proj(g.p), g.k]);
  window.__out = { img, gems }; window.__done = true;
})().catch((e) => { window.__err = String(e && e.stack || e); console.error(e); });
