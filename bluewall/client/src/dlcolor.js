// The Dragonling's colour follows its Lair level (the owner picked four looks, one per stage): the deeper the Lair, the nearer the colour is to deep blue.
//   Lair Lv 12-13  green with a pale-lime belly (the first look)
//   Lair Lv 14-16  emerald-turquoise, orange belly and wing skin, steel-grey horns
//   Lair Lv 17-19  teal, orange belly and wing skin, bone horns
//   Lair Lv 20     deep sea-blue, hot-orange belly and wing skin, sandy horns
export const DL_AT = [12, 14, 17, 20];
const ST = [
  { main: 0x2f9a4c, sec: 0xb7e07a, horn: null },
  { main: 0x19b894, sec: 0xffa534, horn: 0xcfd9e8 },
  { main: 0x13a091, sec: 0xff8a26, horn: 0xe8ddc2 },
  { main: 0x0d86a0, sec: 0xff7a14, horn: 0xdccaa2 },
];
export const dlStage = (L) => { let s = 0; for (let i = 0; i < DL_AT.length; i++) if ((L | 0) >= DL_AT[i]) s = i; return s; };
// paint the (flat-colour) materials of a dragonling scene for a Lair level; safe to call again when the level changes
export function paintDragonling(scene, L) {
  const c = ST[dlStage(L)];
  scene.traverse((o) => {
    if (!o.isMesh || !o.material) return; const m = o.material, n = m.name || '';
    if (/Main/.test(n)) { m.color.set(c.main); m.roughness = 0.58; }
    else if (/Secondary/.test(n)) { m.color.set(c.sec); m.roughness = 0.6; }
    else if (/Horn/.test(n)) {
      if (!m.userData.hc) m.userData.hc = { col: m.color.clone(), met: m.metalness, rou: m.roughness };
      if (c.horn == null) { m.color.copy(m.userData.hc.col); m.metalness = m.userData.hc.met; m.roughness = m.userData.hc.rou; } else { m.color.set(c.horn); m.metalness = 0.3; m.roughness = 0.4; }
    }
  });
}
