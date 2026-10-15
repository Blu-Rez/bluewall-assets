// RP1 — owner-only hero mode.  A plain ES module that main.js loads ONLY when the owner taps the hero button (nothing of this is in the boot bundle).
//   pick a sister -> her `<key>.glb` is fetched (loader with %) -> she stands at the castle gate of the home map; joystick (left half) + look (right half) + buttons;
//   3rd-person camera behind the shoulder (pulled in by walls) or 1st person with the body visible; a glowing door at the foot of the keep -> the underworld test area (rpg_under.js) -> a portal back.
// It uses the game's own data: world.targets (castle / wall / tower / house boxes), nav (water), staticSolids (cottages, mill ...), world.fastHeight.  No game file other than main.js (3 small hooks) is touched.
const SIS = [   // the element is shown by the emblem from the owner's character sheet (e_<key>.png), not by a word; c = its accent colour
  { k: 'elina', n: 'ELINA', c: '#ff6a3a' }, { k: 'elika', n: 'ELIKA', c: '#9fe8ff' }, { k: 'melika', n: 'MELIKA', c: '#7fe06a' },
  { k: 'mobina', n: 'MOBINA', c: '#f0a666' }, { k: 'aylin', n: 'AYLIN', c: '#4fb0ff' }, { k: 'aylar', n: 'AYLAR', c: '#cfeeff' },
];
const GATE_HALF = { outer: 7.5, inner: 4.5, town: 5.2 };
const EDGE_SOFT = 16, EDGE_R = 420;                                        // RP1B: the soft edge of the walkable map (was a hard 335 m circle that shut out the outer mills, mines and hamlets)
const HS = 1.12, HC = 1.06;                                                                                 // RP1C-R2 Job 9: the owner's «a bit bigger»: everything that depends on her size follows ONE factor (the model, the body radius, the camera pivot, the speeds + strides = the same cadence; the camera's DISTANCE follows with HC = 1.06 only: with the full 1.12 the picture on the screen would be exactly the old one — she would only be bigger next to the houses)
const HERO_H = 1.75 * HS, MODEL_H = 0.98, SC = HERO_H / MODEL_H, CAM_D = 3.6 * HC;
const R_BODY = 0.45 * HS, WALK = 1.18 * HS, RUN = 4.39 * HS, SPRINT_K = 1.28, STRIDE_W = 2.75 * HS, STRIDE_R = 5.49 * HS;      // (STRIDE_R = the run clip's stride before RP1C-R2 Job 5; GAIT.sr below is the measured one)
const GAIT = { sw: STRIDE_W, sr: 5.1 * HS, off: -0.12, acc: 16, dec: 16 };                                    // RP1C-R2 Job 5: the cycle's stride per clip (m of ground per cycle), the run clip's phase offset against the walk clip (cycles), (dev: window.__rp.gait({...}) while measuring)
const GRAV = 22, JUMP_V = 5, JUMP_T = 0.40;                                   // RP1C-R2 Job 7: a hop of 0.57 m that is 0.45 s in the air (was JUMP_V 7 = 1.11 m, 0.64 s); the jump clip is stretched over JUMP_T = the rise + the start of the fall, then fall (a few frames), then land
// HOTFIX47: Telegram's fullscreen header sits ABOVE env(safe-area-inset-top): the game's own UI adds --tg-content-safe-area-inset-top, the hero HUD did not -> the exit button was under the header.
const TOP = 'max(env(safe-area-inset-top,0px),calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px)))', BOT = 'max(env(safe-area-inset-bottom,0px),calc(var(--tg-safe-area-inset-bottom,0px) + var(--tg-content-safe-area-inset-bottom,0px)))';
let CLIMB_ON = false;                                                                // HOTFIX47: wall climbing is OFF until the castle has real stairs / a climb clip (owner: the stand-in pose looks terrible); dev.setClimb(true) turns it on for the tests
const WSURF = -0.75, SWIM_DEEP = 0.95, SWIM_V = 1.9, CLIMB_V = 1.5;           // RP1B: the water surface of the moat / rivers / lake (nav.js: «the surface sits at -0.75»), the depth at which she swims, swim and climb speeds
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const kExp = (rate, dt) => 1 - Math.exp(-rate * dt);                                                            // RP1C-R2: a smoothing step that does not depend on the frame rate (the old `min(1, dt * rate)` follows 30 % tighter at 20 fps than at 60)
const wrapPi = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };

// RP1C-R2 — THE FACE RULE (the owner: «the face must NEVER be visible; when I turn the camera she turns too; her back must look good»).  Third person: the camera is always behind her.
//   · her body yaw follows the CAMERA's yaw (exp. smoothing, 95 % in 0.25 s) — standing, walking, running, jumping, swimming, rolling; a push to the side turns her at most `lean` towards it;
//   · a push towards the camera is not «turn round and show the face»: she keeps her back to it and walks BACKWARDS (the `walk` clip played in reverse, 0.6 x speed, no sprint) — with her facing opposite to her motion
//     a time-reversed walk keeps the feet on the ground; a roll towards the camera is the same, reversed;
//   · anything that turns her BY ITSELF (the combat sim: attack / block / skill, the wall climb) pulls the camera round after her (`chase`), so the camera never ends up in front;
//   · whatever happens, in every frame |body - camera| <= `hard` (the guard); first person is excluded.   All angles in radians.
export const FACE = {
  lean: 0.5236,                                                      // 30°: how far the body may turn towards a sideways / diagonal push (the rule is < 35° once settled)
  turn: 12,                                                          // 1/s: the body's pull to the camera (time constant 83 ms: 95 % in 0.25 s)
  bodyMax: 0.96,                                                     // 55°: the body never lags the camera by more than this, whatever the drag speed
  hard: 1.2217, soft: 0.5236, chase: 8,                              // the guard: 70° absolute (the brief's 75°), and the camera is pulled to within 30° of a body something else turned
  backOn: 1.95, backOff: 1.43,                                       // 112° / 82°: a push (or a velocity) this far from the camera's forward is «backwards» (hysteresis)
  minV: 0.25, backK: 0.6, backV: 1.9,                                // below 0.25 m/s she simply faces the camera; backwards: 0.6 x the speed, at most 1.9 m/s, no sprint
};
// which way the body should face, relative to the camera yaw `c`, for a motion (vx, vz): { off: radians from the camera's forward, back: moving backwards (the clip plays in reverse) }
export function faceTarget(c, vx, vz, back0) {
  if (Math.hypot(vx, vz) < FACE.minV) return { off: 0, back: false };
  const rel = wrapPi(Math.atan2(vx, vz) - c), a = Math.abs(rel), back = back0 ? a > FACE.backOff : a > FACE.backOn;
  return { off: clamp(back ? wrapPi(rel - Math.PI) : rel, -FACE.lean, FACE.lean), back };
}
// the pure steps (state = { camYaw, body, bk }): rpg.js runs them on S, dev/rp1c2_face.mjs sweeps them without a browser — one implementation, two users
export function faceGuard(s, dt, k) {                                                   // something else turned her (combat sim, wall climb): the camera comes round after her, and never lags beyond `hard`
  let d = wrapPi(s.body - s.camYaw), a = Math.abs(d);
  if (a > FACE.soft) s.camYaw += Math.sign(d) * (a - FACE.soft) * Math.min(1, dt * k);
  d = wrapPi(s.body - s.camYaw); a = Math.abs(d); if (a > FACE.hard) s.camYaw = s.body - Math.sign(d) * FACE.hard;
}
export function faceLoco(s, dt, vx, vz) {                                                // free movement: the body follows the camera (+ at most `lean` towards the push; backwards = back-pedal)
  const f = faceTarget(s.camYaw, vx, vz, s.bk === 1); s.bk = f.back ? 1 : 0;
  s.body += wrapPi(s.camYaw + f.off - s.body) * (1 - Math.exp(-FACE.turn * dt));
  const d = wrapPi(s.body - s.camYaw); if (d > FACE.bodyMax) s.body = s.camYaw + FACE.bodyMax; else if (d < -FACE.bodyMax) s.body = s.camYaw - FACE.bodyMax;
}

const CSS = `
.rp-on>*:not(canvas):not(.rp-k){visibility:hidden!important}
.rp-on .bsh.on,.rp-on .bsh-dlg.on,.rp-on .bsh-lbl.on,.rp-on .bw-toast.on{visibility:visible!important}
.rp-sheet .rp-touch,.rp-sheet .rp-joy,.rp-on:has(.bsh.on) .rp-touch,.rp-on:has(.bsh.on) .rp-joy{display:none!important}
.rp-sheet .rp-b,.rp-sheet .rp4-b,.rp-on:has(.bsh.on) .rp-b,.rp-on:has(.bsh.on) .rp4-b{visibility:hidden!important;pointer-events:none!important}
.rp-k{font-family:Vazirmatn,system-ui,sans-serif;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none}
.rp-touch{position:absolute;inset:0;z-index:40;touch-action:none}
.rp-joy{position:absolute;z-index:41;width:124px;height:124px;margin:-62px 0 0 -62px;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle,rgba(40,46,54,.18),rgba(20,24,30,.42));box-shadow:0 0 14px rgba(61,245,224,.22),inset 0 0 18px rgba(255,255,255,.05);pointer-events:none;display:none}
.rp-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(235,240,246,.75),rgba(120,130,142,.55));border:1.5px solid rgba(61,245,224,.8);box-shadow:0 0 12px rgba(61,245,224,.45)}
.rp-b{position:absolute;z-index:42;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#e6ecf2;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.2),inset 0 0 14px rgba(255,255,255,.07),0 3px 10px rgba(0,0,0,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);transition:transform .08s,box-shadow .12s,border-color .12s,opacity .15s}
.rp-b::after{content:"";position:absolute;inset:5px;border-radius:50%;border:1px solid rgba(205,214,224,.18)}
.rp-b svg{width:46%;height:46%;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px rgba(61,245,224,.7))}
.rp-b.on{transform:scale(.92);color:#3df5e0;border-color:#3df5e0;box-shadow:0 0 20px rgba(61,245,224,.65),inset 0 0 16px rgba(61,245,224,.22)}
.rp-perf{position:absolute;z-index:43;top:calc(${TOP} + 12px);left:62px;max-width:calc(100% - 72px);padding:2px 6px;border-radius:6px;background:rgba(5,15,25,.62);color:#aef;font:10px/1.3 ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden;direction:ltr;text-align:left;pointer-events:none;display:none}
.rp-pick{position:absolute;inset:0;z-index:90;background:radial-gradient(120% 90% at 50% 0%,#12354a 0%,#07111d 70%);display:flex;flex-direction:column;align-items:center;justify-content:safe center;color:#e8fffb;overflow:auto}
.rp-pick h2{margin:calc(${TOP} + 14px) 0 2px;font-size:21px;font-weight:900}
.rp-pick p{margin:0 0 10px;font-size:12px;opacity:.7}
.rp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 10px;width:min(92vw,820px);padding:6px 0 28px}
@media (orientation:landscape){.rp-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}}
.rp-card{position:relative;border-radius:15px;cursor:pointer;border:1.5px solid rgba(205,214,224,.32);background:#222;box-shadow:0 5px 16px rgba(0,0,0,.55);transition:transform .12s,box-shadow .15s,border-color .15s}
.rp-card:active,.rp-card.sel{transform:translateY(-3px);border-color:var(--ac);box-shadow:0 0 20px var(--ac),0 5px 16px rgba(0,0,0,.55)}
.rp-art{aspect-ratio:4/5;border-radius:13px;overflow:hidden}.rp-art img{display:block;width:100%;height:100%;object-fit:cover}
.rp-em{position:absolute;left:50%;bottom:-19px;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:rgba(6,12,20,.92);border:1.5px solid var(--ac);box-shadow:0 0 12px var(--ac);display:flex;align-items:center;justify-content:center}
.rp-em img{width:23px;height:23px;object-fit:contain;filter:drop-shadow(0 0 4px var(--ac))}
.rp-x{position:absolute;left:12px;top:calc(${TOP} + 10px);width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.2);display:flex;align-items:center;justify-content:center;color:#e6ecf2;padding:0}
.rp-x svg{width:46%;height:46%;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;filter:drop-shadow(0 0 4px rgba(61,245,224,.7))}

`;

