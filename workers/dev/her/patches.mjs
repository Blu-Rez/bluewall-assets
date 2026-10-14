// The exact patches the heraldry worker hands to the integrator (files it does not own). her_build.mjs applies them in memory for testing.
export const PATCHES = {
  'world.js': [
    ["import { Flames, Pools, Flags, Particles, Decals, fireflies } from './fx.js';",
     "import { Flames, Pools, Flags, Particles, Decals, fireflies } from './fx.js';\nimport { Heraldry } from './her_flags.js';"],
    ["const B = new Batcher(), flames = new Flames(), pools = new Pools(), flags = new Flags(), decals = new Decals();",
     "const B = new Batcher(), flames = new Flames(), pools = new Pools(), flags = new Heraldry(B, M), decals = new Decals();   // (her_flags.js: all the castle's cloth + the gate plaque)"],
    [`    banner(x, y, z, ry, w, h) {
      // two single-sided faces back to back: the text reads correctly from both sides
      const g = new THREE.PlaneGeometry(w, h * 1.12);
      B.add(g, M.banner, mat4(x + Math.sin(ry) * 0.02, y - h * 0.06, z + Math.cos(ry) * 0.02, ry));
      B.add(g, M.banner, mat4(x - Math.sin(ry) * 0.02, y - h * 0.06, z - Math.cos(ry) * 0.02, ry + Math.PI));
      B.add(new THREE.CylinderGeometry(0.1, 0.1, w + 0.6, 6), M.wood, mat4(x, y + h / 2 + 0.1, z, ry, 1, 1, 1, 0, Math.PI / 2), { tint: 0x5a3a22 });
    },`,
     `    banner(x, y, z, ry, w, h, o) { flags.banner(x, y, z, ry, w, h, B.tagB, o); },     // waving cloth (her_flags.js); o.tapestry: it hangs against a wall`],
    [`    plaque(x, y, z, face, w, h) {
      const T = plaqueTextures();
      const pm = new THREE.MeshStandardMaterial({ map: T.map, emissive: 0x7fcaff, emissiveMap: T.mask, emissiveIntensity: 1.2, roughness: 0.6, metalness: 0.3 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), pm); pl.position.set(x, y, z); pl.rotation.y = face; scene.add(pl);
      M.plaqueMat = pm;
      B.add(new THREE.BoxGeometry(w + 0.5, h + 0.5, 0.3), M.stoneDark, mat4(x - Math.sin(face) * 0.16, y, z - Math.cos(face) * 0.16, face), { tint: 0x9a8a70 });
    },`,
     `    plaque(x, y, z, face, w, h) { M.plaqueMat = flags.plaque(x, y, z, face, w, h, B.tagB); },    // the realm's name over the gate (her_flags.setGateName)`],
  ],
  'main.js': [
    ["import { setEmblem } from './textures.js';",
     "import { setEmblem } from './textures.js';\nimport { setGateName } from './her_flags.js';"],
    ["  ui.setProfile({ name: opts.name || 'Blꪊe', level: econ.st.level });",
     "  ui.setProfile({ name: opts.name || 'Blꪊe', level: econ.st.level });\n  setGateName(opts.name || 'Blue Wall');                       // the realm's name over the main gate (her_flags.js)"],
  ],
  'battle.js': [
    ["import { setEmblem } from './textures.js';",
     "import { setEmblem } from './textures.js';\nimport { setGateName, gateName } from './her_flags.js';\nlet HOME_GATE = null;                                   // (the home realm's name, while a raid shows the defender's over the gate)"],
    ["if (econ.st.emblem) setEmblem(econ.st.emblem); world.tesla && world.tesla.set((econ.st.own",
     "if (econ.st.emblem) setEmblem(econ.st.emblem); if (HOME_GATE != null) { setGateName(HOME_GATE); HOME_GATE = null; } world.tesla && world.tesla.set((econ.st.own"],
    ["if (target.emblem) setEmblem(target.emblem); world.tesla && world.tesla.set(target.tesla | 0);",
     "if (target.emblem) setEmblem(target.emblem); if (HOME_GATE == null) HOME_GATE = gateName(); setGateName(target.name || ''); world.tesla && world.tesla.set(target.tesla | 0);"],
  ],
};
