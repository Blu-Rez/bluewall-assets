// Soft ground shadows for structures out in the country (p22 "scatter"): the sun's shadow map only covers the castle (±110 m), so the hamlet
// farmhouses stood on the grass like boxes pasted on a lawn. Each gets a soft dark footprint, a little longer on the side away from the
// sun — one InstancedMesh of flat quads (one draw call, no shadow pass), a 64 px canvas gradient.
import * as THREE from 'three';

let TEX = null;
function blobTexture() {
  if (TEX) return TEX;
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    // a rounded rectangle with soft edges (superellipse distance)
    const u = Math.abs((x + 0.5) / S * 2 - 1), v = Math.abs((y + 0.5) / S * 2 - 1), d = Math.pow(Math.pow(u, 4) + Math.pow(v, 4), 0.25);
    const a = Math.max(0, Math.min(1, (1 - d) / 0.42));
    img.data[(y * S + x) * 4 + 3] = Math.round(255 * a * a * (3 - 2 * a));
  }
  g.putImageData(img, 0, 0);
  TEX = new THREE.CanvasTexture(c); TEX.colorSpace = THREE.NoColorSpace;
  return TEX;
}

// items: [{ x, z, w, d, ry }] (footprint centre, size along the local x / z axes, yaw); sun: direction the shadows fall (x, z)
export function groundShadows(scene, items, height, { pad = 3.2, sun = [0.55, -0.45], strength = 0.5, name = 'sc_shadows' } = {}) {
  if (!items.length || typeof document === 'undefined') return null;
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: blobTexture(), color: 0x000000, transparent: true, opacity: strength, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: true });
  mat.name = name;
  const im = new THREE.InstancedMesh(geo, mat, items.length); im.name = name;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), S = new THREE.Vector3();
  items.forEach((b, i) => {
    const off = 0.9 + 0.1 * Math.max(b.w, b.d), x = b.x + sun[0] * off, z = b.z + sun[1] * off;
    let y = -1e9; for (const [dx, dz] of [[0, 0], [b.w / 2, 0], [-b.w / 2, 0], [0, b.d / 2], [0, -b.d / 2]]) y = Math.max(y, height(x + dx, z + dz));
    im.setMatrixAt(i, m.compose(P.set(x, y + 0.12, z), q.setFromAxisAngle(Y, b.ry || 0), S.set(b.w + pad, 1, b.d + pad)));
  });
  im.castShadow = false; im.receiveShadow = false; im.renderOrder = 1; im.computeBoundingSphere();
  scene.add(im);
  return im;
}