export function create(H) {
  const T = H.THREE, { renderer, scene, camera, root, ctl, world, L } = H;
  const BASE = H.base, V = H.v || '';
  const dev = !!H.dev;
  const api = { active: false, dev: {} };
  const S = {
    key: null, where: 'home', mode: 'third', paused: false, fixed: 0,
    x: 0, y: 0, z: 0, vx: 0, vz: 0, vy: 0, grounded: true, yaw: 0, pitch: 0.18, camYaw: 0, body: 0,
    st: 'loco', stT: 0, dodgeCool: 0, cool: 0, phase: 0, speed: 0, sprint: false,
    inp: { x: 0, y: 0 }, keys: new Set(), pivot: new T.Vector3(), camD: CAM_D, burst: { x: 0, z: 0 },
    saved: null, models: {}, hero: null, door: null, under: null, nav: null, boxes: [], discs: [], solids: [], hdiscs: [], cache: 0, unT: 0.5, stuck: 0, layer: 0, top: null, climb: null, sw: 0, near: null, nearT: 0, sheetOn: false, rib: -1, cHold: 0, dHold: 0, lean: 0, climbV: 0, auto: null, act: null, joyOn: false, nearK: '', bk: 0, bkS: false,   // RP1C-R2: bk = she is moving backwards (the reversed clip), bkS = the stick points towards the camera
  };
  let hudEl = null, pickEl = null, perfEl = null, styleEl = null, joyEl = null, knobEl = null, btns = {}, diet = null, cull = null, doors = null, foot = null;
  const stats = { f: [], t: 0, n: 0, fps: 0, p95: 0, calls: 0, tris: 0, progs: 0, pr: 0, txt: '', open: false, prev: false };

  // ------------------------------------------------------------------ collision data (home map)
  const gateBoxes = (t) => {                                  // a gate target is ONE box across the whole gatehouse: the arch passage is cut out of it
    const gh = GATE_HALF[t.ringId] || 5.2, cs = Math.cos(t.rot), sn = Math.sin(t.rot), hw = t.w / 2, side = (hw - gh) / 2;
    if (side <= 0.2) return [];
    return [-1, 1].map((s) => { const c = s * (gh + side); return { x: t.x + cs * c, z: t.z - sn * c, hw: side, hd: t.d / 2, rot: t.rot, h: t.h, type: 'gate', id: t.id }; });
  };
  function refreshColliders() {
    const out = [], vis = (world.rings && world.rings.state) ? world.rings.state().vis : {};
    for (const t of world.targets || []) {
      if (t.dead || t.down || t.destroyed) continue;
      if (t.ringId && vis[t.ringId] === false) continue;
      if (t.type === 'house') continue;                                              // RP1B: a 'house' target is a ~26 m BLOCK of houses (one battle target, up to 50 x 50 m): the houses themselves come from the picks below
      if (t.type === 'gate') { out.push(...gateBoxes(t)); continue; }
      out.push({ x: t.x, z: t.z, hw: t.w / 2, hd: t.d / 2, rot: t.rot || 0, h: t.h || 6, type: t.type, id: t.id });
    }
    for (const b of out) { b.ux = Math.cos(b.rot); b.uz = -Math.sin(b.rot); b.vx = Math.sin(b.rot); b.vz = Math.cos(b.rot); b.R2 = (b.hw + b.hd + 2.5) ** 2; }
    S.boxes = out; S.cache = performance.now();
    // every house / cottage has its own tap box (world.picks id 'house': centre + half-size r): a disc of about its footprint.  Read from the game's own list each time, never cached constants.
    const hd = [];
    for (const p of world.picks || []) {
      if (p.id !== 'house') continue; const b = p.box, r = (b.max.x - b.min.x) / 2; if (!(r > 0.8)) continue;
      hd.push([(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2, r < 7 ? r * 1.12 : r * 0.85]);
    }
    S.discs = (S.solids || []).concat(hd); S.hdiscs = hd;
  }
  function ensureHome() {
    if (!S.nav) { S.nav = H.buildNav({ height: world.fastHeight, bridges: H.bridgesFromLayout(L), solids: H.staticSolids() }); S.solids = H.staticSolids(); S.discs = S.solids; }
    refreshColliders();
  }
  // RP1C-R2 (Job 4): her ground is the terrain / bridge height (nav) and, on the cobbled streets + the market disc, the height of the VISIBLE ribbon mesh (rpg_foot.js: the triangles of the real `streets` object)
  const CONTACT = { rigid: true, rib: true };                                                   // (dev switches: the old behaviour for before / after numbers)
  const baseGround = (x, z) => S.nav.groundY(x, z, world.fastHeight(x, z));
  const homeGround = (x, z) => { const g = baseGround(x, z); if (foot && CONTACT.rib) { const y = foot.surf.height(x, z); if (y > g && y - g < 0.5) return y; } return g; };
  // Water (RP1B).  She is never stopped by water: shallow (< 0.95 m) she wades, deeper she swims.  `wetHero` = DEEP water, for the reach tools only (a bridge deck spans it, parapet to parapet);
  // the game's own nav.isWet is made for soldiers (1.1 m off every shore, a bridge corridor 2.2 m narrower than the deck) and is not used for her.
  function wetHero(x, z) {
    if (world.fastHeight(x, z) >= WSURF - SWIM_DEEP) return false;
    for (const b of S.nav.bridges) { const dx = x - b.x, dz = z - b.z, u = dx * b.nx + dz * b.nz, v = dx * b.tx + dz * b.tz; if (Math.abs(u) <= b.len / 2 + 1 && Math.abs(v) <= b.wid / 2 - 0.35) return false; }
    return true;
  }
  function waterDepth(x, z) {                                                       // metres of water over the ground here (0 = dry); 0 on a bridge deck
    const th = world.fastHeight(x, z); if (th >= WSURF) return 0;
    if (S.nav.groundY(x, z, th) - th > 0.4 && S.y > WSURF + 0.3) return 0;
    return WSURF - th;
  }
  const homeWorld = {
    ground: (x, z) => homeGround(x, z),
    wet: (x, z) => wetHero(x, z),
    boxes: () => S.boxes, discs: () => S.discs,
    inside: (x, z) => Math.hypot(x, z) < EDGE_R,
  };
  let underWorld = null;
  const W = () => (S.where === 'under' ? underWorld : homeWorld);

  // push a circle (radius r) out of the boxes and discs; returns true when it moved
  function pushOut(p, r, wd) {
    let moved = false;
    for (let it = 0; it < 3; it++) {
      let any = false;
      for (const b of wd.boxes()) {
        const dx = p.x - b.x, dz = p.z - b.z; if (dx * dx + dz * dz > b.R2) continue;
        const lx = dx * b.ux + dz * b.uz, lz = dx * b.vx + dz * b.vz, cx = clamp(lx, -b.hw, b.hw), cz = clamp(lz, -b.hd, b.hd), ox = lx - cx, oz = lz - cz, d2 = ox * ox + oz * oz;
        if (d2 >= r * r) continue;
        let nx, nz, pen;
        if (d2 > 1e-8) { const d = Math.sqrt(d2); nx = ox / d; nz = oz / d; pen = r - d; }
        else { const px = b.hw - Math.abs(lx), pz = b.hd - Math.abs(lz); if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; pen = px + r; } else { nx = 0; nz = Math.sign(lz) || 1; pen = pz + r; } }
        p.x += (nx * b.ux + nz * b.vx) * pen; p.z += (nx * b.uz + nz * b.vz) * pen; any = true;
      }
      for (const [sx, sz, sr] of wd.discs()) {
        const dx = p.x - sx, dz = p.z - sz, rr = sr + r, d2 = dx * dx + dz * dz; if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 1e-4; p.x += (dx / d) * (rr - d); p.z += (dz / d) * (rr - d); any = true;
      }
      if (!any) break; moved = true;
    }
    return moved;
  }
  // can a body stand here? (used by the reachability check and by moves)
  function free(x, z, wd = W(), swim = false) { const p = { x, z }; if (!swim && wd.wet && wd.wet(x, z)) return false; if (!wd.inside(x, z)) return false; return !pushOut(p, R_BODY - 0.02, wd); }

  function tryMove(dx, dz) {
    const wd = W(); const p = { x: S.x + dx, z: S.z + dz };
    pushOut(p, R_BODY, wd);
    const [cx, cz] = wd.clampXZ ? wd.clampXZ(p.x, p.z) : [p.x, p.z]; p.x = cx; p.z = cz;
    if (S.where === 'home') { const rr = Math.hypot(p.x, p.z); if (rr > EDGE_R - 0.05) { const k = (EDGE_R - 0.05) / rr; p.x *= k; p.z *= k; } }       // the edge of the map: she slides along it
    if (!wd.inside(p.x, p.z)) return;
    if (S.grounded) {                                                                // no climbing: a rise steeper than ~40 degrees stops the move
      const run = Math.hypot(p.x - S.x, p.z - S.z), sw2 = S.sw === 2 && S.where === 'home', rise = (sw2 ? world.fastHeight(p.x, p.z) : wd.ground(p.x, p.z)) - (sw2 ? Math.max(S.y, WSURF) : S.y);   // (swimming: she pulls herself out over a bank up to ~1.1 m above the water)
      if (run > 1e-4 && rise > 0.85 * run + 0.06 + (sw2 ? 1.1 : 0)) return;
    }
    S.x = p.x; S.z = p.z;
  }

  // stuck-proof: a body inside a collider for a second (a building moved by the layout editor, a bad spawn) is put on the nearest free spot; nothing free within 60 m -> the gate
  function unstick() {
    if (S.where !== 'home' || !S.grounded || S.st === 'dodge' || S.layer !== 0) { S.stuck = 0; return false; }
    if (free(S.x, S.z, W(), true)) { S.stuck = 0; return false; }
    if (++S.stuck < 2) return false; S.stuck = 0;
    for (let r = 0.5; r <= 60; r += 0.5) for (let a = 0; a < 6.2832; a += 0.3) { const x = S.x + Math.cos(a) * r, z = S.z + Math.sin(a) * r; if (free(x, z, W(), true)) { S.x = x; S.z = z; S.y = homeGround(x, z); S.vx = S.vz = 0; S.snap = true; return true; } }
    toGate(); return true;
  }
  function toGate() {                                                              // the castle gate of HIS map: just inside, facing the keep (the spawn, and the «back to the gate» button)
    const G = L.GATE, k = (world.targets || []).find((t) => t.type === 'keep') || { x: 0, z: 0 };
    const p = { x: G.x - G.nx * 9, z: G.z - G.nz * 9 }; pushOut(p, R_BODY + 0.1, homeWorld);
    S.where = 'home'; S.layer = 0; S.top = S.climb = null; S.sw = 0; S.x = p.x; S.z = p.z; S.y = homeGround(S.x, S.z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; S.stT = 0;
    S.camYaw = Math.atan2(k.x - S.x, k.z - S.z); S.body = S.camYaw; S.pitch = 0.2; S.snap = true; S.camD = CAM_D; S.cool = Math.max(S.cool, 0.5);
  }

  // ------------------------------------------------------------------ the door at the foot of the keep
  function buildDoor() {
    const k = (world.targets || []).find((t) => t.type === 'keep'); if (!k) return null;
    const cs = Math.cos(k.rot || 0), sn = Math.sin(k.rot || 0), faces = [[cs, -sn, k.w / 2], [-cs, sn, k.w / 2], [sn, cs, k.d / 2], [-sn, -cs, k.d / 2]];
    const gx = L.GATE ? L.GATE.x : 49, gz = L.GATE ? L.GATE.z : 26, tx = gx - k.x, tz = gz - k.z, tl = Math.hypot(tx, tz) || 1;
    let best = faces[0], bd = -9; for (const f of faces) { const d = (f[0] * tx + f[1] * tz) / tl; if (d > bd) { bd = d; best = f; } }
    const off = (H.doorOff != null ? H.doorOff : 0.5), nx = best[0], nz = best[1], cx = k.x + nx * (best[2] + off), cz = k.z + nz * (best[2] + off);
    const gy = homeGround(cx, cz);
    const grp = new T.Group(); grp.position.set(cx, gy, cz); grp.rotation.y = Math.atan2(nx, nz);
    const tex = (draw, w = 128, h = 256) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
    const glowT = tex((g, w, h) => { const a = g.createLinearGradient(0, h, 0, 0); a.addColorStop(0, 'rgba(120,255,240,1)'); a.addColorStop(0.5, 'rgba(40,200,210,.85)'); a.addColorStop(1, 'rgba(30,120,200,.55)'); g.fillStyle = a; g.fillRect(0, 0, w, h); const b = g.createLinearGradient(0, 0, w, 0); b.addColorStop(0, 'rgba(0,0,0,.55)'); b.addColorStop(0.5, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = b; g.fillRect(0, 0, w, h); });
    const beamT = tex((g, w, h) => { const a = g.createLinearGradient(0, h, 0, 0); a.addColorStop(0, 'rgba(120,255,240,.9)'); a.addColorStop(1, 'rgba(120,255,240,0)'); g.fillStyle = a; g.fillRect(0, 0, w, h); }, 16, 128);
    const plane = new T.Mesh(new T.PlaneGeometry(2.7, 4.2), new T.MeshBasicMaterial({ map: glowT, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); plane.position.set(0, 2.1, 0); grp.add(plane);
    const fm = new T.MeshBasicMaterial({ color: 0x45f0dc }), dark = new T.MeshBasicMaterial({ color: 0x0a2430 });
    const post = (x, w, h, y, m = fm) => { const b = new T.Mesh(new T.BoxGeometry(w, h, 0.35), m); b.position.set(x, y, 0.05); grp.add(b); };
    post(-1.5, 0.3, 4.5, 2.25); post(1.5, 0.3, 4.5, 2.25); post(0, 3.3, 0.3, 4.4);
    for (let i = 0; i < 3; i++) { const s = new T.Mesh(new T.BoxGeometry(3.6 + i * 0.7, 0.14, 0.7), i === 2 ? fm : dark); s.position.set(0, 0.07 + (2 - i) * 0.0, 0.5 + i * 0.7); s.scale.y = 1; s.position.y = 0.07; grp.add(s); }
    const beam = new T.Mesh(new T.CylinderGeometry(1.5, 1.9, 26, 20, 1, true), new T.MeshBasicMaterial({ map: beamT, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, opacity: 0.55 })); beam.position.set(0, 13, 0.1); grp.add(beam);
    return { grp, x: cx, z: cz, y: gy, nx, nz, R: 1.7, planeMat: plane.material };
  }

  // ------------------------------------------------------------------ hero model + animation
  async function loadHero(key, lv) {
    if (S.models[key]) return S.models[key];
    const url = BASE + 'rpg/' + key + '.glb' + V;
    const res = await fetch(url); if (!res.ok) throw new Error('hero ' + res.status);
    const total = +res.headers.get('content-length') || 2.7e6; let buf;
    if (res.body && res.body.getReader) {
      const rd = res.body.getReader(), parts = []; let got = 0;
      for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; lv.progress(Math.min(0.85, (got / total) * 0.85)); }
      buf = new Uint8Array(got); let o = 0; for (const p of parts) { buf.set(p, o); o += p.length; } buf = buf.buffer;
    } else { buf = await res.arrayBuffer(); lv.progress(0.85); }
    const gltf = await H.parseGLB(buf, BASE + 'rpg/'); lv.progress(0.95, 'Preparing…');
    const model = gltf.scene, grp = new T.Group(); model.scale.setScalar(SC); grp.add(model);
    const aniso = Math.min(8, renderer.capabilities && renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);      // RP1C-R2: her back is seen at a slant and from 3.6 m: anisotropic filtering keeps the texture sharp
    model.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.frustumCulled = false; o.castShadow = true; o.receiveShadow = true;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) { for (const k in m) { const t = m[k]; if (t && t.isTexture && t.anisotropy < aniso) { t.anisotropy = aniso; t.needsUpdate = true; } } mipBias(m); }
      }
    });
    const blob = new T.Mesh(blobGeo(), blobMat()); blob.renderOrder = 3; blob.frustumCulled = false; blob.castShadow = blob.receiveShadow = false; blob.userData.rpHero = true; grp.add(blob);       // Job 9: a crisp contact shadow under the feet (the sun's map is 4 cm texels + PCF = soft)
    const mixer = new T.AnimationMixer(model), acts = {};
    for (const n of ['idle', 'walk', 'run', 'jump', 'fall', 'land', 'dodge', 'swim', 'climb', 'interact']) {
      const clip = gltf.animations.find((a) => a.name === n); if (!clip) { if (n !== 'swim' && n !== 'climb' && n !== 'interact') console.warn('rpg: no clip', n); continue; }       // (swim / climb: used when the model has them, a stand-in pose otherwise)
      const a = mixer.clipAction(clip); a.timeScale = 0; a.setEffectiveWeight(0); a.play(); acts[n] = { a, d: clip.duration, w: 0 };
    }
    const head = model.getObjectByName('Head') || model.getObjectByName('head');
    return (S.models[key] = { grp, model, mixer, acts, head, blob, clips: gltf.animations }); // RP4: + clips (slash_a/b/c, heavy, block, hit, knockdown, death, cast)
  }
  // ---- RP1C-R2 Job 9: sharper — (a) a negative mip bias on the diffuse sampler of HER materials only (the world's materials are never touched; her programs are the same count, one per material as before),
  //      (b) a crisp contact shadow: one dark radial disc under the feet, tilted to the slope, shrinking while she is in the air.  The material is a plain MeshBasicMaterial (no light, no new program: counted in the proof).
  const MIPB = -0.45;
  function mipBias(m) {
    if (!m || !m.map || m.userData.rpBias || !T.ShaderChunk || !/texture2D\(\s*map,\s*vMapUv\s*\)/.test(T.ShaderChunk.map_fragment)) return; m.userData.rpBias = 1;
    const chunk = T.ShaderChunk.map_fragment.replace(/texture2D\(\s*map,\s*vMapUv\s*\)/, 'texture2D( map, vMapUv, ' + MIPB.toFixed(2) + ' )');
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', chunk); };
    m.customProgramCacheKey = () => 'rpb'; m.needsUpdate = true;
  }
  let _bg = null, _bm = null;
  const blobGeo = () => _bg || (_bg = new T.PlaneGeometry(1.5 * HS, 1.5 * HS).rotateX(-Math.PI / 2));
  const blobMat = () => {
    if (_bm) return _bm;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.62)'); g.addColorStop(0.45, 'rgba(0,0,0,0.42)'); g.addColorStop(0.78, 'rgba(0,0,0,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace || tex.colorSpace;
    _bm = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });          // (the parameters of the door's glow plane: the SAME program, +0 programs; polygonOffset is GL state, not part of a program)
    return _bm;
  };
  const _bq = new T.Quaternion(), _bu = new T.Vector3(0, 1, 0), _bn = new T.Vector3();
  function placeBlob(h) {                                                                                    // (called every frame after the model is placed)
    const b = h.blob; if (!b) return; const e = 0.45, wd = W(), g = (x, z) => wd.ground(x, z);
    const gx = (g(S.x + e, S.z) - g(S.x - e, S.z)) / (2 * e), gz = (g(S.x, S.z + e) - g(S.x, S.z - e)) / (2 * e);
    _bn.set(-gx, 1, -gz).normalize(); _bq.setFromUnitVectors(_bu, _bn); const y = h.grp.rotation.y; b.quaternion.copy(_bq); b.rotateOnWorldAxis(_bu, -y);      // world tilt, undone for the group's own yaw
    const gy = g(S.x, S.z), air = Math.max(0, S.y - gy); b.position.y = gy - S.y + 0.03; b.scale.setScalar(Math.max(0.45, 1 - air * 0.7)); b.visible = S.layer === 0 && S.sw !== 2;
  }
  const setW = (name, w) => { const o = S.hero.acts[name]; if (o) o.tw = w; };
  function animate(dt) {
    const h = S.hero, A = h.acts; if (!A.idle) return;
    for (const n in A) A[n].tw = 0;
    const v = S.speed;
    if (S.act && (S.speed > 0.3 || !A.interact)) S.act = null;
    if (S.act && S.layer === 0 && S.sw !== 2) { const c = A.interact; c.tw = 1; c.a.time = Math.min(c.d - 0.001, S.act.t); S.act.t += dt; if (S.act.t >= c.d) S.act = null; A.idle.a.time = (A.idle.a.time + dt) % A.idle.d; }      // RP1C: the `interact` clip at a door
    else if (S.layer === 'climb' && S.climb) {                                                            // climbing: the real `climb` clip when the model has one, else the walk cycle paced to her hands
      const cv = Math.abs(S.climb.vy), mv = clamp(cv / 0.4, 0, 1), cl = A.climb;
      if (cl) { cl.tw = mv > 0.02 ? 1 : 0; cl.a.time = (cl.a.time + dt * Math.sign(S.climb.vy || 1) * mv + cl.d) % cl.d; A.idle.tw = mv > 0.02 ? 0 : 1; }
      else { if (A.walk) { A.walk.tw = mv; S.phase = (S.phase + ((cv * 1.5) / STRIDE_W) * dt) % 1; A.walk.a.time = S.phase * A.walk.d; } A.idle.tw = 1 - mv; }
      A.idle.a.time = (A.idle.a.time + dt) % A.idle.d;
    } else if (S.sw === 2) {                                                                          // swimming: the real `swim` clip when there is one, else the walk cycle (arms + legs) with the body leaned over
      const sv = Math.hypot(S.vx, S.vz), mv = clamp(sv / 0.5, 0, 1), sc = A.swim;
      if (sc) { sc.tw = 1; sc.a.time = (sc.a.time + dt * (0.4 + mv)) % sc.d; }
      else { if (A.walk) { A.walk.tw = mv; S.phase = (S.phase + ((0.6 + sv * 1.2) / STRIDE_W) * dt) % 1; A.walk.a.time = S.phase * A.walk.d; } A.idle.tw = 1 - mv; A.idle.a.time = (A.idle.a.time + dt) % A.idle.d; }
    } else if (S.st === 'loco') {
      const wr = clamp((v - WALK) / (RUN - WALK), 0, 1), ww = v < WALK ? clamp(v / WALK, 0, 1) : 1 - wr, wi = v < WALK ? 1 - ww : 0;
      A.idle.tw = wi; if (A.walk) A.walk.tw = ww * (1 - wr); if (A.run) A.run.tw = wr;
      const rate = (A.walk ? (A.walk.tw * v / GAIT.sw) : 0) + (A.run ? (A.run.tw * v / GAIT.sr) : 0), tw = (A.walk ? A.walk.tw : 0) + (A.run ? A.run.tw : 0);
      if (tw > 0.01) S.phase = (S.phase + (S.bk ? -1 : 1) * (rate / tw) * dt + 1) % 1;                                 // (RP1C-R2: backwards = the cycle played in reverse)
      if (A.walk) A.walk.a.time = S.phase * A.walk.d; if (A.run) A.run.a.time = (((S.phase + GAIT.off) % 1) + 1) % 1 * A.run.d;                  // (RP1C-R2: the two clips share ONE phase; the run clip is shifted so that its left heel-strike falls on the walk clip's)
      A.idle.a.time = (A.idle.a.time + dt) % A.idle.d;
    } else if (S.st === 'jump') { if (A.jump) { A.jump.tw = 1; A.jump.a.time = Math.min(A.jump.d - 0.001, S.stT * (A.jump.d / JUMP_T)); } }
    else if (S.st === 'fall') { if (A.fall) { A.fall.tw = 1; A.fall.a.time = (S.stT % A.fall.d); } }
    else if (S.st === 'land') { if (A.land) { A.land.tw = 1; A.land.a.time = Math.min(A.land.d - 0.001, S.stT * 2.2); } }
    else if (S.st === 'dodge') { if (A.dodge) { A.dodge.tw = 1; const ct = Math.min(A.dodge.d - 0.001, S.stT * 1.9); A.dodge.a.time = S.bk ? Math.max(0, Math.min(A.dodge.d - 0.001, 1.7) - ct) : ct; } }
    let sum = 0; const k = kExp(9.09, dt);
    for (const n in A) { const o = A[n]; o.w += (o.tw - o.w) * k; sum += o.w; }
    for (const n in A) { const o = A[n]; o.a.setEffectiveWeight(sum > 1e-4 ? o.w / sum : (n === 'idle' ? 1 : 0)); }
    const leanT = S.sw === 2 ? (Math.hypot(S.vx, S.vz) > 0.3 ? 1.3 : 0.18) : 0; S.lean += (leanT - S.lean) * kExp(6, dt); h.model.rotation.x = S.lean;   // (swimming stand-in: the body leans into the water)
    h.mixer.update(0);
    if (S.mode === 'first' && h.head) { h.head.scale.setScalar(0.001); } else if (h.head) h.head.scale.setScalar(1);
  }

  // ------------------------------------------------------------------ walls (RP1B): climb a face, walk the wall-walk between the merlons, climb down
  // Geometry from the game's own wall targets (castle.js wallRun): body H high, walkway slab on top, merlons 0.7 m thick on both edges.  Towers, gatehouses and the keep are not climbed (roofs).
  const wallOf = (b) => b.type === 'wall' && b.h >= 2.4;
  const topY = (b) => b.h + 0.145;
  const latMax = (b) => Math.max(0.35, b.hd - 0.7 - 0.3);
  const loc = (b, x, z) => { const dx = x - b.x, dz = z - b.z; return [dx * b.ux + dz * b.uz, dx * b.vx + dz * b.vz]; };
  const wrd = (b, u, v) => [b.x + u * b.ux + v * b.vx, b.z + u * b.uz + v * b.vz];
  const ease = (t) => t * t * (3 - 2 * t);
  function wallFace(dx, dz) {                                                       // a wall face right ahead (within reach of her hands) that she pushes into
    for (const b of S.boxes) {
      if (!wallOf(b)) continue; const ex = S.x - b.x, ez = S.z - b.z; if (ex * ex + ez * ez > b.R2) continue;
      const [u, v] = loc(b, S.x, S.z), s = v < 0 ? -1 : 1, gap = Math.abs(v) - b.hd;
      if (gap > R_BODY + 0.22 || gap < -0.3 || Math.abs(u) > b.hw - 0.5) continue;
      if (-s * (dx * b.vx + dz * b.vz) < 0.5) continue;
      return { b, s, u };
    }
    return null;
  }
  const hug = (b, y, gy) => b.hd + 0.28 + 0.52 * (1 - clamp((y - gy - 1.0) / 0.4, 0, 1));            // the plinth (1.2 m, 0.7 m proud of the face) keeps her feet off the wall until she is above it
  function startClimb(f) { S.layer = 'climb'; S.climb = { b: f.b, s: f.s, u: f.u, auto: false, vy: 0, mt: null, dir: 0 }; S.vx = S.vz = 0; S.grounded = true; S.st = 'loco'; S.cHold = S.dHold = 0; S.vy = 0; }
  function climbStep(dt, dx, dz, m) {
    const c = S.climb, b = c.b, s = c.s, ny = [s * b.vx, s * b.vz], top = topY(b), lm = latMax(b);
    S.vx = S.vz = 0; S.speed = 0; S.body = Math.atan2(-ny[0], -ny[1]);
    S.camYaw += wrapPi(S.body - S.camYaw) * kExp(2.2, dt);                                    // the camera stays behind her: it turns to look at the wall she climbs
    if (c.dir) {                                                                                     // over the parapet (up) / over the edge (down): she moves between the face and the walkway
      c.mt = clamp(c.mt + (c.dir * dt) / 0.6, 0, 1); S.y = top; c.vy = 0;
      const off = lm + (hug(b, top, 0) - lm) * ease(c.mt), [px, pz] = wrd(b, c.u, s * off); S.x = px; S.z = pz;
      if (c.dir < 0 && c.mt <= 0) { S.layer = 'top'; S.top = b; S.climb = null; S.grounded = true; S.dHold = 0; }
      else if (c.dir > 0 && c.mt >= 1) { c.dir = 0; c.auto = true; }
      return;
    }
    const gy = world.fastHeight(S.x, S.z);
    let up = m > 0.2 ? -(dx * ny[0] + dz * ny[1]) : 0; const al = m > 0.2 ? dx * b.ux + dz * b.uz : 0;
    if (c.auto) up = -1; else if (Math.abs(up) < 0.3) up = 0;
    c.vy += (up * CLIMB_V - c.vy) * kExp(8, dt); c.u = clamp(c.u + al * m * 0.8 * dt, -(b.hw - 0.5), b.hw - 0.5);
    S.y += c.vy * dt; S.climbV = c.vy;
    const [px, pz] = wrd(b, c.u, s * hug(b, S.y, gy)); S.x = px; S.z = pz;
    if (S.y >= top - 0.02 && c.vy > 0) { S.y = top; c.mt = 1; c.dir = -1; c.vy = 0; }
    else if (S.y <= gy + 0.02 && c.vy <= 0) { S.layer = 0; S.climb = null; S.y = gy; const [qx, qz] = wrd(b, c.u, s * (b.hd + R_BODY + 0.2)); S.x = qx; S.z = qz; S.grounded = true; S.vy = 0; S.st = 'loco'; }
  }
  function topStep(dt, dx, dz, m) {                                                                 // on the wall-walk: she is held between the merlons; a neighbouring wall piece takes her over at a corner
    let b = S.top; const top = topY(b), sx = S.vx * dt, sz = S.vz * dt, n = Math.max(1, Math.ceil(Math.hypot(sx, sz) / 0.2)); let edge = 0;
    S.y = top; S.vy = 0; S.grounded = true;
    const tall = S.boxes.filter((o) => !wallOf(o) && o.h > top - 0.5);
    for (let i = 0; i < n; i++) {
      const nx = S.x + sx / n, nz = S.z + sz / n; let [u, v] = loc(b, nx, nz); const um = b.hw - 0.35, lm = latMax(b);
      if (Math.abs(u) > um || Math.abs(v) > lm) {
        let moved = false;
        for (const o of S.boxes) { if (o === b || !wallOf(o) || Math.abs(topY(o) - top) > 0.6) continue; const [ou, ov] = loc(o, nx, nz); if (Math.abs(ou) <= o.hw - 0.35 && Math.abs(ov) <= latMax(o)) { b = S.top = o; u = ou; v = ov; moved = true; break; } }
        if (!moved) { if (Math.abs(v) > lm) edge = Math.sign(v); u = clamp(u, -um, um); v = clamp(v, -lm, lm); }
      }
      const [qx, qz] = wrd(b, u, v); S.x = qx; S.z = qz;
      if (tall.length) { const q = { x: S.x, z: S.z }; if (pushOut(q, R_BODY + 0.25, { boxes: () => tall, discs: () => [] })) { S.x = q.x; S.z = q.z; } }       // a tower / gatehouse that rises above the walk is a wall in her way
    }
    if (edge && m > 0.3) {                                                                           // pushing into the parapet for a moment = climb down that side
      const [, v] = loc(b, S.x, S.z); if (dx * b.vx * edge + dz * b.vz * edge > 0.55 && Math.abs(v) > latMax(b) - 0.06) {
        if ((S.dHold += dt) > 0.4) { S.layer = 'climb'; S.climb = { b, s: edge, u: loc(b, S.x, S.z)[0], auto: false, vy: 0, mt: 0, dir: 1 }; S.dHold = 0; S.top = null; S.vx = S.vz = 0; }
      } else S.dHold = 0;
    } else S.dHold = 0;
  }

  // ------------------------------------------------------------------ buildings used by walking (RP1B)
  // Within 2.5 m of the nearest face of a building / worksite / mine / vault / keep / cottage / civic lot that HAS a T1 sheet, a round button appears; it opens the same sheet the strategic tap opens
  // (H.sheets.open: one code path).  Footprints are read from world.picks and the sheet's own lot list each time, never cached.
  const NEAR_R = 2.5, NEAR_SKIP = new Set(['wall', 'gate', 'tower']);                 // (the fortifications have a sheet in the strategic view, but a button along every wall she walks or climbs would be noise)
  function nearSheet() {
    const sh = H.sheets, SMp = H.SM; if (!sh || S.where !== 'home' || S.layer !== 0 || S.sw) return null;
    let best = null; const x = S.x, z = S.z, take = (id, d, cx, cz) => { if (d < NEAR_R && (!best || d < best.d)) best = { id, d, x: cx, z: cz }; };
    for (const p of world.picks || []) {
      const b = p.box, dx = Math.max(b.min.x - x, 0, x - b.max.x), dz = Math.max(b.min.z - z, 0, z - b.max.z), d = Math.hypot(dx, dz); if (d >= NEAR_R) continue;
      if (!NEAR_SKIP.has(p.id) && sh.can(p.id, SMp)) take(p.id, d, (b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2);
    }
    for (const l of sh.lots ? sh.lots() : []) {
      const c = Math.cos(l.ry), sn = Math.sin(l.ry), ex = x - l.x, ez = z - l.z, u = ex * c - ez * sn, v = ex * sn + ez * c;
      const d = Math.hypot(Math.max(Math.abs(u) - l.w / 2, 0), Math.max(Math.abs(v) - l.d / 2, 0)); if (d >= NEAR_R) continue;
      if (sh.can(l.id, SMp)) take(l.id, d, l.x, l.z);
    }
    return best;
  }
  let sheetK = false;
  function sheetCls(on) { if (on === sheetK) return; sheetK = on; root.classList.toggle('rp-sheet', on); if (hudEl) hudEl.classList.toggle('rp-sheet', on); if (on) { S.inp.x = S.inp.y = 0; S.sprint = false; S.joyOn = false; if (joyEl) joyEl.style.display = 'none'; } }
  function openDoor(id, x, z) {                                                         // turn to the building and open its sheet (the SAME T1 sheet as a strategic tap); the `interact` clip plays behind it
    if (!H.sheets || S.sheetOn) return false;
    S.vx = S.vz = 0; S.inp.x = S.inp.y = 0; S.auto = null; S.body = S.camYaw = Math.atan2(x - S.x, z - S.z);
    if (!H.sheets.open(id, H.SM)) return false;
    S.sheetOn = true; S.act = S.hero && S.hero.acts.interact ? { t: 0 } : null; sheetCls(true); return true;
  }
  function useNear() { const n = S.near; if (!n) return false; return openDoor(n.id, n.x, n.z); }      // the round button
  // RP1C: tap a door orb / icon in the 3D view -> she walks there by herself (a local BFS over the free cells, 1 m, the proof walkTo's rules; steered through S.inp), the sheet opens on arrival.
  // The joystick (moved) or a movement key cancels it.
  function planLocal(tx, tz) {
    const wd = homeWorld, sx = S.x, sz = S.z, half = Math.ceil(Math.hypot(tx - sx, tz - sz) / 2 + 16), N = half * 2, x0 = (sx + tx) / 2 - half, z0 = (sz + tz) / 2 - half, idx = (i, j) => j * N + i, par = new Int32Array(N * N);
    const si = Math.floor(sx - x0), sj = Math.floor(sz - z0), ti = Math.floor(tx - x0), tj = Math.floor(tz - z0); if (Math.min(si, sj, ti, tj) < 0 || Math.max(si, sj, ti, tj) >= N) return null;
    const clr = (x, z) => free(x + 1, z, wd) && free(x - 1, z, wd) && free(x, z + 1, wd) && free(x, z - 1, wd); let q, found = false;
    for (let pass = 0; pass < 2 && !found; pass++) {
      par.fill(-2); q = [idx(si, sj)]; par[idx(si, sj)] = -1;
      for (let h = 0; h < q.length && !found; h++) {
        const k = q[h], i = k % N, j = (k / N) | 0, x = x0 + i + 0.5, z = z0 + j + 0.5;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || par[idx(ni, nj)] !== -2) continue; const nx = x0 + ni + 0.5, nz = z0 + nj + 0.5, gl = Math.hypot(di, dj), g0 = wd.ground(x, z), g1 = wd.ground(nx, nz);
          if (!free(nx, nz, wd) || g1 - g0 > 0.75 * gl || g0 - g1 > 1.6 * gl || (di && dj && (!free(x + di, z, wd) || !free(x, z + dj, wd)))) continue;
          if (pass === 0 && !(ni === ti && nj === tj) && !clr(nx, nz)) continue;
          par[idx(ni, nj)] = k; q.push(idx(ni, nj)); if (ni === ti && nj === tj) { found = true; break; }
        }
      }
    }
    if (!found) return null; const pts = []; for (let k = idx(ti, tj); k >= 0; k = par[k]) pts.push([x0 + (k % N) + 0.5, z0 + ((k / N) | 0) + 0.5]); return pts.reverse();
  }
  function autoStep(dt) {
    const A = S.auto; if (!A) return;
    if (S.sheetOn || S.where !== 'home' || S.layer !== 0 || S.sw || S.joyOn || S.paused) { if (!S.joyOn) S.inp.x = S.inp.y = 0; S.auto = null; return; }       // (a finger on the stick owns S.inp; any other reason to stop: she stops)
    A.t += dt; const gd = Math.hypot(A.gx - S.x, A.gz - S.z);
    if (gd < 0.9 || A.t > A.max) { const a = A; S.auto = null; S.inp.x = S.inp.y = 0; if (gd < 2.4) openDoor(a.id, a.fx, a.fz); return; }
    const P = A.pts;
    if ((A.lt -= dt) <= 0) {                                                                                                  // every 0.2 s: the path point closest to her, then the farthest of the next 5 she can walk to in a straight line
      A.lt = 0.2; let best = A.wi, bd = 1e9; for (let k = A.wi; k < Math.min(P.length, A.wi + 12); k++) { const d = Math.hypot(P[k][0] - S.x, P[k][1] - S.z); if (d < bd) { bd = d; best = k; } } if (bd < 2.5) A.wi = Math.min(P.length - 1, best + 1);
      let li = Math.min(P.length - 1, A.wi); for (let k = Math.min(P.length - 1, A.wi + 5); k > A.wi; k--) { const px = P[k][0], pz = P[k][1], n = Math.ceil(Math.hypot(px - S.x, pz - S.z) / 0.5); let ok = true; for (let m = 1; m <= n && ok; m++) ok = free(S.x + ((px - S.x) * m) / n, S.z + ((pz - S.z) * m) / n, homeWorld); if (ok) { li = k; break; } } A.li = li;
    }
    if ((A.pt += dt) >= 2.5) { A.pt = 0; if (Math.hypot(S.x - A.lx, S.z - A.lz) < 0.5) { S.auto = null; S.inp.x = S.inp.y = 0; return; } A.lx = S.x; A.lz = S.z; }       // no progress for 2.5 s: she gives up (stuck)
    const L = P[A.li] || [A.gx, A.gz], dx = L[0] - S.x, dz = L[1] - S.z, l = Math.hypot(dx, dz) || 1;
    const rel = wrapPi(Math.atan2(dx, dz) - S.camYaw); S.camYaw += rel * kExp(7, dt);                                  // (the camera swings round behind the way she goes — RP1C-R2: fast, and she waits until she faces it: no walking backwards to a door)
    const sy = Math.sin(S.camYaw), cy = Math.cos(S.camYaw), sp = (gd < 3 ? 0.55 : 0.8) * clamp((1.2 - Math.abs(rel)) / 0.7, 0, 1); S.inp.y = ((dx * sy + dz * cy) / l) * sp; S.inp.x = ((-dx * cy + dz * sy) / l) * sp;
  }
  function tapDoor(cx, cy) {                                                                                                   // a finger landed (tap) at client x, y: is it on a door orb / icon?
    if (!doors || S.sheetOn || S.where !== 'home' || S.layer !== 0 || S.sw) return false;
    const it = doors.tap(cx, cy); if (!it) return false; const d = Math.hypot(it.gx - S.x, it.gz - S.z);
    if (d < 1.3) return openDoor(it.id, it.fx, it.fz);
    const pts = planLocal(it.gx, it.gz); if (!pts && d > 20) return false;
    S.auto = { id: it.id, gx: it.gx, gz: it.gz, fx: it.fx, fz: it.fz, pts: pts || [[S.x, S.z], [it.gx, it.gz]], wi: 1, li: 1, t: 0, max: 10 + d * 0.9, lt: 0, pt: 0, lx: S.x, lz: S.z }; return true;
  }
  function sheetTick(dt) {
    if (S.sheetOn && !(H.sheets && H.sheets.isOpen())) S.sheetOn = false;
    S.nearT -= dt; if (S.nearT > 0) return; S.nearT = 0.15;
    sheetCls(S.sheetOn || !!root.querySelector('.bsh.on'));                                                // (RP1C-R2: joystick + every action button follow the sheet — hidden while ANY .bsh.on is open, restored when it closes)
    S.near = S.sheetOn ? S.near : nearSheet();
    if (btns.act) { const on = S.near && !S.sheetOn; btns.act.style.display = on ? 'flex' : 'none'; if (on && doors && S.nearK !== S.near.id) { S.nearK = S.near.id; btns.act.innerHTML = doors.iconSVG(doors.kindOf(S.near.id)); } }      // (RP1C: the button wears the same icon as the door's)
  }

  // ------------------------------------------------------------------ the face rule (RP1C-R2)
  // the guard: whatever turned her (the combat sim, the wall), the camera is eased to within `soft` of her body (rate `k`) and never farther than `hard`
  const guardCam = (dt, k) => faceGuard(S, dt, k);
  function faceStep(dt) {
    if (S.mode === 'first') { S.body = S.camYaw; S.bk = 0; return; }
    if (S.st === 'cmb' || S.layer === 'climb') { S.bk = 0; guardCam(dt, FACE.chase); return; }                    // the combat sim (S.body = its yaw, copied in pre()) / the wall owns her yaw: the camera follows it
    if (S.layer === 'top') { if (Math.hypot(S.vx, S.vz) > 0.25) S.body += wrapPi(Math.atan2(S.vx, S.vz) - S.body) * kExp(13, dt); S.bk = 0; guardCam(dt, FACE.chase); return; }
    const dod = S.st === 'dodge'; faceLoco(S, dt, dod ? S.burst.x : S.vx, dod ? S.burst.z : S.vz);
  }

  // ------------------------------------------------------------------ one tick of the hero (physics + state)
  function update(dt) {
    if (!S.hero) return;
    const wd = W(); S.cool = Math.max(0, S.cool - dt); S.dodgeCool = Math.max(0, S.dodgeCool - dt);
    if (S.auto) autoStep(dt);                                                                          // RP1C: she is walking to a door by herself
    // input -> a vector (x right, y forward), 0..1
    let ix = S.inp.x, iy = S.inp.y; const K = S.keys;
    if (K.has('KeyW') || K.has('ArrowUp')) iy += 1; if (K.has('KeyS') || K.has('ArrowDown')) iy -= 1; if (K.has('KeyD')) ix += 1; if (K.has('KeyA')) ix -= 1;
    if (K.has('ArrowLeft')) S.camYaw += 1.9 * dt; if (K.has('ArrowRight')) S.camYaw -= 1.9 * dt;
    let m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; m = 1; }
    if (m < 0.1 || S.sheetOn) { ix = iy = 0; m = 0; }
    const sprint = S.sprint || K.has('ShiftLeft') || K.has('ShiftRight');
    const sp = Math.sin(S.camYaw), cp = Math.cos(S.camYaw), fx = sp, fz = cp, rx = -cp, rz = sp;
    const wantX = (fx * iy + rx * ix), wantZ = (fz * iy + rz * ix);
    if (m > 0 && S.mode === 'third' && S.layer === 0) { const a = Math.abs(wrapPi(Math.atan2(wantX, wantZ) - S.camYaw)); S.bkS = S.bkS ? a > FACE.backOff : a > FACE.backOn; } else S.bkS = false;       // RP1C-R2: the stick points towards the camera (hysteresis)
    let target = 0; if (m > 0) target = m < 0.55 ? WALK * (m / 0.55) : WALK + (RUN - WALK) * ((m - 0.55) / 0.45); if (sprint && m > 0.5 && !S.bkS) target *= SPRINT_K;
    if (S.bkS) target = Math.min(target * FACE.backK, FACE.backV);                                      // RP1C-R2: backwards = slower, no sprint
    S.stT += dt;
    const air = !S.grounded;
    const cb = S.cmb && S.cmb.pre(dt, S, wantX, wantZ, S.bkS ? 0 : m); // RP4: combat tick (RP1C-R2: a push towards the camera is passed as «no push»: attack / block would turn her to face it, a dodge becomes the sim's own back-step); true = it owns the hero (attack / roll / hurt / skill): no host locomotion
    let dep = 0;                                                                     // RP1B: wade (< 0.95 m: slower) / swim (deeper: a slow crawl, no jump / dodge)
    if (S.where === 'home' && S.layer === 0) { dep = waterDepth(S.x, S.z); const w0 = S.sw; S.sw = (S.grounded || S.y <= WSURF + 0.5) && dep > (w0 === 2 ? SWIM_DEEP - 0.2 : SWIM_DEEP) ? 2 : dep > 0.12 ? 1 : 0; } else S.sw = 0;
    if (S.sw === 1) target *= 1 - 0.45 * clamp(dep / SWIM_DEEP, 0, 1);
    else if (S.sw === 2) { target = m > 0 ? SWIM_V * (0.45 + 0.55 * m) : 0; if (S.st === 'dodge') { S.st = 'loco'; S.stT = 0; } }
    if (S.st === 'dodge') {
      const t = S.stT, sb = 1.5 + 5.0 * Math.pow(Math.max(0, 1 - t / 0.6), 2);
      S.vx = S.burst.x * sb; S.vz = S.burst.z * sb;
      if (S.stT >= 1.7 / 1.9) { S.st = 'loco'; S.stT = 0; }
    } else if (!cb) { // RP4:
      const ml = Math.hypot(wantX, wantZ) || 1, tvx = (wantX / ml) * target, tvz = (wantZ / ml) * target, acc = (air ? 5 : target > S.speed + 0.05 ? GAIT.acc : GAIT.dec) * dt;
      S.vx += clamp(tvx - S.vx, -acc, acc); S.vz += clamp(tvz - S.vz, -acc, acc);
    }
    // jump / dodge requests
    if (S.reqJump) { S.reqJump = false; if (S.grounded && S.st !== 'dodge' && S.sw !== 2 && S.layer === 0) { S.vy = JUMP_V; S.grounded = false; S.st = 'jump'; S.stT = 0; } }
    if (S.reqDodge) {
      S.reqDodge = false;
      if (S.grounded && S.st !== 'dodge' && S.dodgeCool <= 0 && S.sw !== 2 && S.layer === 0) {
        let dx = wantX, dz = wantZ; if (m < 0.1) { dx = Math.sin(S.body); dz = Math.cos(S.body); } const l = Math.hypot(dx, dz) || 1;
        S.burst = { x: dx / l, z: dz / l }; S.st = 'dodge'; S.stT = 0; S.dodgeCool = 1.0;       // (RP1C-R2: her body follows the face rule, not the roll's direction)
      }
    }
    const wl = Math.hypot(wantX, wantZ) || 1;
    if (S.layer === 'climb') climbStep(dt, wantX / wl, wantZ / wl, m);
    else if (S.layer === 'top') topStep(dt, wantX / wl, wantZ / wl, m);
    else {
      if (CLIMB_ON && S.where === 'home' && S.grounded && S.sw === 0 && S.st === 'loco' && m > 0.3) {           // pushing into a wall face for a moment = she starts to climb it
        const f = wallFace(wantX / wl, wantZ / wl); if (f) { if ((S.cHold += dt) > 0.18) startClimb(f); } else S.cHold = 0;
      } else S.cHold = 0;
    if (S.where === 'home') {                                                       // soft stop at the map edge: the outward speed fades over the last EDGE_SOFT metres
      const rr = Math.hypot(S.x, S.z);
      if (rr > EDGE_R - EDGE_SOFT) { const ox = S.x / rr, oz = S.z / rr, vo = S.vx * ox + S.vz * oz; if (vo > 0) { const f = clamp((EDGE_R - rr) / EDGE_SOFT, 0, 1); S.vx -= ox * vo * (1 - f); S.vz -= oz * vo * (1 - f); } }
      S.unT -= dt; if (S.unT <= 0) { S.unT = 0.5; unstick(); }
    }
    // horizontal move in short steps
    const sx = S.vx * dt, sz = S.vz * dt, n = Math.max(1, Math.ceil(Math.hypot(sx, sz) / 0.2));
    for (let i = 0; i < n; i++) tryMove(sx / n, sz / n);
    // vertical
    if (S.sw === 2 && S.grounded) { const wy = WSURF - (Math.hypot(S.vx, S.vz) > 0.3 ? 0.22 : 1.1); S.y += (wy - S.y) * kExp(6, dt); S.vy = 0; S.st = 'loco'; }
    else {
    const gy = (S.where === 'home' && !S.grounded && waterDepth(S.x, S.z) > SWIM_DEEP) ? WSURF - 0.15 : wd.ground(S.x, S.z);
    if (!S.grounded) {
      S.y += S.vy * dt - 0.5 * GRAV * dt * dt; S.vy -= GRAV * dt;                                       // RP1C-R2 Job 7: exact for a constant g (the old Euler step made the hop 0.53 / 0.49 / 0.45 m at 60 / 30 / 20 fps; now 0.57 m at every frame rate)
      if (S.y <= gy && S.vy <= 0) { S.y = gy; S.vy = 0; S.grounded = true; if (S.st === 'jump' || S.st === 'fall') { S.st = 'land'; S.stT = 0; } }
      else if (S.st === 'jump' && S.stT > JUMP_T || (S.st === 'loco' && S.y > gy + 0.6)) { if (S.st !== 'fall') { S.st = 'fall'; S.stT = 0; } }
    } else {
      if (S.y - gy > 0.35) { S.grounded = false; S.vy = 0; if (S.st === 'loco') { S.st = 'fall'; S.stT = 0; } }   // walked off an edge
      else if (!CONTACT.rigid) S.y += (gy - S.y) * kExp(18, dt);
      else {                                                                                          // RP1C-R2: rigid contact — the sole IS the surface (the old low-pass lagged v_y / 18 below it on a hill); only curbs / steps (>= 12 cm) are smoothed
        let gs = gy; if (S.where === 'home' && foot && CONTACT.rib) { const gb = baseGround(S.x, S.z), rb = gy - gb; if (S.rib < 0 || dt === 0) S.rib = rb; else S.rib += (rb - S.rib) * kExp(35, dt); if (Math.abs(rb - S.rib) < 0.004) S.rib = rb; gs = gb + S.rib; }   // (the ribbon's own 7 cm edge is eased in 30 ms; the slope under it is exact)
        const d = gs - S.y; S.y = Math.abs(d) < 0.12 ? gs : S.y + d * kExp(18, dt);
      }
    }
    }
    }
    if (S.st === 'land' && (S.stT > 0.52 || (m > 0.3 && S.stT > 0.18))) { S.st = 'loco'; S.stT = 0; }
    S.speed = Math.hypot(S.vx, S.vz) * (S.st === 'loco' ? 1 : 0.0) + (S.st === 'loco' ? 0 : 0);
    if (S.st === 'loco') S.speed = Math.hypot(S.vx, S.vz); else S.speed = Math.hypot(S.vx, S.vz) * 0.0;
    // body yaw: the face rule (RP1C-R2)
    faceStep(dt);
    // triggers
    if (S.where === 'home' && S.door && S.cool <= 0 && S.grounded && Math.hypot(S.x - S.door.x - S.door.nx * 0.3, S.z - S.door.z - S.door.nz * 0.3) < S.door.R) goUnder();
    else if (S.where === 'under' && S.cool <= 0 && underWorld && Math.hypot(S.x - underWorld.portal.x, S.z - underWorld.portal.z) < underWorld.portal.r && S.y < underWorld.portal.y + 3) goHome();
    // place the model
    const g = S.hero.grp; g.position.set(S.x, S.y, S.z); g.rotation.y = S.body; placeBlob(S.hero);
    he('move'); animate(dt); he('animate');
    if (S.cmb) S.cmb.post(dt); // RP4: blend the combat clip over the locomotion pose
    he('post'); if (foot) foot.ik(dt); he('ik');     // RP1C-R2: the legs reach the ground under each foot (the last word on the leg bones)
  }

  // ------------------------------------------------------------------ the camera
  function segHit(ax, ay, az, bx, bz, by, wd) {                           // first hit of the segment A->B with the boxes / discs / ground; returns t in 0..1 (1 = clear)
    let best = 1; const mgD = 0.38;
    const boxes = (S.layer === 'top' && S.top && wd === homeWorld) ? wd.boxes().concat([-1, 1].map((sd) => { const b = S.top, [mx, mz] = wrd(b, 0, sd * (b.hd - 0.35)); return { x: mx, z: mz, hw: b.hw, hd: 0.35, ux: b.ux, uz: b.uz, vx: b.vx, vz: b.vz, h: b.h + 2.3, mg: 0.1 }; })) : wd.boxes();   // on the wall-walk the merlons are solid for the camera, and the camera does not look over their top from outside the walkway (0.55 m taller than the stone: she stays in the picture)
    for (const b of boxes) {
      const mg = b.mg === undefined ? 0.38 : b.mg;                       // (the merlon slabs: a narrow margin — she walks 0.9 m from the middle, the slab starts at 1.2 m)
      const mx = (ax + bx) / 2 - b.x, mz = (az + bz) / 2 - b.z, rr = (b.hw + b.hd + mg + Math.hypot(bx - ax, bz - az) / 2); if (mx * mx + mz * mz > rr * rr) continue;
      const a0x = (ax - b.x) * b.ux + (az - b.z) * b.uz, a0z = (ax - b.x) * b.vx + (az - b.z) * b.vz, d0x = (bx - ax) * b.ux + (bz - az) * b.uz, d0z = (bx - ax) * b.vx + (bz - az) * b.vz;
      let t0 = 0, t1 = 1, ok = true;
      for (const [p, d, h] of [[a0x, d0x, b.hw + mg], [a0z, d0z, b.hd + mg]]) {
        if (Math.abs(d) < 1e-7) { if (Math.abs(p) > h) ok = false; }
        else { let ta = (-h - p) / d, tb = (h - p) / d; if (ta > tb) { const q = ta; ta = tb; tb = q; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) ok = false; }
        if (!ok) break;
      }
      if (ok && t0 > 0 && t0 < best) { const yy = ay + (by - ay) * t0; if (yy < wd.ground(ax + (bx - ax) * t0, az + (bz - az) * t0) + b.h) best = t0; }
    }
    for (const [sx, sz, sr] of wd.discs()) {
      const dx = bx - ax, dz = bz - az, fx = ax - sx, fz = az - sz, a = dx * dx + dz * dz, b2 = 2 * (fx * dx + fz * dz), c = fx * fx + fz * fz - (sr + mgD) ** 2, disc = b2 * b2 - 4 * a * c;
      if (a < 1e-8 || disc < 0 || c < 0) continue; const t = (-b2 - Math.sqrt(disc)) / (2 * a); if (t > 0 && t < best) best = t;
    }
    for (let i = 1; i <= 10; i++) { const t = i / 10; if (t >= best) break; if (ay + (by - ay) * t < wd.ground(ax + (bx - ax) * t, az + (bz - az) * t) + 0.35) { best = Math.max(0, t - 0.1); break; } }
    return best;
  }
  const tmpV = new T.Vector3();
  function placeCamera(dt) { placeCamera0(dt); if (S.tap) S.tap(); }                                                    // (RP1C-R2: S.tap = a dev probe called after every camera placement, whoever drove the frame)
  function placeCamera0(dt) {
    const wd = W(), cy = Math.cos(S.camYaw), sy = Math.sin(S.camYaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
    const vx = sy * cp, vy = -sp, vz = cy * cp, rx = -cy, rz = sy;
    if (S.mode === 'first') {
      const ex = S.x + Math.sin(S.body) * 0.17 * HS, ez = S.z + Math.cos(S.body) * 0.17 * HS, ey = S.y + 1.62 * HS;
      camera.position.set(ex, ey, ez); camera.lookAt(ex + vx, ey + vy, ez + vz);
      S.pivot.set(S.x, S.y + 1.45 * HS, S.z); return;
    }
    const k = kExp(16, dt); S.pivot.x += (S.x - S.pivot.x) * k; S.pivot.z += (S.z - S.pivot.z) * k; S.pivot.y += (S.y + 1.45 * HS - S.pivot.y) * kExp(10, dt);
    if (dt === 0 || S.snap) { S.pivot.set(S.x, S.y + 1.45 * HS, S.z); S.snap = false; }
    const D = CAM_D, sh = S.layer === 'top' ? 0 : 0.55 * HS, px = S.pivot.x, py = S.pivot.y, pz = S.pivot.z;      // (on the wall-walk the camera is straight behind her: the walkway is 1.8 m wide)
    const tx = px - vx * D + rx * sh, ty = py - vy * D + 0.1, tz = pz - vz * D + rz * sh;           // wanted camera spot (behind, a little to the right)
    const t = segHit(px, py, pz, tx, tz, ty, wd), want = Math.max(0.55, t * D - 0.25);
    if (want < S.camD) S.camD = want; else S.camD += (want - S.camD) * kExp(3.5, dt); if (dt === 0) S.camD = want;      // (closer at once when something is in the way — a smoothed approach left the camera 1 m inside a tower for a frame; away from it slowly)
    const dd = Math.min(S.camD, D), kk = dd / D;
    const cx = px + (tx - px) * kk, cyy = py + (ty - py) * kk, cz = pz + (tz - pz) * kk;
    let fl = wd.ground(cx, cz);
    const tb = S.layer === 'top' ? S.top : (S.layer === 'climb' && S.climb ? S.climb.b : null);
    if (tb) { const [cu, cv] = loc(tb, cx, cz); if (Math.abs(cu) <= tb.hw && Math.abs(cv) <= tb.hd) fl = Math.max(fl, Math.abs(cv) > tb.hd - 0.7 ? tb.h + 1.7 : topY(tb)); }        // never below the wall-walk while over it, and above the parapet when over its edge
    if (S.where === 'home' && world.fastHeight(cx, cz) < WSURF) fl = Math.max(fl, WSURF);                                               // never under the water
    camera.position.set(cx, Math.max(cyy, fl + 0.3), cz); camera.lookAt(camera.position.x + vx, camera.position.y + vy, camera.position.z + vz);
  }

  // ------------------------------------------------------------------ DOM: HUD, pick screen, perf overlay
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  function ensureStyle() { if (styleEl) return; styleEl = el('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl); }
  function buildHud() {
    if (hudEl) return; ensureStyle();
    hudEl = el('div', 'rp-k'); hudEl.style.cssText = 'position:absolute;inset:0;z-index:40;display:none;pointer-events:none';
    const touch = el('div', 'rp-touch rp-k'); touch.style.pointerEvents = 'auto'; hudEl.appendChild(touch);
    joyEl = el('div', 'rp-joy rp-k', '<i></i>'); knobEl = joyEl.firstChild; hudEl.appendChild(joyEl);
    const ICON = {
      jump: '<svg viewBox="0 0 24 24"><path d="M6 12.5l6-6 6 6M6 19l6-6 6 6"/></svg>',
      dodge: '<svg viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5"/><path d="M19.8 3.6v4.2h-4.2"/><circle cx="12" cy="12" r="1.7"/><path d="M1.5 9.5h3M1 12.5h3.4M1.5 15.5h3"/></svg>',
      sprint: '<svg viewBox="0 0 24 24"><path d="M13.5 2.5L5.5 13.5h6l-1.2 8 8-11.5h-6z"/></svg>',
      cam: '<svg viewBox="0 0 24 24"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
      exit: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
      gate: '<svg viewBox="0 0 24 24"><path d="M3 21V9l3-2 3 2v12M15 21V9l3-2 3 2v12M9 21v-6a3 3 0 0 1 6 0v6M3 21h18"/></svg>',
      act: '<svg viewBox="0 0 24 24"><path d="M4 21V10l8-6 8 6v11"/><path d="M9.5 21v-6.5a2.5 2.5 0 0 1 5 0V21"/><path d="M2.5 21h19"/></svg>',
    };
    const mk = (id, css, fn, hold, long) => {
      const b = el('div', 'rp-b rp-k', ICON[id]); b.style.cssText = css + ';pointer-events:auto'; btns[id] = b; b.dataset.rp = id;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* a synthetic pointer (tests) */ } b.classList.add('on');
        if (long) { b._ld = false; clearTimeout(b._lp); b._lp = setTimeout(() => { b._ld = true; b.classList.remove('on'); long(); }, 600); } else fn(true);        // (RP1C-R2: a long press on the eye = the one-line readout; a short tap = the view mode)
      });
      const up = (e) => { e.stopPropagation(); b.classList.remove('on'); if (long) { clearTimeout(b._lp); if (!b._ld && e.type === 'pointerup') fn(true); b._ld = false; } if (hold) fn(false); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      hudEl.appendChild(b); return b;
    };
    const sb = `calc(${BOT} + `;
    mk('jump', `right:22px;bottom:${sb}92px);width:78px;height:78px`, (d) => { if (d) S.reqJump = true; });
    mk('dodge', `right:110px;bottom:${sb}56px);width:62px;height:62px`, (d) => { if (d) S.reqDodge = true; });
    mk('sprint', `right:30px;bottom:${sb}186px);width:58px;height:58px`, (d) => { S.sprint = d; }, true);
    mk('cam', `left:12px;top:calc(${TOP} + 58px);width:46px;height:46px`, (d) => { if (d) setMode(S.mode === 'third' ? 'first' : 'third'); }, false, () => setPerf(!stats.open));
    mk('exit', `left:12px;top:calc(${TOP} + 6px);width:42px;height:42px`, (d) => { if (d) exit(); });
    mk('act', `right:30px;bottom:${sb}256px);width:62px;height:62px;display:none`, (d) => { if (d) useNear(); });
    mk('gate', `left:12px;top:calc(${TOP} + 116px);width:46px;height:46px`, (d) => { if (d && S.where === 'home' && !S.busy2) toGate(); });
    perfEl = el('div', 'rp-perf rp-k'); hudEl.appendChild(perfEl); try { if (localStorage.getItem('bw_rpg_perf') === '1') setPerf(true); } catch (e) { /* storage blocked */ }
    // pointers: left half = joystick, right half = look
    let joy = null, lk = null, tapD = null; const R = 56;
    touch.addEventListener('pointerdown', (e) => {
      e.preventDefault(); touch.setPointerCapture(e.pointerId);
      if (!joy && !lk && !tapD) tapD = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };                    // (RP1C: a short, still touch is a tap — on a door orb it sends her there)
      if (e.clientX < innerWidth * 0.5) { if (joy) return; joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY }; joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.style.display = 'block'; knobEl.style.transform = ''; }
      else if (!lk) lk = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    touch.addEventListener('pointermove', (e) => {
      if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const l = Math.hypot(dx, dy), c = Math.min(1, l / R); if (l > 0) { dx /= l; dy /= l; } if (l > 10) S.joyOn = true; S.inp.x = dx * c; S.inp.y = -dy * c; knobEl.style.transform = `translate(${dx * c * R * 0.8}px,${dy * c * R * 0.8}px)`; }
      else if (lk && e.pointerId === lk.id) { S.camYaw -= (e.clientX - lk.x) * 0.006; S.pitch = clamp(S.pitch + (e.clientY - lk.y) * 0.005, -0.75, 1.25); lk.x = e.clientX; lk.y = e.clientY; }
    });
    const end = (e) => {
      if (joy && e.pointerId === joy.id) { joy = null; S.inp.x = S.inp.y = 0; S.joyOn = false; joyEl.style.display = 'none'; } else if (lk && e.pointerId === lk.id) lk = null;
      if (tapD && tapD.id === e.pointerId) { const q = tapD; tapD = null; if (e.type === 'pointerup' && performance.now() - q.t < 450 && Math.hypot(e.clientX - q.x, e.clientY - q.y) < 14) tapDoor(e.clientX, e.clientY); }
    };
    touch.addEventListener('pointerup', end); touch.addEventListener('pointercancel', end); touch.addEventListener('lostpointercapture', end);   // (RP1C-R2: a sheet that hides the pad mid-touch must not leave the stick latched)
    root.appendChild(hudEl);
  }
  const onKey = (e) => {
    if (!api.active) return; const c = e.code;
    if (e.type === 'keydown') {
      S.keys.add(c); if (S.auto && /^(Key[WASD]|Arrow)/.test(c)) S.auto = null; if (S.cmb && S.cmb.key(c)) e.preventDefault(); // RP4: J attack, K dodge, U / I skills, L lock, O next target (RP1C: a key press cancels the door auto-walk)
      if (c === 'Space') { S.reqJump = true; e.preventDefault(); } else if (c === 'ControlLeft' || c === 'KeyQ' || c === 'KeyE') S.reqDodge = true; else if (c === 'KeyV' || c === 'KeyC') setMode(S.mode === 'third' ? 'first' : 'third'); else if (c === 'Escape') exit();
    } else S.keys.delete(c);
  };
  // RP1C-R2 Job 1b: the one-line readout (long press on the eye button).   `NN fps  uX.X rY.Yms  Nc  Nk  pxP  qL/M`
  //   u = JS ms per drawn frame of everything before the draw (hero + world update + the rest of the loop)   r = JS ms of the draw call itself (renderer.render: matrices, culling, sorting, GL submission — NOT the GPU's time)
  //   c = draw calls   k = thousand triangles   px = render pixels per CSS pixel   q = the governor's step / the last step (0 = full ... the higher the cheaper)
  function setPerf(on) {
    const P = window.__bwProf; stats.open = !!on; stats.txt = '';
    if (on) { stats.prev = !!(P && P.on); if (P) P.on = true; } else if (P && !stats.prev) P.on = false;                      // (the profiler is only on while the readout shows, unless the game's own overlay needs it)
    try { localStorage.setItem('bw_rpg_perf', on ? '1' : '0'); } catch (e) { /* storage blocked */ }
    drawPerf();
  }
  function drawPerf() {
    if (!perfEl) return;
    if (!stats.open) { if (perfEl.style.display !== 'none') perfEl.style.display = 'none'; return; }
    const P = window.__bwProf, a = (P && P.avg) || {}; let u = 0, r = 0;
    for (const k in a) { if (k.charCodeAt(1) === 58) continue; if (k === 'render(submit)' || k === 'refl') r += a[k]; else u += a[k]; }
    const txt = `${stats.fps}fps u${u.toFixed(1)} r${r.toFixed(1)}ms ${stats.calls}c ${(stats.tris / 1000).toFixed(0)}k px${stats.pr.toFixed(2)} q${diet ? diet.st.lvl + '/' + (diet.STEPS.length - 1) : '-'}`;
    if (txt !== stats.txt) { perfEl.textContent = txt; stats.txt = txt; }
    if (perfEl.style.display !== 'block') perfEl.style.display = 'block';
  }
  function perfTick(dt) {
    const i = renderer.info; stats.calls = i.render.calls; stats.tris = i.render.triangles; stats.progs = (i.programs || []).length; stats.pr = +renderer.getPixelRatio().toFixed(2);
    i.reset();
    stats.f.push(dt * 1000); if (stats.f.length > 180) stats.f.shift(); stats.t += dt; stats.n++;
    if (stats.t >= 0.5) { stats.fps = Math.round(stats.n / stats.t); const s = stats.f.slice().sort((a, b) => a - b); stats.p95 = s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] || 0; stats.t = 0; stats.n = 0; drawPerf(); }
  }

  function openPick() {
    if (api.active || pickEl) return; ensureStyle();
    let last = null; try { last = localStorage.getItem('bw_rpg_hero'); } catch (e) { /* storage blocked */ }
    pickEl = el('div', 'rp-pick rp-k'); pickEl.style.pointerEvents = 'auto';
    pickEl.innerHTML = '<div class="rp-grid"></div>';
    const grid = pickEl.querySelector('.rp-grid');
    for (const s of SIS) {
      const c = el('div', 'rp-card' + (s.k === last ? ' sel' : ''), `<div class="rp-art"><img alt="" src="${BASE}rpg/c_${s.k}.webp${V}"></div><div class="rp-em"><img alt="" src="${BASE}rpg/e_${s.k}.png${V}"></div>`); c.dataset.k = s.k; c.style.setProperty('--ac', s.c);
      c.addEventListener('click', () => start(s.k)); grid.appendChild(c);
    }
    const x = el('button', 'rp-x rp-k', '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>'); x.type = 'button'; x.addEventListener('click', closePick); pickEl.appendChild(x);
    root.appendChild(pickEl); api.pickEl = pickEl;
  }
  function closePick() { if (pickEl) { pickEl.remove(); pickEl = null; api.pickEl = null; } }

  // ------------------------------------------------------------------ enter / exit / scene switching
  let busy = false;
  async function start(key) {
    if (busy) return; busy = true;
    try { localStorage.setItem('bw_rpg_hero', key); } catch (e) { /* storage blocked */ }
    const sis = SIS.find((s) => s.k === key), lv = H.createLoadView(root, { title: sis.n, sub: 'Loading…', z: 300 }); lv.el.classList.add('rp-k'); lv.show(); lv.progress(0.02);
    try {
      ensureHome(); lv.progress(0.05);
      if (!diet) { const dm = await import(/* @vite-ignore */ new URL('rpg_diet.js' + (new URL(import.meta.url).search || V), import.meta.url).href); diet = dm.createDiet(H, S); api.diet = diet; }   // RP1B: the frame-time diet + governor
      if (!cull && diet) { const cm = await import(/* @vite-ignore */ new URL('cull.js' + (new URL(import.meta.url).search || V), import.meta.url).href); cull = cm.createCull(H, S, diet); api.cull = cull; }   // RP1C: spatial culling of repeated geometry
      if (!doors) { const dm = await import(/* @vite-ignore */ new URL('doors.js' + (new URL(import.meta.url).search || V), import.meta.url).href); doors = dm.createDoors(H, S, { ground: (x, z) => homeWorld.ground(x, z), free: (x, z) => free(x, z, homeWorld, false) && waterDepth(x, z) < 0.3 }); api.doors = doors; }   // RP1C: the door orbs
      if (!foot) { const fm = await import(/* @vite-ignore */ new URL('rpg_foot.js' + (new URL(import.meta.url).search || V), import.meta.url).href); foot = fm.createFoot(H, S, { ground: (x, z) => W().ground(x, z) }); api.foot = foot; }   // RP1C-R2: ground contact (road surface + leg IK)
      const m = await loadHero(key, lv);
      closePick(); enter(m, key); lv.progress(1); setTimeout(() => lv.hide(), 250);
    } catch (e) { console.warn('hero start', e); lv.setTitle('Error'); lv.progress(1, String(e && e.message || e)); setTimeout(() => lv.hide(), 1800); }
    busy = false;
  }
  function enter(m, key) {
    S.key = key; S.hero = m; ensureStyle(); buildHud();
    S.saved = { tx: ctl.target.x, ty: ctl.target.y, tz: ctl.target.z, dist: ctl.dist, azim: ctl.azim, polar: ctl.polar, near: camera.near, pos: camera.position.clone(), quat: camera.quaternion.clone(), autoReset: renderer.info.autoReset };
    ctl.vel.set(0, 0); ctl.vAz = 0; renderer.info.autoReset = false;
    camera.near = 0.3; camera.updateProjectionMatrix();
    root.classList.add('rp-on'); hudEl.style.display = 'block'; window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
    if (!S.door) S.door = buildDoor();
    if (S.door) scene.add(S.door.grp);
    // the castle gate of HIS map: just inside, facing the keep
    underWorld = null; toGate(); S.mode = 'third'; S.cool = 0.5;
    S.hero.grp.visible = true; scene.add(S.hero.grp); api.active = true; S.hero.mixer.update(0);
    if (m.head) m.head.scale.setScalar(1);
    if (diet) diet.enter();
    if (cull) cull.enter();
    if (doors) doors.enter();
  }
  function exit() {
    if (!api.active) return;
    if (doors) doors.exit(); S.auto = null; S.act = null; S.joyOn = false; S.nearK = '';
    if (cull) cull.exit();
    if (diet) diet.exit();
    if (S.sheetOn && H.sheets) H.sheets.close(); S.sheetOn = false; S.near = null; sheetCls(false);
    if (S.cmb) { S.cmb.dispose(); S.cmb = null; } // RP4:
    api.active = false; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); S.keys.clear(); S.inp.x = S.inp.y = 0; S.sprint = false;
    const sv = S.saved; S.hero.grp.removeFromParent(); if (S.hero.head) S.hero.head.scale.setScalar(1);
    if (S.door) scene.remove(S.door.grp);
    if (sv) { ctl.target.set(sv.tx, sv.ty, sv.tz); ctl.dist = sv.dist; ctl.azim = sv.azim; ctl.polar = sv.polar; ctl.vel.set(0, 0); ctl.vAz = 0; camera.near = sv.near; camera.updateProjectionMatrix(); camera.position.copy(sv.pos); camera.quaternion.copy(sv.quat); renderer.info.autoReset = sv.autoReset; }
    S.where = 'home'; underWorld = null; hudEl.style.display = 'none'; root.classList.remove('rp-on');
    if (S.under) { S.under.dispose(); S.under = null; }
  }
  function setMode(m) { S.mode = m; if (m === 'first') { camera.near = 0.12; } else camera.near = 0.3; camera.updateProjectionMatrix(); S.snap = true; if (m === 'first') S.body = S.camYaw; }
  async function goUnder() {
    if (S.busy2) return; S.busy2 = true; S.cool = 3;
    const lv = H.createLoadView(root, { title: 'UNDERWORLD', sub: 'Descending…', z: 300 }); lv.el.classList.add('rp-k'); lv.show(); lv.progress(0.05);
    try {
      const mod = await import(/* @vite-ignore */ new URL('rpg_under.js' + (new URL(import.meta.url).search || V), import.meta.url).href); lv.progress(0.35, 'Building…'); if (dev && window.__rpHold) await new Promise((res) => setTimeout(res, window.__rpHold));
      await new Promise((r) => setTimeout(r, 30));
      const u = await mod.buildUnder(T, { parse: H.parseGLB, base: BASE + 'rpg/under/', v: V }); S.under = u; lv.progress(0.7, 'Lighting…');   // RP3: async + the library pieces (parse/base/v)
      u.scene.add(S.hero.grp);
      underWorld = {
        ground: (x, z) => u.hgt(x, z), boxes: () => [], discs: () => u.colliders, inside: () => true, clampXZ: u.clampXZ, portal: u.portal,
      };
      try { S.cmb = await (await import(/* @vite-ignore */ new URL('combat.js' + (new URL(import.meta.url).search || V), import.meta.url).href)).attach(u, S.hero, { THREE: T, camera, root, base: BASE + 'rpg/', v: V, parseGLB: H.parseGLB, btns, dev, sister: S.key, pixelRatio: renderer.getPixelRatio(), hgt: u.hgt, spawn: 3, hostMove: (dx, dz) => { const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.2)); for (let i = 0; i < n; i++) tryMove(dx / n, dz / n); } }); } catch (e) { console.warn('rp4', e); } // RP4: combat core (lazy module) + 3 placeholder enemies, owner test only
      if (diet) diet.syncQ();                                                                          // RP1C-R2: the governor's current level -> S.under / S.cmb .setQuality
      S.where = 'under'; S.layer = 0; S.sw = 0; S.x = u.spawn.x; S.z = u.spawn.z; S.y = u.hgt(S.x, S.z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; S.camYaw = u.spawn.yaw; S.body = u.spawn.yaw; S.snap = true; S.camD = CAM_D;
      S.hero.grp.position.set(S.x, S.y, S.z); S.hero.grp.rotation.y = S.body; u.update(0, 0, camera.position); placeCamera(0);      // (RP1C-R2: her model already faces where the camera looks on the very first frame)
      try { if (renderer.compileAsync) await renderer.compileAsync(u.scene, camera); else renderer.compile(u.scene, camera); } catch (e) { /* first draw compiles instead */ }
      lv.progress(1); S.cool = 1.2; setTimeout(() => lv.hide(), 200);
    } catch (e) { console.warn('underworld', e); S.where = 'home'; scene.add(S.hero.grp); lv.setTitle('Error'); lv.progress(1, String(e && e.message || e)); setTimeout(() => lv.hide(), 1800); }
    S.busy2 = false;
  }
  async function goHome() {
    if (S.busy2) return; S.busy2 = true; S.cool = 3;
    const lv = H.createLoadView(root, { title: 'RETURN', sub: 'To the castle…', z: 300 }); lv.el.classList.add('rp-k'); lv.show(); lv.progress(0.3);
    await new Promise((r) => setTimeout(r, 120));
    if (S.cmb) { S.cmb.dispose(); S.cmb = null; } // RP4:
    scene.add(S.hero.grp); S.where = 'home'; underWorld = null;
    const d = S.door; if (d) { S.x = d.x + d.nx * 2.6; S.z = d.z + d.nz * 2.6; S.camYaw = Math.atan2(d.nx, d.nz); S.body = S.camYaw; } else { S.x = L.GATE.x - L.GATE.nx * 9; S.z = L.GATE.z - L.GATE.nz * 9; }
    S.y = homeGround(S.x, S.z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; S.snap = true; S.camD = CAM_D; S.hero.grp.position.set(S.x, S.y, S.z); S.hero.grp.rotation.y = S.body;
    if (S.under) { S.under.dispose(); S.under = null; }
    lv.progress(1); S.cool = 1.5; setTimeout(() => lv.hide(), 200); S.busy2 = false;
  }

  // ------------------------------------------------------------------ called by main.js every frame while active
  // RP1C-R2: per-part CPU probes of the hero's own frame (free while the profiler is off: one boolean test) — read with window.__bwProf.ms / .avg ('h:…' keys)
  let hT = 0; const hb = () => { const P = window.__bwProf; if (P && P.on) hT = performance.now(); }, he = (k) => { const P = window.__bwProf; if (P && P.on) { const n = performance.now(); P.ms['h:' + k] = (P.ms['h:' + k] || 0) + n - hT; hT = n; } };
  function frame(now, dt0) {
    if (S.fakeNow != null) { S.fakeNow += 1000 / 60; now = S.fakeNow; }                                  // (dev / the CPU proof: the periodic jobs run on a 60 fps clock, whatever the slow test rig does)
    let dt = S.paused ? 0 : (S.fixed || dt0); hb();
    if (S.cache && S.where === 'home' && performance.now() - S.cache > 2500) refreshColliders();
    update(dt); he('update');
    ctl.target.set(S.x, S.y + 1, S.z);                                                                  // (the sun's shadow box follows ctl.target)
    placeCamera(dt); he('camera');
    camera.updateMatrixWorld();
    if (S.cmb) S.cmb.frame(dt, now); // RP4: camera framing + shake, particles, enemies, HUD
    he('cmb'); if (diet) diet.tick(now, S.paused); he('diet');                                                                 // (RP1C-R2: the governor runs in the underworld too: it drives S.under / S.cmb .setQuality)
    if (cull && S.where === 'home') cull.tick(now); he('cull');
    if (foot && S.where === 'home') foot.tick(now); he('foot');
    if (doors) doors.tick(now, dt0); he('doors');
    if (S.where === 'under' && S.under) { S.under.fill.position.set(S.x, S.y + 2.8, S.z); S.under.update(now / 1000, dt0, camera.position); renderer.toneMappingExposure = 1.25; }
    he('under'); if (S.where === 'home') sheetTick(dt0); else if (btns.act) btns.act.style.display = 'none'; he('sheet');
    if (btns.dodge) { btns.dodge.style.opacity = S.dodgeCool > 0 ? 0.45 : 1; btns.jump.style.opacity = S.grounded ? 1 : 0.55; }
    perfTick(dt0); he('perf');
  }

  Object.defineProperty(api, 'scene', { get: () => (S.where === 'under' && S.under ? S.under.scene : scene) });
  Object.assign(api, { openPick, closePick, exit, frame, start, SIS });
  // ------------------------------------------------------------------ dev / proof API (only reachable through window.__rp in the dev page)
  api.dev = {
    S, setInput: (x, y) => { S.inp.x = x; S.inp.y = y; }, look: (dyaw, dp) => { S.camYaw += dyaw; S.pitch = clamp(S.pitch + dp, -0.75, 1.25); },
    setLook: (yaw, pitch) => { S.camYaw = yaw; if (pitch != null) S.pitch = pitch; },
    jump: () => { S.reqJump = true; }, dodge: () => { S.reqDodge = true; }, sprint: (b) => { S.sprint = !!b; }, cam: (m) => setMode(m),
    setPos: (x, z, yaw) => { S.layer = 0; S.top = S.climb = null; S.sw = 0; S.x = x; S.z = z; S.y = W().ground(x, z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; if (yaw != null) { S.camYaw = yaw; S.body = yaw; } S.snap = true; S.camD = CAM_D; },
    gait: (o) => (o ? Object.assign(GAIT, o) : { ...GAIT }),
    jumpInfo: () => ({ JUMP_V, GRAV, JUMP_T, apex: +(JUMP_V * JUMP_V / (2 * GRAV)).toFixed(3), air: +(2 * JUMP_V / GRAV).toFixed(3) }),
    knobs: () => H.reach, frame: (n, d) => frame(n, d), setPerf: (b) => setPerf(b), perfLine: () => (perfEl ? perfEl.textContent : ''), fakeClock: (b) => { S.fakeNow = b ? 0 : null; },
    foot: () => foot && foot.info(), footOn: (b) => foot && foot.setOn(b), contact: (o) => Object.assign(CONTACT, o), contactState: () => ({ ...CONTACT }), ground: (x, z) => W().ground(x, z), baseGround: (x, z) => baseGround(x, z), surfAt: (x, z) => foot ? foot.surf.height(x, z) : null,
    pos: () => ({ x: S.x, y: S.y, z: S.z, yaw: S.camYaw, st: S.st, where: S.where, grounded: S.grounded, speed: S.speed, camD: S.camD }),
    // RP1C-R2: the angle between HER facing (the model's +Z in the world) and the CAMERA's forward direction (horizontal), measured on the real objects — the face rule keeps it <= 70° in every frame
    faceInfo: () => { const f = new T.Vector3(), c = new T.Vector3(); S.hero.grp.getWorldDirection(f); camera.getWorldDirection(c); const ang = Math.abs(wrapPi(Math.atan2(f.x, f.z) - Math.atan2(c.x, c.z))); return { ang, deg: +(ang * 57.29578).toFixed(2), body: S.body, cam: S.camYaw, bk: S.bk, st: S.st, bkS: S.bkS }; },
    proj: (x, y, z) => { camera.updateMatrixWorld(); const v = new T.Vector3(x, y, z).project(camera); return [(v.x + 1) * 0.5 * innerWidth, (1 - v.y) * 0.5 * innerHeight, v.z]; },       // world point -> CSS px on screen (dev / tests)
    sim: (sec, step = 1 / 60) => { const n = Math.round(sec / step); for (let i = 0; i < n; i++) { update(step); placeCamera(step); } },
    // is the camera inside any solid right now?  (walls: body + merlons, towers / keep / gates up to their height, cottage discs; the water surface counts as a floor)
    camCheck: () => {
      const c = camera.position; let bad = [];
      for (const b of S.boxes) { const [u, v] = loc(b, c.x, c.z); if (Math.abs(u) > b.hw || Math.abs(v) > b.hd) continue;
        if (wallOf(b)) { if (c.y < topY(b) - 0.01 || (c.y < b.h + HERO_H && Math.abs(v) > b.hd - 0.7)) bad.push(b.type); } else if (c.y < world.fastHeight(c.x, c.z) + b.h) bad.push(b.type); }
      for (const [x, z, r] of S.discs) if (Math.hypot(c.x - x, c.z - z) < r && c.y < world.fastHeight(c.x, c.z) + 3) bad.push('disc');
      if (c.y < world.fastHeight(c.x, c.z) + 0.05) bad.push('ground'); if (world.fastHeight(c.x, c.z) < WSURF && c.y < WSURF + 0.05) bad.push('water');
      return bad;
    },
    // proof: climb a wall piece (index among the wall boxes), walk its wall-walk to both ends, climb down the other side; returns what happened + camera violations
    setClimb: (v) => { CLIMB_ON = !!v; },                                              // HOTFIX47
    climbTest: (k = 0, side = 1) => {
      const walls = S.boxes.filter((b) => wallOf(b)).sort((a, b) => b.hw - a.hw), b = walls[k]; if (!b) return { ok: false, why: 'no wall ' + k };
      const out = { wall: k, hw: +b.hw.toFixed(1), h: b.h, T: +(b.hd * 2).toFixed(1), log: [] }; let cam = 0, camBad = []; const step = () => { update(1 / 30); placeCamera(1 / 30); const cb = api.dev.camCheck(); if (cb.length) { cam++; if (camBad.length < 4) camBad.push(cb.join('+') + '@' + S.layer + ' y' + S.y.toFixed(1)); } };
      const [ex, ez] = wrd(b, 0, side * (b.hd + 3)); api.dev.setPos(ex, ez, Math.atan2(-side * b.vx, -side * b.vz)); S.inp.x = 0; S.inp.y = 1; S.camYaw = Math.atan2(-side * b.vx, -side * b.vz);
      let t = 0; while (t < 40 && S.layer !== 'top') { step(); t += 1 / 30; if (S.layer === 'climb' && !out.climbStart) out.climbStart = +t.toFixed(1); } out.top = S.layer === 'top'; out.tClimb = +t.toFixed(1); out.y = +S.y.toFixed(2); out.topY = +topY(b).toFixed(2);
      if (!out.top) { S.inp.y = 0; out.cam = cam; out.camBad = camBad; return out; }
      out.tMantle = 0; S.inp.y = 0; for (let i = 0; i < 20; i++) step();
      let maxV = 0, minU = 1e9, maxU = -1e9, ground = 0, pieces = new Set();
      for (const dirn of [1, -1]) { S.camYaw = Math.atan2(dirn * b.ux, dirn * b.uz); S.inp.y = 1; let tt = 0; while (tt < 40) { step(); tt += 1 / 30; const [u, v] = loc(S.top || b, S.x, S.z); if (S.top) pieces.add(S.top.x.toFixed(0) + ',' + S.top.z.toFixed(0)); maxV = Math.max(maxV, Math.abs(v)); const [bu] = loc(b, S.x, S.z); minU = Math.min(minU, bu); maxU = Math.max(maxU, bu); if (S.layer !== 'top') { ground++; break; } if (tt > 3 && S.speed < 0.2) break; } }
      out.walked = { u: [+minU.toFixed(1), +maxU.toFixed(1)], maxLat: +maxV.toFixed(2), pieces: pieces.size, leftTop: ground }; S.inp.y = 0;
      if (S.layer === 'top') { const bb = S.top; S.camYaw = Math.atan2(-bb.vx * (-side), -bb.vz * (-side)); S.inp.y = 1; let td = 0; while (td < 40 && S.layer !== 0) { step(); td += 1 / 30; } out.down = S.layer === 0; out.tDown = +td.toFixed(1); out.yEnd = +S.y.toFixed(2); out.groundEnd = +world.fastHeight(S.x, S.z).toFixed(2); S.inp.y = 0; }
      out.cam = cam; out.camBad = camBad; return out;
    },
    // a spot `d` m from the face of the k-th longest wall piece (side +1 / -1), `u` m along it, and the yaw that looks at the wall
    wallSpot: (k = 0, side = 1, d = 3, u = 0) => { const b = S.boxes.filter((q) => wallOf(q)).sort((a, c) => c.hw - a.hw)[k]; if (!b) return null; const [x, z] = wrd(b, u, side * (b.hd + d)); return { x, z, yaw: Math.atan2(-side * b.vx, -side * b.vz), along: Math.atan2(b.ux, b.uz), h: b.h, T: b.hd * 2 }; },
    near: () => S.near && { ...S.near }, nearNow: () => nearSheet(), tickNear: () => { S.nearT = 0; sheetTick(0.001); return S.near && { ...S.near }; }, useNear, sheetOn: () => S.sheetOn,
    // proof / test: for every pick and every lot that has a sheet, stand 1.5 m from its nearest face and ask for the button (must name that id, or a closer sheet)
    doorItems: () => {
      const sh = H.sheets, items = [];
      for (const p of world.picks || []) if (!NEAR_SKIP.has(p.id) && sh.can(p.id, H.SM)) { const b = p.box; items.push({ id: p.id, cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2, hx: (b.max.x - b.min.x) / 2, hz: (b.max.z - b.min.z) / 2, rot: 0 }); }
      for (const l of sh.lots()) if (sh.can(l.id, H.SM)) items.push({ id: l.id, cx: l.x, cz: l.z, hx: l.w / 2, hz: l.d / 2, rot: l.ry });
      return items;
    },
    doorSpot: (it, gap = 1.5) => {
      const c = Math.cos(it.rot), sn = Math.sin(it.rot);
      for (let a = 0; a < 6.28; a += 0.5) { const lx = Math.cos(a), lz = Math.sin(a), k = Math.max(Math.abs(lx) / it.hx, Math.abs(lz) / it.hz) || 1, n = Math.hypot(lx, lz), ox = lx / k + (lx / n) * gap, oz = lz / k + (lz / n) * gap; const px = it.cx + ox * c + oz * sn, pz = it.cz - ox * sn + oz * c; if (free(px, pz, W(), true) && waterDepth(px, pz) < 0.3) return [px, pz]; }
      return null;
    },
    goNear: (id, gap = 1.5) => { const it = api.dev.doorItems().find((q) => q.id === id); if (!it) return null; const sp = api.dev.doorSpot(it, gap); if (!sp) return null; api.dev.setPos(sp[0], sp[1], Math.atan2(it.cx - sp[0], it.cz - sp[1])); return sp; },
    doorTest: (gap = 1.5) => {
      const out = [];
      for (const it of api.dev.doorItems()) {
        const spot = api.dev.doorSpot(it, gap); if (!spot) { out.push({ id: it.id, ok: false, why: 'no free spot' }); continue; }
        api.dev.setPos(spot[0], spot[1], 0); const n = nearSheet(); out.push({ id: it.id, ok: !!n && (n.id === it.id || n.d <= gap + 0.1), got: n && n.id, d: n && +n.d.toFixed(2) });
      }
      return out;
    },
    pause: (b) => { S.paused = !!b; }, fixed: (dt) => { S.fixed = dt; },
    goUnder, goHome, door: () => S.door && { x: S.door.x, z: S.door.z, nx: S.door.nx, nz: S.door.nz, y: S.door.y },
    boxes: () => S.boxes.length, free, W: () => W(),
    reach(cell = 1) {                                                                                   // BFS over the home map from where the hero stands: which cells can a body reach, and can it reach the door?
      const wd = homeWorld, R = 335, N = Math.ceil((R * 2) / cell), idx = (i, j) => j * N + i, seen = new Uint8Array(N * N); const x0 = -R, q = []; const ci = (v) => Math.floor((v - x0) / cell);
      const si = ci(S.x), sj = ci(S.z); q.push(si, sj); seen[idx(si, sj)] = 1; let cnt = 0, doorHit = false, hx = 0, hz = 0; const D = S.door;
      for (let h = 0; h < q.length; h += 2) {
        const i = q[h], j = q[h + 1], x = x0 + (i + 0.5) * cell, z = x0 + (j + 0.5) * cell; cnt++;
        if (D && Math.hypot(x - D.x - D.nx * 0.3, z - D.z - D.nz * 0.3) < D.R) { doorHit = true; hx = x; hz = z; }
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || seen[idx(ni, nj)]) continue; const nx = x0 + (ni + 0.5) * cell, nz = x0 + (nj + 0.5) * cell; if (!free(nx, nz, wd)) continue; if (Math.abs(wd.ground(nx, nz) - wd.ground(x, z)) > 1.1 * cell) continue; seen[idx(ni, nj)] = 1; q.push(ni, nj); }
      }
      return { cells: cnt, doorHit, hx, hz };
    },
    walkTo(tx, tz, maxSec = 150, opt = {}) {                                                                      // proof: BFS path over the free cells, then walk it with the real physics (steering only)
      const wd = homeWorld, sw = !!opt.swim, gh = (x, z) => { const g = wd.ground(x, z); return sw && g < WSURF ? WSURF : g; }, cell = 1, R = 440, N = Math.ceil((R * 2) / cell), x0 = -R, idx = (i, j) => j * N + i, ci = (v) => Math.floor((v - x0) / cell), par = new Int32Array(N * N).fill(-2);
      const si = ci(S.x), sj = ci(S.z), ti = ci(tx), tj = ci(tz); let q, found = false;
      const clr = (x, z) => free(x + 1, z, wd, sw) && free(x - 1, z, wd, sw) && free(x, z + 1, wd, sw) && free(x, z - 1, wd, sw);          // a cell 1 m clear of water and colliders (the first try keeps off the shore: a body has momentum)
      for (let pass = 0; pass < 2 && !found; pass++) {
        par.fill(-2); q = [idx(si, sj)]; par[idx(si, sj)] = -1;
        for (let h = 0; h < q.length && !found; h++) {
          const k = q[h], i = k % N, j = (k / N) | 0, x = x0 + (i + 0.5) * cell, z = x0 + (j + 0.5) * cell;
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || par[idx(ni, nj)] !== -2) continue; const nx = x0 + (ni + 0.5) * cell, nz = x0 + (nj + 0.5) * cell;
            if (!free(nx, nz, wd, sw) || ((gh(nx, nz) - gh(x, z)) > 0.75 * cell * Math.hypot(di, dj) || (gh(x, z) - gh(nx, nz)) > 1.6 * cell * Math.hypot(di, dj)) || (di && dj && (!free(x + di * cell, z, wd, sw) || !free(x, z + dj * cell, wd, sw)))) continue;
            if (pass === 0 && !(ni === ti && nj === tj) && !clr(nx, nz)) continue;
            par[idx(ni, nj)] = k; q.push(idx(ni, nj)); if (ni === ti && nj === tj) { found = true; break; }
          }
        }
      }
      if (!found) return { ok: false, why: 'no path' };
      const pts = []; for (let k = idx(ti, tj); k >= 0; k = par[k]) pts.push([x0 + ((k % N) + 0.5) * cell, x0 + (((k / N) | 0) + 0.5) * cell]); pts.reverse();
      let wi = 1, t = 0, chk = 2, stuck = 0, lx = S.x, lz = S.z, cv = 0; S.inp.x = 0;
      while (t < maxSec && wi < pts.length) {
        let li = Math.min(pts.length - 1, wi + 1);                                              // steer to the farthest of the next 3 waypoints she can walk to in a straight line over free dry ground
        for (let k = Math.min(pts.length - 1, wi + 5); k > wi; k--) { const px = pts[k][0], pz = pts[k][1], n = Math.ceil(Math.hypot(px - S.x, pz - S.z) / 0.4); let ok = true; for (let m = 1; m <= n && ok; m++) ok = free(S.x + ((px - S.x) * m) / n, S.z + ((pz - S.z) * m) / n, wd, sw); if (ok) { li = k; break; } }
        const look = pts[li], dx = look[0] - S.x, dz = look[1] - S.z; S.camYaw = Math.atan2(dx, dz); S.inp.y = opt.speed || 0.7;
        update(1 / 30); placeCamera(1 / 30); t += 1 / 30; if (api.dev.camCheck().length) cv++;
        { let best = wi, bd = 1e9; for (let k = wi; k < Math.min(pts.length, wi + 16); k++) { const d = Math.hypot(pts[k][0] - S.x, pts[k][1] - S.z); if (d < bd) { bd = d; best = k; } } if (bd < 3) wi = Math.min(pts.length - 1, best + 1); }       // (follow the path point closest to her, never one she has already passed)
        if (wi >= pts.length - 1 && Math.hypot(pts[pts.length - 1][0] - S.x, pts[pts.length - 1][1] - S.z) < 1.6) break;
        if (t >= chk) { chk += 2; if (Math.hypot(S.x - lx, S.z - lz) < 0.5) stuck++; else stuck = 0; lx = S.x; lz = S.z; if (stuck > 2) { S.inp.y = 0; return { ok: false, why: 'stuck', cam: cv, x: S.x, z: S.z, y: S.y, t, pathLen: pts.length, wp: pts[wi], wp2: pts[Math.min(pts.length - 1, wi + 2)], wi }; } }
      }
      S.inp.y = 0; return { ok: Math.hypot(tx - S.x, tz - S.z) < 3, x: S.x, z: S.z, t: +t.toFixed(1), pathLen: pts.length, cam: cv };
    },
    // RP1B: the reach map.  Every `cell` metres of the home map (-440..440) is classed: water / building (a collider) / too steep / reachable from where she stands / land she cannot reach (the bug list).
    // Same rules as the body: free() for water, the map edge and colliders, and the climb limit of tryMove (a rise above 0.85 x run + 0.06 stops her).  Returns the counts, the unreachable land in blobs, and a PNG.
    reachMap(cell = 2, opt = {}) {
      const wd = homeWorld, R = 440, N = Math.ceil((R * 2) / cell), x0 = -R, idx = (i, j) => j * N + i, cx = (i) => x0 + (i + 0.5) * cell;
      const cls = new Uint8Array(N * N);                                    // 0 unseen, 1 water, 2 building/collider, 3 steep, 4 reachable, 5 land but not reached, 6 outside the soft edge
      const g = new Float32Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) g[idx(i, j)] = wd.ground(cx(i), cx(j));
      const wet = new Uint8Array(N * N), blocked = new Uint8Array(N * N), steep = new Uint8Array(N * N), edge = opt.edge || EDGE_R;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = cx(i), z = cx(j), k = idx(i, j);
        if (Math.hypot(x, z) > edge) { cls[k] = 6; continue; }
        if (wd.wet(x, z)) { cls[k] = 1; wet[k] = 1; continue; }
        const p = { x, z }; if (pushOut(p, R_BODY - 0.02, wd)) { cls[k] = 2; blocked[k] = 1; continue; }
        let mx = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; mx = Math.max(mx, Math.abs(g[idx(ni, nj)] - g[k]) / cell); }
        if (mx > 0.88) { cls[k] = 3; steep[k] = 1; }
      }
      // BFS (4-neighbours) from the hero: a step is allowed when the target is dry, free and the climb is within the limit
      // opt.swim: deep water is a way too (she swims; leaving it she climbs out at most 1.1 m, the haul-out of tryMove) — the water cells stay blue in the picture, the land behind them turns green
      const si = Math.floor((S.x - x0) / cell), sj = Math.floor((S.z - x0) / cell), q = new Int32Array(N * N), wseen = new Uint8Array(N * N); let qh = 0, qt = 0; q[qt++] = idx(si, sj); cls[idx(si, sj)] = 4; let reach = 0;
      while (qh < qt) {
        const k = q[qh++], i = k % N, j = (k / N) | 0; if (cls[k] === 4) reach++;
        const base = Math.max(g[k], cls[k] === 1 ? WSURF : -1e9), inW = cls[k] === 1;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; const nk = idx(ni, nj);
          if (cls[nk] === 4 || cls[nk] === 2 || cls[nk] === 6 || wseen[nk]) continue;
          if (cls[nk] === 1) { if (!opt.swim) continue; wseen[nk] = 1; q[qt++] = nk; continue; }
          if (g[nk] - base > 0.85 * cell + 0.06 + (inW ? 1.1 : 0)) continue;
          if (opt.walkEdge && Math.hypot(cx(ni), cx(nj)) > opt.walkEdge) continue;                              // (the BEFORE map: the old hard 335 m circle)
          cls[nk] = 4; q[qt++] = nk;
        }
      }
      let land = 0, un = 0, wetN = 0, bld = 0, stp = 0; for (let k = 0; k < N * N; k++) { const c = cls[k]; if (c === 0 || c === 3) { if (c === 0) { cls[k] = 5; un++; land++; } else stp++; } else if (c === 4) land++; else if (c === 1) wetN++; else if (c === 2) bld++; }
      // the unreachable land in blobs (4-connected), biggest first, with a centre and the nearest site name
      const seen = new Uint8Array(N * N), blobs = [];
      for (let k = 0; k < N * N; k++) if (cls[k] === 5 && !seen[k]) { let sx = 0, sz = 0, n = 0, rmin = 1e9; const why = { water: 0, solid: 0, steep: 0, edge: 0, climb: 0 }, st = [k]; seen[k] = 1; while (st.length) { const a = st.pop(), i = a % N, j = (a / N) | 0; sx += cx(i); sz += cx(j); n++; rmin = Math.min(rmin, Math.hypot(cx(i), cx(j))); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; const nk = idx(ni, nj); if (cls[nk] === 5 && !seen[nk]) { seen[nk] = 1; st.push(nk); } else if (cls[nk] === 4) why.climb++; else if (cls[nk] === 1) why.water++; else if (cls[nk] === 2) why.solid++; else if (cls[nk] === 3) why.steep++; else if (cls[nk] === 6) why.edge++; } } blobs.push({ n, area: n * cell * cell, x: Math.round(sx / n), z: Math.round(sz / n), rmin: Math.round(rmin), why }); }
      blobs.sort((a, b) => b.n - a.n);
      S._cls = { cls, N, x0, cell };
      const out = { cell, edge, swim: !!opt.swim, landCells: land, reach, unreach: un, steep: stp, water: wetN, solid: bld, reachPct: +((reach / land) * 100).toFixed(2), landArea_m2: land * cell * cell, reachArea_m2: reach * cell * cell, blobs: blobs.slice(0, opt.nb || 25) };
      if (opt.png !== false) {
        const sc = opt.scale || 2, cv = document.createElement('canvas'); cv.width = cv.height = N * sc; const c2 = cv.getContext('2d'), im = c2.createImageData(N * sc, N * sc);
        const COL = [[20, 20, 28], [40, 90, 200], [70, 70, 80], [140, 110, 70], [60, 200, 90], [235, 50, 50], [10, 10, 16]];
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const col = COL[cls[idx(i, j)]]; for (let dy = 0; dy < sc; dy++) for (let dx = 0; dx < sc; dx++) { const o = ((j * sc + dy) * N * sc + i * sc + dx) * 4; im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255; } }
        c2.putImageData(im, 0, 0); c2.font = '10px sans-serif'; c2.fillStyle = '#fff'; c2.strokeStyle = '#000';
        for (const p of (opt.marks || [])) { const px = (p[1] - x0) / cell * sc, pz = (p[2] - x0) / cell * sc; c2.fillStyle = '#ffe14a'; c2.fillRect(px - 2, pz - 2, 5, 5); c2.fillStyle = '#fff'; c2.fillText(p[0], px + 4, pz + 3); }
        out.png = cv.toDataURL('image/png');
      }
      return out;
    },
    // RP1B proof tool: a top-down picture of a square of the home map (the real scene, orthographic) with the colliders drawn over it (boxes red, discs blue, her reach green dots optional)
    topdown(cx, cz, size = 130, px = 1024, opt = {}) {
      const rt = new T.WebGLRenderTarget(px, px, { samples: 0 }), oc = new T.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 1, 900);
      oc.position.set(cx, 500, cz); oc.up.set(0, 0, -1); oc.lookAt(cx, 0, cz); oc.updateMatrixWorld();
      const hv = S.hero ? S.hero.grp.visible : false; if (S.hero) S.hero.grp.visible = false; const pr = renderer.getRenderTarget(), tm = renderer.toneMapping, fog = scene.fog; scene.fog = null;
      renderer.setRenderTarget(rt); renderer.render(scene, oc); renderer.setRenderTarget(pr); scene.fog = fog; if (S.hero) S.hero.grp.visible = hv;
      const buf = new Uint8Array(px * px * 4); renderer.readRenderTargetPixels(rt, 0, 0, px, px, buf); rt.dispose(); void tm;
      const cv = document.createElement('canvas'); cv.width = cv.height = px; const c2 = cv.getContext('2d'), im = c2.createImageData(px, px);
      for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) { const a = ((px - 1 - y) * px + x) * 4, b = (y * px + x) * 4; for (let k = 0; k < 3; k++) im.data[b + k] = Math.min(255, 255 * Math.pow(buf[a + k] / 255, 1 / 2.2)); im.data[b + 3] = 255; }
      c2.putImageData(im, 0, 0);
      const X = (x) => ((x - (cx - size / 2)) / size) * px, Z = (z) => ((z - (cz - size / 2)) / size) * px;
      if (opt.overlay !== false) {
        c2.lineWidth = 2;
        for (const b of S.boxes) { if (Math.abs(b.x - cx) > size && Math.abs(b.z - cz) > size) continue; c2.strokeStyle = b.type === 'wall' || b.type === 'gate' || b.type === 'tower' ? '#ff9a2a' : '#ff2a2a'; c2.beginPath(); const cs = Math.cos(b.rot), sn = Math.sin(b.rot); const pts = [[-b.hw, -b.hd], [b.hw, -b.hd], [b.hw, b.hd], [-b.hw, b.hd]].map(([u, v]) => [b.x + u * b.ux + v * b.vx, b.z + u * b.uz + v * b.vz]); void cs; void sn; pts.forEach((q, i) => (i ? c2.lineTo(X(q[0]), Z(q[1])) : c2.moveTo(X(q[0]), Z(q[1])))); c2.closePath(); c2.stroke(); }
        c2.strokeStyle = '#38a0ff'; for (const d of S.discs) { if (Math.abs(d[0] - cx) > size / 2 + 20 || Math.abs(d[1] - cz) > size / 2 + 20) continue; c2.beginPath(); c2.arc(X(d[0]), Z(d[1]), (d[2] / size) * px, 0, 7); c2.stroke(); }
      }
      for (const q of (opt.shapes || [])) { c2.strokeStyle = q.col || '#0ff'; c2.lineWidth = 2; c2.beginPath(); if (q.t === 'c') c2.arc(X(q.x), Z(q.z), (q.r / size) * px, 0, 7); else { const c = Math.cos(q.ry || 0), sn = Math.sin(q.ry || 0); [[-q.w / 2, -q.d / 2], [q.w / 2, -q.d / 2], [q.w / 2, q.d / 2], [-q.w / 2, q.d / 2]].forEach(([u, v], i) => { const wx = q.x + u * c + v * sn, wz = q.z - u * sn + v * c; i ? c2.lineTo(X(wx), Z(wz)) : c2.moveTo(X(wx), Z(wz)); }); c2.closePath(); } c2.stroke(); }
      for (const m of (opt.marks || [])) { c2.fillStyle = '#ffe14a'; c2.fillRect(X(m[1]) - 3, Z(m[2]) - 3, 7, 7); c2.fillStyle = '#fff'; c2.font = '14px sans-serif'; c2.fillText(m[0], X(m[1]) + 6, Z(m[2]) + 4); }
      return cv.toDataURL('image/png');
    },
    start, exit, gates: () => S.boxes.filter((b) => b.type === 'gate').map((b) => [+b.x.toFixed(1), +b.z.toFixed(1), +b.hw.toFixed(1), +b.hd.toFixed(1)]),
    peek: (id) => H.sheets && H.sheets.peek ? H.sheets.peek(id, H.SM) : 'no-peek',
    doors: () => doors, tapDoor, planLocal, openDoor, autoState: () => S.auto && { id: S.auto.id, t: +S.auto.t.toFixed(1), wi: S.auto.wi, n: S.auto.pts.length }, act: () => S.act && { ...S.act },
    diet: () => diet, cull: () => cull, perf: () => ({ ...stats, f: undefined }), stats: () => (S.under ? S.under.stats() : null),
  };
  return api;
}
