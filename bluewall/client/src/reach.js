// reach.js — RP1B: the knobs of the owner's hero mode (a walking player sees a few hundred metres, the strategic view the whole map).
// Every value is the neutral one (1 / false) until the hero module changes it, and it puts them all back on exit: the strategic view and every normal player are unchanged.
//   k       multiplies the distances of the meadow's thinning                                                    (assets.js meadowLod; crowd.js is NOT touched — D1 needs it identical — the crowds thin out through the diet's hide radius)
//   dpr     multiplies the render pixel ratio                                                                    (main.js dpr())
//   fog     multiplies the fog density                                                                            (main.js, after the time-of-day sample)
//   upd     world.update runs every `upd`-th drawn frame (the time it missed is added to the next one)           (main.js loop)
//   sh      added to the sun-shadow refresh interval (the shadow map is redrawn every 3rd + sh frame)                (main.js loop)
//   norefl  the moat's planar mirror is switched off (high / ultra only)                                           (main.js loop)
//   nobloom the bloom composer is skipped (the quality governor's last step)                                      (main.js useComposer())
export const REACH = { k: 1, dpr: 1, fog: 1, upd: 1, sh: 0, norefl: false, nobloom: false };
