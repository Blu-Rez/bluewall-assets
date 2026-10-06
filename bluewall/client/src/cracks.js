// Ground cracks (owner 5 Oct 01:05 "when the giant walks the ground cracks, and after they have passed it heals — real cracks").  One instanced quad per crack lying on the
// terrain (tilted to the slope), a procedural fissure texture (a dark jagged core with a dusty lip and hair cracks).  A crack opens in 0.12 s, stays, then HEALS: the lips close
// (the dark core thins from the ends inward through the alpha ramp) and it fades while a little dust settles.  64 slots, one draw call; nothing is created when no giant walks.
//   const ck = createCracks({ scene, height })   ck.add(x, z, size, yaw, life)   ck.update(dt)   ck.clear()   ck.dispose()
import * as THREE from 'three';

function crackTexture() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.clearRect(0, 0, S, S); g.lineCap = 'round'; g.lineJoin = 'round';
  const fis = (x, y, ang, len, w, depth) => {
    const pts = [[x, y]]; let a = ang, px = x, py = y; const n = Math.max(4, (len / 9) | 0);
    for (let i = 0; i < n; i++) { a += (r() - 0.5) * 0.9; const st = len / n * (0.7 + r() * 0.6); px += Math.cos(a) * st; py += Math.sin(a) * st; pts.push([px, py]);
      if (depth < 2 && r() < 0.28) fis(px, py, a + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.6), len * (0.3 + r() * 0.25), w * 0.55, depth + 1); }
    const stroke = (lw, col) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const k = i / pts.length; g.lineWidth = Math.max(0.8, lw * (1 - k * 0.8)); g.lineTo(pts[i][0], pts[i][1]); g.stroke(); g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); } };
    g.strokeStyle = 'rgba(150,125,95,0.55)'; stroke(w * 2.6);                // the dusty lip
    g.strokeStyle = 'rgba(40,30,22,0.9)'; stroke(w * 1.5);                    // the broken edge
    g.strokeStyle = 'rgba(6,4,3,1)'; stroke(w * 0.8);                         // the black core
  };
  const arms = 5; for (let i = 0; i < arms; i++) fis(S / 2, S / 2, (i / arms) * Math.PI * 2 + r() * 0.5, S * (0.3 + r() * 0.16), 8, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createCracks({ scene, height, wet = null }) {            // wet(x, z) -> true over water: a giant wading the moat leaves no crack on the water (p33 R2: the quad lies on the river bed and showed through)
  const N = 64, geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const aA = new Float32Array(N), aH = new Float32Array(N);
  geo.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 1).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: crackTexture() } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'attribute float aA; attribute float aH; varying float vA; varying float vH; varying vec2 vUv; void main(){ vUv = uv; vA = aA; vH = aH; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    // aH = how healed (0 open .. 1 closed): the black core is thresholded away from its thin ends inward, the whole thing fades
    fragmentShader: 'uniform sampler2D uMap; varying float vA; varying float vH; varying vec2 vUv; void main(){ vec4 c = texture2D(uMap, vUv); float core = smoothstep(vH * 0.9, vH * 0.9 + 0.12, c.a); gl_FragColor = vec4(c.rgb * mix(1.0, 0.8, vH), c.a * core * vA); if (gl_FragColor.a < 0.01) discard; }',
  });
  const im = new THREE.InstancedMesh(geo, mat, N); im.frustumCulled = false; im.count = N; im.renderOrder = 3; im.visible = false; scene.add(im);
  const Z = new THREE.Matrix4().makeScale(0, 0, 0), live = new Array(N).fill(null);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) im.setMatrixAt(i, Z);
  let next = 0;
  function add(x, z, size = 3, yaw = Math.random() * 6.28, life = 7) {
    if (wet && wet(x, z)) return;
    let i = -1; for (let k = 0; k < N; k++) { const j = (next + k) % N; if (!live[j]) { i = j; break; } }
    if (i < 0) i = next; next = (i + 1) % N;
    const y = height(x, z), e = 0.8, nx = height(x - e, z) - height(x + e, z), nz = height(x, z - e) - height(x, z + e);       // (the slope: the quad lies on the ground)
    live[i] = { x, y: y + 0.07, z, size, yaw, life, t: 0, nx: nx / (2 * e), nz: nz / (2 * e) }; im.visible = true;
  }
  function update(dt) {
    if (!im.visible) return; let any = 0;
    for (let i = 0; i < N; i++) {
      const c = live[i]; if (!c) continue; c.t += dt;
      if (c.t >= c.life) { live[i] = null; im.setMatrixAt(i, Z); aA[i] = 0; continue; }
      any++;
      const open = Math.min(1, c.t / 0.12), heal = Math.max(0, (c.t - c.life * 0.45) / (c.life * 0.55));      // opens fast; from 45 % of its life it heals
      aA[i] = open * (1 - heal * heal); aH[i] = heal;
      _q.setFromUnitVectors(UP, _n.set(c.nx, 1, c.nz).normalize()); _q.multiply(_q1.setFromAxisAngle(UP, c.yaw));
      const sz = c.size * (0.55 + 0.45 * Math.sqrt(open));
      _m.compose(_p.set(c.x, c.y, c.z), _q, _s.set(sz, 1, sz)); im.setMatrixAt(i, _m);
    }
    im.instanceMatrix.needsUpdate = true; geo.attributes.aA.needsUpdate = true; geo.attributes.aH.needsUpdate = true; if (!any) im.visible = false;
  }
  return { add, update, clear() { for (let i = 0; i < N; i++) { live[i] = null; im.setMatrixAt(i, Z); aA[i] = 0; } im.instanceMatrix.needsUpdate = true; im.visible = false; }, dispose() { scene.remove(im); geo.dispose(); mat.uniforms.uMap.value.dispose(); mat.dispose(); im.dispose && im.dispose(); } };
}
