// reach.js — RP1B: the knobs of the owner's hero mode (a walking player sees a few hundred metres, the strategic view the whole map).
// Every value is the neutral one (1 / false) until the hero module changes it, and it puts them all back on exit: the strategic view and every normal player are unchanged.
//   k       multiplies the distances of the meadow's thinning                                                    (assets.js meadowLod; crowd.js is NOT touched — D1 needs it identical — the crowds thin out through the diet's hide radius)
//   dpr     multiplies the render pixel ratio                                                                    (main.js dpr())
//   fog     multiplies the fog density                                                                            (main.js, after the time-of-day sample)
//   upd     world.update runs every `upd`-th drawn frame (the time it missed is added to the next one)           (main.js loop)
//   sh      added to the sun-shadow refresh interval (the shadow map is redrawn every 3rd + sh frame)                (main.js loop)
//   norefl  the moat's planar mirror is switched off (high / ultra only)                                           (main.js loop)
//   nobloom the bloom composer is skipped (the quality governor's last step)                                      (main.js useComposer())
//   cap     RP1C-R2: replaces the preset's pixel-ratio cap (Q.dpr) while the hero is on: her back must be sharp, so the hero's target is min(devicePixelRatio, 2); 0 = the preset's own cap   (main.js dpr())
//   own     RP1C-R2: the hero's own governor is in charge of the resolution: main.js's dynamic resolution (DYN.s) and thermal governor (GOVK) are not multiplied in while it is on          (main.js dpr())
//   lod     RP1C-R2: the castle's full-model radius in metres while the hero is on (0 = castle_tr2.js's own 80 m; the lo model starts 20 m further out)                                    (castle_tr2.js lodPick)
//   life    RP1C-R2 Job 1b: villagers and animals farther than this many metres are not packed / animated while the hero is on (0 = off)                                                       (tr2_life.js)
//   mtx     RP1C-R2 Job 1b: cull.js is running its matrix savings (the nodes that are new since the hero started are updated by it): on the drawn frames between two world updates the scene's own matrix update is skipped   (main.js loop)
export const REACH = { k: 1, dpr: 1, fog: 1, upd: 1, sh: 0, norefl: false, nobloom: false, cap: 0, own: false, lod: 0, life: 0, mtx: false };
