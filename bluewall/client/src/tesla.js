// Tesla coils (a royal defense from the shop): up to four, on the wall towers closest to the main gate — the same towers in the player's
// kingdom and in a raided base (battlesim.teslaSpots).  Procedural and cheap: per coil a stone collar + a copper coil with brass rings
// (one merged mesh, 2 materials), a crystal orb, a soft halo sprite and a few idle arcs (one LineSegments).  ~5 draw calls a coil, only
// while it is shown.  In battle the chain lightning itself is fx.zap (bfx.js); fire(id) makes the orb flare.
//   const tz = createTesla({ scene, targets, meta, height });  tz.set(n)  tz.orb(targetId) -> [x,y,z] | null  tz.fire(targetId)  tz.update(t)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { teslaSpots } from './battlesim.js';

let haloTex = null;
const halo = () => {
  if (haloTex) return haloTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(235,252,255,1)'); gr.addColorStop(0.25, 'rgba(140,220,255,.75)'); gr.addColorStop(0.6, 'rgba(60,140,255,.22)'); gr.addColorStop(1, 'rgba(30,90,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); haloTex = new THREE.CanvasTexture(c); haloTex.colorSpace = THREE.SRGBColorSpace; return haloTex;
};

export function createTesla({ scene, targets, meta, height }) {
  const spots = teslaSpots(targets, meta, 4).map((id) => targets.find((t) => t.id === id)).filter(Boolean);
  const S = 0.95;                                                          // overall size (a tower top is ~10 m wide; the collar stays clear of the torch post)
  // ---- shared geometry
  const stone = [], copper = [];
  stone.push(new THREE.CylinderGeometry(2.3, 2.7, 1.2, 10).translate(0, 0.6, 0));
  stone.push(new THREE.CylinderGeometry(1.5, 2.0, 1.4, 10).translate(0, 1.9, 0));
  copper.push(new THREE.CylinderGeometry(0.62, 0.74, 5.2, 12, 1).translate(0, 5.2, 0));
  for (let i = 0; i < 6; i++) copper.push(new THREE.TorusGeometry(0.86 - i * 0.03, 0.12, 6, 16).rotateX(Math.PI / 2).translate(0, 3.2 + i * 0.78, 0));
  copper.push(new THREE.TorusGeometry(1.25, 0.16, 6, 20).rotateX(Math.PI / 2).translate(0, 7.95, 0));   // the top crown ring
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; copper.push(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 4).rotateZ(0.55).rotateY(a).translate(Math.cos(a) * 1.05, 8.4, Math.sin(a) * 1.05)); }
  const clean = (g) => { const n = g.toNonIndexed(); for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k); return n; };
  const gStone = mergeGeometries(stone.map(clean)), gCopper = mergeGeometries(copper.map(clean));
  const geo = mergeGeometries([gStone, gCopper], true);
  const mats = [new THREE.MeshStandardMaterial({ color: 0x66708a, roughness: 0.8, metalness: 0.15 }),
    new THREE.MeshStandardMaterial({ color: 0xc27a3c, roughness: 0.32, metalness: 0.85, emissive: 0x2a1004, emissiveIntensity: 0.4 })];
  const orbGeo = new THREE.IcosahedronGeometry(0.95, 2);
  const orbMat = new THREE.MeshStandardMaterial({ color: 0xd8f6ff, emissive: 0x58c8ff, emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.1 });
  const ARC_N = 5, ARC_SEG = 6;
  const coils = spots.map((t) => {
    const g = new THREE.Group(); g.name = 'tesla';
    const y0 = (t.h || 20) - 3.2 + 0.05;                               // (the flat roof of a weapon tower: castle.js builds it at absolute y = target height - 4 + 0.8)
    // the tower's torch post stands 0.54 R from its centre toward (+0.5 R, +0.2 R): the coil sits a little off-centre the other way
    const R = Math.max(3, ((t.w || 10) - 1) / 2), tl = Math.hypot(0.5, 0.2);
    g.position.set(t.x - (0.5 / tl) * R * 0.25, y0, t.z - (0.2 / tl) * R * 0.25); g.scale.setScalar(S);
    const body = new THREE.Mesh(geo, mats); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const orb = new THREE.Mesh(orbGeo, orbMat.clone()); orb.position.y = 9.4; g.add(orb);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: 0x9fe6ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
    sp.scale.setScalar(5.2); sp.position.y = 9.4; g.add(sp);
    const arcPos = new Float32Array(ARC_N * ARC_SEG * 2 * 3), arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3));
    const arcs = new THREE.LineSegments(arcGeo, new THREE.LineBasicMaterial({ color: 0xc8f6ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    arcs.frustumCulled = false; g.add(arcs);
    g.visible = false; scene.add(g);
    return { id: t.id, g, orb, sp, arcs, arcPos, flare: 0, down: false };
  });
  let shown = 0, nextArc = 0;
  function rebuildArcs(c, t) {
    const P = c.arcPos; let i = 0;
    for (let a = 0; a < ARC_N; a++) {
      const ang = Math.random() * Math.PI * 2, len = 2.2 + Math.random() * (c.flare > 0 ? 4.5 : 1.8), dy = (Math.random() - 0.4) * 2.4;
      let px = 0, py = 9.4, pz = 0;
      for (let s = 0; s < ARC_SEG; s++) {
        const k = (s + 1) / ARC_SEG, nx = Math.cos(ang) * len * k + (Math.random() - 0.5) * 0.7, ny = 9.4 + dy * k + (Math.random() - 0.5) * 0.7, nz = Math.sin(ang) * len * k + (Math.random() - 0.5) * 0.7;
        P[i++] = px; P[i++] = py; P[i++] = pz; P[i++] = nx; P[i++] = ny; P[i++] = nz; px = nx; py = ny; pz = nz;
      }
    }
    c.arcs.geometry.attributes.position.needsUpdate = true; void t;
  }
  return {
    get count() { return shown; },
    set(n) { shown = Math.max(0, Math.min(coils.length, n | 0)); coils.forEach((c, i) => { c.down = false; c.g.visible = i < shown; }); },
    ids() { return coils.slice(0, shown).map((c) => c.id); },
    hide(id) { const c = coils.find((q) => q.id === id); if (c) { c.down = true; c.g.visible = false; } },       // (its tower fell)
    orb(id) { const c = coils.find((q) => q.id === id && q.g.visible); if (!c) return null; const v = new THREE.Vector3(); c.orb.getWorldPosition(v); return [v.x, v.y, v.z]; },
    fire(id) { const c = coils.find((q) => q.id === id); if (c) c.flare = 0.35; },
    update(t, dt = 0.016) {
      if (!shown) return;
      const arcNow = t >= nextArc; if (arcNow) nextArc = t + 0.09;
      for (let i = 0; i < shown; i++) {
        const c = coils[i]; if (c.down) continue; c.flare = Math.max(0, c.flare - dt);
        const pulse = 0.5 + 0.5 * Math.sin(t * 5.3 + i * 2.1) * Math.sin(t * 1.7 + i);
        c.orb.material.emissiveIntensity = 1.3 + pulse * 0.8 + c.flare * 9;
        c.sp.material.opacity = 0.55 + pulse * 0.3 + c.flare * 1.5; c.sp.scale.setScalar(4.6 + pulse * 1.0 + c.flare * 9);
        c.arcs.visible = c.flare > 0 || Math.random() < 0.55;
        if (arcNow) rebuildArcs(c, t);
      }
    },
    dispose() { for (const c of coils) { scene.remove(c.g); c.arcs.geometry.dispose(); c.arcs.material.dispose(); c.sp.material.dispose(); c.orb.material.dispose(); } geo.dispose(); orbGeo.dispose(); mats.forEach((m) => m.dispose()); },
  };
}
