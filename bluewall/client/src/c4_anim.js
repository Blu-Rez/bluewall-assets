// C4 — the moving parts of the food buildings: the windmill sails and the water wheel turn.  The buildings themselves are baked (wsbuild.js bakePieces); each sail / wheel is one plain Mesh
// (the kit's own shared flat material, the baked meshes' material object: +0 shader programs — measured: an InstancedMesh of it compiles a 2nd program variant, so it is NOT used) whose matrix is
// rewritten each frame (a handful of parts in all: 1 / 2 / 3 sails per wind mill with the level, 1 wheel per water mill; 1 draw call each, frustum-culled).
//   const a = makeC4Anim(group, kitC4);   a.set(siteId, [{ n: 'c4_windmill_fan' | 'c4_wheel', x, y, z, yaw, s, spin }])  (world metres; y = ground at the site)   a.update(t, camera)   a.dispose()
// The hub of each moving part is read from the kit itself (the node's own origin), so a new model needs no number here.
import * as THREE from 'three';

const SPEC = { c4_windmill_fan: { node: 'building_windmill_top_fan_blue', axis: 'z' }, c4_wheel: { node: 'building_watermill_wheel_blue', axis: 'z' } };
const FAR = 330;                                                              // m from the camera: nothing turns (nothing is drawn) beyond this
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _h = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const AX = { x: new THREE.Vector3(1, 0, 0), z: new THREE.Vector3(0, 0, 1) };       // the wheel's disc is in the piece's XY plane (axis z): it sticks out of the house's -z wall

export function makeC4Anim(parent, kit, cap = 24) {
  if (!kit) return null;
  kit.scene.updateMatrixWorld(true);
  const types = {};
  for (const [name, sp] of Object.entries(SPEC)) {
    const root = kit.scene.getObjectByName(name); if (!root) continue;
    let mesh = null; root.traverse((o) => { if (!mesh && o.isMesh && (o.name === sp.node || (o.parent && o.parent.name === sp.node) || o.name.startsWith(sp.node))) mesh = o; });
    if (!mesh) continue;
    const M = mesh.matrixWorld.clone(), hub = new THREE.Vector3().setFromMatrixPosition(M); M.setPosition(0, 0, 0);            // piece space (bottom-centre, metres); the part pivots on its own origin
    const g = mesh.geometry.clone();
    for (const nm of ['position', 'normal']) {                                                      // the kit is quantised (normalised int16 / int8): to float first, applyMatrix4 would clamp to [-1, 1]
      const a = g.getAttribute(nm); if (!a) continue; const f = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); }
      g.setAttribute(nm, new THREE.BufferAttribute(f, 3));
    }
    g.applyMatrix4(M); g.computeBoundingSphere();
    types[name] = { geo: g, mat: mesh.material, pool: [], hub, axis: AX[sp.axis], list: [], name };
  }
  const sites = new Map();
  const rebuildLists = () => { for (const T of Object.values(types)) T.list = []; for (const arr of sites.values()) for (const e of arr) { const T = types[e.n]; if (T && T.list.length < cap) T.list.push(e); } };
  return {
    types,
    set(id, entries) { if (entries && entries.length) sites.set(id, entries); else sites.delete(id); rebuildLists(); },
    update(t, camera) {
      for (const T of Object.values(types)) {
        let n = 0;
        for (const e of T.list) {
          if (camera && Math.hypot(camera.position.x - e.x, camera.position.z - e.z) > FAR) continue;
          _h.copy(T.hub).multiplyScalar(e.s).applyAxisAngle(_up, e.yaw);
          _p.set(e.x + _h.x, e.y + _h.y, e.z + _h.z);
          _q.setFromAxisAngle(_up, e.yaw); _qa.setFromAxisAngle(T.axis, e.spin * t + (e.x * 0.37 + e.z * 0.11)); _q.multiply(_qa);
          _s.set(e.s, e.s, e.s); _m.compose(_p, _q, _s);
          let m = T.pool[n];
          if (!m) { m = new THREE.Mesh(T.geo, T.mat); m.name = 'c4anim:' + T.name; m.matrixAutoUpdate = false; m.castShadow = false; m.receiveShadow = true; T.pool.push(m); parent.add(m); }
          m.matrix.copy(_m); m.matrixWorld.copy(_m); m.matrixWorldNeedsUpdate = false; m.visible = true; n++;
        }
        for (let i = n; i < T.pool.length; i++) T.pool[i].visible = false;
      }
    },
    dispose() { for (const T of Object.values(types)) { for (const m of T.pool) parent.remove(m); T.pool.length = 0; T.geo.dispose(); } },
  };
}
