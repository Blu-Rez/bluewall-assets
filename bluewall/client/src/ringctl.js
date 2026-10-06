// The ring control scheme (owner 5 Oct 14:50, «دقیقا مثل نحوه حمله سیجفال»): the rings around the squads are the controls.
//   · press a ring and drag: that squad walks to where the finger lets go (a dotted arrow and a ghost ring show where)
//   · hold the finger on a ring for ~0.6 s without moving: every ring is taken together; the drag then moves them all (their offsets kept)
//   · hold the finger on the TARGET ~0.8 s before letting go: the target stays (a ghost ring with the squad's icon) and the squad waits.  The waiting squads go together
//     when the LAST squad's target has been placed, or one alone when its ring is tapped; a tap on a waiting ghost cancels that target
// p35 (K1): a SOLDIER squad takes an order only once — after it has gone its ring is no handle (a press on it is the camera's); only the heroes are sent again and again.
// Pure client side: it only writes `rc` (what the picture shows: battle.js ringGhosts / ringView) and calls send(type, x, z) at the moment a squad really goes —
// the sim stays untouched, pure and deterministic.
const HOLD_ALL = 0.6, HOLD_STAGE = 0.8, STAGE_FROM = 0.25, DRAG_PX = 9, STILL_PX = 8, TAP_S = 0.45, TOUCH_R = 22;       // (TOUCH_R: 22 px radius = a 44 px finger target)

