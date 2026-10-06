// The waterfall at the head of the river: the stream drops off the cliff of the mountain ring (north-east of the town) into the river bed.
//   · one draped ribbon (5 columns × 56 rows) that follows the real terrain mesh, animated falling streaks + foam sheets in a shader,
//   · a soft rolling mist cloud (Points) at the foot and a lighter veil along the fall.
// Total cost: 2 draw calls, ~600 vertices. Fog / night come from the scene (FogExp2) and the time-of-day state P.
//   buildFalls({ scene, fh }) -> { update(t, dt, camera, P), info }     fh = terrain.fastHeight (the height of the mesh the player sees)
import * as THREE from 'three';
import * as L from './layout.js';

const ROWS = 56, COLS = 5;

function mistTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.35, 'rgba(235,246,255,0.45)'); gr.addColorStop(1, 'rgba(220,238,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildFalls({ scene, fh }) {
  if (!L.RIVER || L.RIVER.length < 2) return { update() {}, info: null };
  const [rx, rz] = L.RIVER[0], [bx, bz] = L.RIVER[1];
  const len = Math.hypot(rx - bx, rz - bz), ux = (rx - bx) / len, uz = (rz - bz) / len;      // upstream direction (away from the town)
  const px = -uz, pz = ux;                                                                    // across the stream
  const H = (x, z) => fh(x, z);
  // base = where the stream bed meets the cliff, top = where the face stops rising steeply (capped so it never gets absurdly tall)
  let sb = 0; for (let s = 0; s <= 40; s += 1) { if (H(rx + ux * s, rz + uz * s) > 0.5) { sb = s; break; } }
  let sBest = sb + 6, hMax = 0; for (let s = sb; s <= sb + 40; s += 1) hMax = Math.max(hMax, H(rx + ux * s, rz + uz * s));
  const cap = Math.min(hMax, 120);
  for (let s = sb; s <= sb + 40; s += 1) { if (H(rx + ux * s, rz + uz * s) >= cap * 0.92) { sBest = s; break; } sBest = s; }
  const st = Math.max(sb + 5, sBest);
  const hBase = H(rx + ux * sb, rz + uz * sb), hTop = H(rx + ux * st, rz + uz * st);
  if (!(hTop - hBase > 12)) return { update() {}, info: null };                              // a gentle slope: no waterfall

  const pos = [], uv = [], idx = [];
  for (let r = 0; r < ROWS; r++) {
    const v = r / (ROWS - 1), s = sb - 1.5 + (st - sb + 1.5) * v;                              // v: 0 foot ... 1 crest
    const w = (4.6 + 3.4 * (1 - v)) * (1 + 0.12 * Math.sin(v * 9));                           // half width: wider at the foot
    for (let c = 0; c < COLS; c++) {
      const k = c / (COLS - 1) * 2 - 1, off = k * w;
      const x = rx + ux * s + px * off, z = rz + uz * s + pz * off;
      const y = H(x, z) + 0.9 + 0.5 * (1 - Math.abs(k));                                      // sits just proud of the rock, a bit fuller in the middle
      pos.push(x - ux * (0.7 + 0.9 * (1 - Math.abs(k))), y, z - uz * (0.7 + 0.9 * (1 - Math.abs(k))));   // pushed out of the cliff towards the town
      uv.push(c / (COLS - 1), v);
    }
  }
  for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS - 1; c++) { const a = r * COLS + c, b = a + 1, d = a + COLS, e = d + 1; idx.push(a, b, d, b, e, d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.computeBoundingSphere();

  const U = { uTime: { value: 0 }, uAmb: { value: 1 }, uLen: { value: (hTop - hBase) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, U]), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: `
      varying vec2 vUv; uniform float uTime;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv; vec3 p = position;
        p.x += sin(uv.y * 20.0 + uTime * 2.0) * 0.12 * (1.0 - uv.y); p.z += cos(uv.y * 17.0 - uTime * 1.7) * 0.12 * (1.0 - uv.y);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime, uAmb, uLen;
      #include <fog_pars_fragment>
      float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        float u = vUv.x, v = vUv.y;
        float fall = uTime * 1.35;
        // vertical streaks falling (stretched noise scrolling downwards), two octaves at different speeds
        float s1 = vn(vec2(u * 15.0, v * uLen * 0.07 + fall * 2.2));
        float s2 = vn(vec2(u * 31.0 + 7.0, v * uLen * 0.13 + fall * 3.4));
        float st = clamp(s1 * 0.62 + s2 * 0.5, 0.0, 1.0);
        float body = smoothstep(0.22, 0.85, st);
        vec3 deep = vec3(0.30, 0.56, 0.84), light = vec3(0.93, 0.98, 1.0);
        vec3 col = mix(deep, light, body * 0.85 + 0.12);
        // shimmer bands
        col += vec3(0.08, 0.1, 0.12) * smoothstep(0.7, 1.0, vn(vec2(u * 9.0, v * uLen * 0.3 + fall * 5.0)));
        // foam at the foot and along the crest
        float foot = smoothstep(0.2, 0.0, v), crest = smoothstep(0.93, 1.0, v);
        col = mix(col, vec3(1.0), clamp(foot * (0.6 + 0.5 * vn(vec2(u * 12.0 + uTime, v * 6.0 + uTime * 0.7))) + crest * 0.5, 0.0, 1.0));
        float edge = smoothstep(0.0, 0.2, u) * smoothstep(1.0, 0.8, u);
        float a = edge * mix(0.62, 0.95, body) * smoothstep(1.0, 0.9, v) * (0.8 + 0.2 * smoothstep(0.0, 0.1, v));
        col *= (0.16 + 0.84 * uAmb);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const ribbon = new THREE.Mesh(geo, mat); ribbon.name = 'waterfall'; ribbon.renderOrder = 3; ribbon.frustumCulled = true;
  scene.add(ribbon);

  // mist at the foot (rolling puffs) + a thin veil halfway up
  const N = 26, mp = new Float32Array(N * 3), seed = new Float32Array(N), base = new THREE.Vector3(rx + ux * (sb - 2) - ux * 3, hBase + 3, rz + uz * (sb - 2) - uz * 3);
  for (let i = 0; i < N; i++) seed[i] = Math.random() * 100;
  const mgeo = new THREE.BufferGeometry(); mgeo.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mgeo.boundingSphere = new THREE.Sphere(base, 120);
  const mmat = new THREE.PointsMaterial({ map: mistTexture(), size: 34, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, fog: true, color: 0xffffff });
  const mist = new THREE.Points(mgeo, mmat); mist.name = 'waterfall-mist'; mist.renderOrder = 4; scene.add(mist);
  const place = (t) => {
    for (let i = 0; i < N; i++) {
      const ph = (t * 0.07 + seed[i]) % 1, a = seed[i] * 2.7, rad = 4 + 9 * ph + (i % 5) * 1.6; void rad;
      const lat = Math.sin(a) * 9, out = 3 + ph * 18 + Math.cos(a * 1.3) * 3;
      mp[i * 3] = base.x - ux * (-1 + 0) + px * lat - ux * out * 0.5 + (Math.sin(t * 0.3 + a) * 2);
      mp[i * 3 + 1] = base.y + ph * 16 + (i % 4) * 1.5; mp[i * 3 + 2] = base.z + pz * lat - uz * out * 0.5 + (Math.cos(t * 0.27 + a) * 2);
    }
    mgeo.attributes.position.needsUpdate = true;
  };
  place(0);

  return {
    info: { base: [rx + ux * sb, hBase, rz + uz * sb], top: [rx + ux * st, hTop, rz + uz * st], height: hTop - hBase },
    update(t, dt, camera, P) {
      const d = camera ? camera.position.distanceTo(base) : 0;
      if (d > 1300) return;                                            // (stays visible so its shaders are compiled with everything else; frustum culling does the rest)
      U.uTime.value = t; mat.uniforms.uTime.value = t;
      const amb = P ? (1 - P.night * 0.82) : 1; mat.uniforms.uAmb.value = amb; mmat.opacity = 0.18 + 0.34 * amb;
      mmat.color.setScalar(0.35 + 0.65 * amb);
      place(t);
    },
  };
}
