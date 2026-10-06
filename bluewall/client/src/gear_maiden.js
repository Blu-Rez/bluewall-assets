// The shieldmaiden hero's look: her hair in the kingdom's blue (the owner's pick from a sample sheet). The model's hair texture is
// silver-white, so the material colour simply tints it. Applied once to the shared glTF before any crowd kind is built from it
// (army.js home guard, bunits.js battle) — crowd.js clones the materials, so the tint must be on the source.
export const MAIDEN_HAIR = 0x2445c8;
export function dressMaiden(gltf) {
  if (!gltf || gltf.scene.userData.bwMaiden) return gltf;
  gltf.scene.userData.bwMaiden = true;
  gltf.scene.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) if (m && /Hair/i.test(m.name || '') && m.color) m.color.setHex(MAIDEN_HAIR); });
  return gltf;
}
