import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { makeCreature } from '../bot/bluebot_v2/bluewall/client/src/creature.js';
(async () => {
  const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const out = {};
  for (const n of ['horse_m2m_bay', 'horse_m2m_black', 'horse_m2m_grey', 'horse_hq_barded']) {
    const g = await ld.loadAsync('assets/' + n + '.glb');
    const c = makeCreature(g, { length: 4.1 * 1.335 * 1.25 });
    const B = new THREE.Box3(); const res = {};
    res.base = +c.inner.position.y.toFixed(3);
    for (const cl of c.clips) {
      let mn = 1e9, mx = -1e9;
      const a = c.mixer.clipAction(cl); a.reset().play(); a.setEffectiveWeight(1);
      for (let i = 0; i < 8; i++) { a.time = cl.duration * i / 8; c.mixer.update(0); c.root.updateMatrixWorld(true); B.setFromObject(c.inner, true); mn = Math.min(mn, B.min.y); mx = Math.max(mx, B.max.y); }
      a.stop(); res[cl.name] = [+mn.toFixed(3), +mx.toFixed(3), +cl.duration.toFixed(2)];
    }
    out[n] = res;
  }
  window.__out = out; window.__ready = true;
})().catch((e) => { window.__err = String(e.stack || e); });