export function createRingControl({ rc, types, sim, rings, camera, pad, ground, H, send, nav = null, vibrate = () => {}, tone = () => {} }) {
  let g = null;
  const now = () => performance.now() / 1000;
  const live = (t) => sim.alive(t) > 0;
  const sendable = (t) => live(t) && sim.canSend(t);                                // (p35 K1: a soldier squad that has been sent has no handle any more — only the heroes can be sent again and again)
  const launched = (t) => sim.units.some((u) => u.type === t && !u.dead && u.hp > 0 && u.active);
  const clampF = (x, z) => { const f = sim.field; return [Math.max(f.x0 + 4, Math.min(f.x1 - 4, x)), Math.max(f.z0 + 4, Math.min(f.z1 - 4, z))]; };

  // where the squad will REALLY stand: inside the field, and (ground squads) not in the water — the same rule sim.send applies, so the ghost shows the true spot
  function place(t, x, z) {
    const [cx, cz] = clampF(x, z); if (!nav || !(nav.isBlocked || nav.isWet)(cx, cz)) return [cx, cz];
    const u = sim.units.find((q) => q.type === t && !q.dead && q.hp > 0); return u && u.air ? [cx, cz] : nav.nearestDry(cx, cz);
  }
  // which ring (or waiting ghost) is under the finger?  Tested on the ground, with a footprint of at least 44 px on the screen however far the camera is.
  function pick(items, x, y) {
    const p = ground(x, y); if (!p) return null;
    const px = p.x, pz = p.z, k = (2 * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, pad.getBoundingClientRect().height);
    let best = null, bd = 1e9;
    for (const it of items) {
      const dx = camera.position.x - it.cx, dy = camera.position.y - H(it.cx, it.cz), dz = camera.position.z - it.cz, dist = Math.hypot(dx, dy, dz) || 1;
      const sinP = Math.max(0.3, Math.min(1, dy / dist)), reff = Math.max(it.r, (TOUCH_R * k * dist) / sinP), d = Math.hypot(px - it.cx, pz - it.cz) / reff;
      if (d <= 1 && d < bd) { bd = d; best = it; }
    }
    return best;
  }
  const ringItems = () => types.filter(sendable).map((t) => { const i = rings.info(t); return i ? { t, cx: i.cx, cz: i.cz, r: i.r } : null; }).filter(Boolean);
  const stagedItems = () => Object.keys(rc.staged).map((t) => { const i = rings.info(t); return i ? { t, cx: rc.staged[t].x, cz: rc.staged[t].z, r: i.r } : null; }).filter(Boolean);

  // every waiting squad goes
  function flush() { for (const t of Object.keys(rc.staged)) { const o = rc.staged[t]; delete rc.staged[t]; send(t, o.x, o.z); } }
  // "the target of the LAST squad has been placed": no live squad is left that has not gone and has no waiting target → all waiting squads go together
  function check() { if (!Object.keys(rc.staged).length) return; if (!types.some((t) => live(t) && !launched(t) && !rc.staged[t])) flush(); }
  function go(t) { const o = rc.staged[t]; if (!o) return; delete rc.staged[t]; send(t, o.x, o.z); }

  // the holds are read from the clock (not only once per frame): a slow frame must never turn a hold into a quick send
  function holds() {
    if (!g || g.kind !== 'ring') return;
    const t = now();
    if (!g.moved && !g.all && t - g.t0 >= HOLD_ALL) { g.all = true; rc.lit = new Set(ringItems().map((i) => i.t)); vibrate(15); tone(); }
    if (g.moved && rc.drag) {
      const still = t - g.at; rc.drag.prog = Math.max(0, Math.min(1, (still - STAGE_FROM) / (HOLD_STAGE - STAGE_FROM)));
      if (!g.stage && still >= HOLD_STAGE) { g.stage = true; vibrate(15); tone(); }
    }
  }
  function begin() {                                                              // the finger has left the press point: the drag starts
    const hit = rings.info(g.t), tp = g.all ? types.filter((t) => sendable(t) && rings.info(t)) : [g.t], off = {};
    for (const t of tp) { const i = rings.info(t); off[t] = [i.cx - hit.cx, i.cz - hit.cz]; delete rc.staged[t]; }       // (a squad dragged again drops its old waiting target)
    rc.drag = { types: tp, x: hit.cx, z: hit.cz, off, prog: 0 };
  }

  return {
    place,
    get active() { return !!g; },
    owns(id) { return !!g && g.id === id; },
    down(id, x, y) {
      if (g) return false;
      const mk = pick(stagedItems(), x, y);
      if (mk) { g = { id, kind: 'marker', t: mk.t, sx: x, sy: y, t0: now(), moved: false }; return true; }
      const r = pick(ringItems(), x, y); if (!r) return false;
      g = { id, kind: 'ring', t: r.t, sx: x, sy: y, ax: x, ay: y, t0: now(), at: now(), moved: false, all: false, stage: false };
      return true;
    },
    move(id, x, y) {
      if (!g || g.id !== id) return;
      if (g.kind === 'marker') { if (Math.hypot(x - g.sx, y - g.sy) > DRAG_PX) g.moved = true; return; }
      if (!g.moved && Math.hypot(x - g.sx, y - g.sy) > DRAG_PX) { holds(); g.moved = true; begin(); }
      if (!g.moved || !rc.drag) return;
      const p = ground(x, y); if (p) { const [cx, cz] = clampF(p.x, p.z); rc.drag.x = cx; rc.drag.z = cz; }
      if (Math.hypot(x - g.ax, y - g.ay) > STILL_PX) { g.ax = x; g.ay = y; g.at = now(); g.stage = false; rc.drag.prog = 0; }      // (the finger moves on: the hold starts again)
    },
    // returns what happened: 'send' | 'stage' | 'go' | 'cancelled' | 'tap' (a plain tap: battle.js may use it for a spell) | 'none' | 'cancel'
    up(id, x, y, ok = true) {
      if (!g || g.id !== id) return null;
      holds(); const k = g, d = rc.drag; g = null; rc.drag = null; rc.lit = new Set();
      if (!ok) return 'cancel';
      if (k.kind === 'marker') { if (!k.moved && now() - k.t0 < TAP_S) { delete rc.staged[k.t]; tone(); return 'cancelled'; } return 'none'; }
      if (!k.moved) {
        if (k.all) return 'none';
        if (now() - k.t0 < TAP_S) { if (rc.staged[k.t]) { go(k.t); return 'go'; } return 'tap'; }
        return 'none';
      }
      if (!d) return 'none';
      if (k.stage) {
        for (const t of d.types) { const o = d.off[t] || [0, 0], [cx, cz] = place(t, d.x + o[0], d.z + o[1]); rc.staged[t] = { x: cx, z: cz }; }
        check(); return 'stage';
      }
      for (const t of d.types) { const o = d.off[t] || [0, 0], [cx, cz] = place(t, d.x + o[0], d.z + o[1]); delete rc.staged[t]; send(t, cx, cz); }
      check(); return 'send';
    },
    cancel() { if (!g) return; g = null; rc.drag = null; rc.lit = new Set(); },
    // every frame: the holds
    update() {
      for (const t of Object.keys(rc.staged)) if (!live(t)) delete rc.staged[t];            // (a squad that fell has no waiting target)
      holds();
    },
  };
}
