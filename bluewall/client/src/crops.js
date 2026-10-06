// Wheat / crop rows: instanced tufts of thin blades with ears, swaying in the
// wind (vertex shader), golden at the tips. Cheap: ~10 triangles per tuft.
import * as THREE from 'three';
import { rng } from './noise.js';

function tuftGeometry(green = 0) {
  const pos = [], col = [], r = rng(12);
  const base = new THREE.Color('#6e6a2c').lerp(new THREE.Color('#3f6a24'), green), tip = new THREE.Color('#e9c46a').lerp(new THREE.Color('#8fbf4a'), green), ear = new THREE.Color('#f2d27e').lerp(new THREE.Color('#a8cf62'), green);
  const blade = (a, lean, h, w) => {
    const c = Math.cos(a), s = Math.sin(a), lx = Math.cos(a + 1.3) * lean, lz = Math.sin(a + 1.3) * lean;
    const p0 = [-c * w, 0, -s * w], p1 = [c * w, 0, s * w], p2 = [lx, h, lz];
    pos.push(...p0, ...p1, ...p2);
    col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
    // ear: a small diamond at the top
    const e = 0.07, eh = 0.22;
    pos.push(lx - c * e, h - eh, lz - s * e, lx + c * e, h - eh, lz + s * e, lx, h + 0.06, lz);
    col.push(ear.r * 0.8, ear.g * 0.8, ear.b * 0.8, ear.r * 0.8, ear.g * 0.8, ear.b * 0.8, ear.r, ear.g, ear.b);
  };
  for (let k = 0; k < 5; k++) blade(r() * Math.PI, (r() - 0.5) * 0.25, 0.85 + r() * 0.3, 0.035);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col.map((v) => Math.pow(v, 2.2)), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return g;
}

export function buildWheat(scene, { x, z, rot, w, d, rows = 0.9, step = 0.75, height, skip = () => false, scale = 1.6, green = 0 }) {
  const geo = tuftGeometry(green);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
  const U = { uTime: { value: 0 } };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 ip = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
      float wv = sin(uTime*1.6 + ip.x*0.18 + ip.z*0.11) * 0.5 + sin(uTime*2.7 + ip.x*0.31) * 0.25;
      float k = position.y * position.y;
      transformed.x += wv * 0.22 * k; transformed.z += wv * 0.12 * k;`);
  };
  const c = Math.cos(rot), s = Math.sin(rot), r = rng(77), list = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let lz = -d / 2; lz <= d / 2; lz += rows * scale) {
    for (let lx = -w / 2; lx <= w / 2; lx += step * scale * (0.8 + r() * 0.4)) {
      if (skip(lx, lz)) continue;
      const jx = lx + (r() - 0.5) * 0.3, jz = lz + (r() - 0.5) * 0.25;
      const px = x + jx * c + jz * s, pz = z - jx * s + jz * c;
      const k = scale * (0.85 + r() * 0.35);
      m.compose(v.set(px, height(px, pz) - 0.05, pz), q.setFromAxisAngle(up, r() * 6.28), sc.set(k, k * (0.9 + r() * 0.25), k));
      list.push(m.clone());
    }
  }
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((mm, i) => im.setMatrixAt(i, mm));
  im.receiveShadow = true; im.castShadow = false; im.computeBoundingSphere(); im.frustumCulled = false;
  scene.add(im);
  return { mesh: im, update(t) { U.uTime.value = t; } };
}
