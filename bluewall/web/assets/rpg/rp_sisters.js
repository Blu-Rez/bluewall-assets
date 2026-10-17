// rp_sisters.js — RS1: the six sisters together in hero mode (at level 50 the player owns aylar aylin elika elina melika mobina).
//
//  STAGE A  a strip of six cards (the pick screen's own c_<k>.webp, 46 x 54 px, top-right of the hero HUD) + one switch.  One touch hands control to that sister without leaving hero mode:
//           her glb is fetched + parsed WHILE the sister in play keeps walking (only a small spinner on the card), her textures go to the GPU one frame before she is shown, then one frame swaps the two models at the
//           same spot (same camera, same HUD, same stick) and the old one is FREED (geometry, textures, skeleton, mixer).  Nothing but the sister in play is resident: no glb is preloaded, none is kept.
//  STAGE B  (the switch at the strip's end, default OFF, remembered) every sister who was left somewhere STANDS there: idle, solid (a disc in the collision list), drawn only when she is near and in view.
//           A stand-in is a cut-down copy: 1024 px texture (4x less GPU memory), ONE idle clip shared by all of them (one AnimationClip object), a pose update at 15 / 7 / 3.5 Hz by distance and none at all out of view,
//           no sun-shadow cast (one call less), her matrices frozen between two pose updates, loaded only when she is within LOAD_R of the player and freed again when she is far.  At most MAXN are resident (the governor can cut it).
//           Touch a card = go to her (the sister in play stays exactly where she is); hold a card ~0.5 s = bring her to the sister in play (a free spot beside her).
//           The places are the client's (localStorage `bw_rs_v1`); the server half is a spec in REPORT_RS1.md (nothing of it is built here).
//  The model swap itself (it touches rpg.js's locals: scene, marker, diet, S.models) is rpg.js `swapHero` (marked `// RS1:`); this file owns the strip, the stand-ins, the memory rules and the places.
const STORE = 'bw_rs_v1';
const CARD_W = 46, CARD_H = 54, HOLD_MS = 500;
const CSS = (top) => `
.rs-strip{position:absolute;z-index:44;right:max(10px,var(--hr,0px));top:calc(var(--ht,${top}) + 5px);display:flex;align-items:flex-start;gap:4px;pointer-events:none;direction:ltr}
.rs-c{position:relative;flex:none;width:${CARD_W}px;height:${CARD_H}px;padding:0;margin:0;border-radius:9px;border:1.5px solid rgba(205,214,224,.5);background:#222 center/cover no-repeat;box-shadow:0 2px 8px rgba(0,0,0,.55);pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer;overflow:hidden;opacity:.88;transition:transform .12s,opacity .12s}
.rs-c.on{opacity:1;border-color:var(--ac);box-shadow:0 0 12px var(--ac),0 2px 8px rgba(0,0,0,.55);transform:translateY(2px)}
.rs-c:active{transform:scale(.94)}
.rs-c i{position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--ac);opacity:.9}
.rs-c u{position:absolute;right:3px;top:3px;width:9px;height:9px;border-radius:50%;background:#3df5e0;box-shadow:0 0 6px #3df5e0,0 0 0 1.5px rgba(0,0,0,.6);display:none;text-decoration:none}
.rs-c.st u{display:block}
.rs-c.ld{filter:brightness(.6)}
.rs-c.ld:after{content:"";position:absolute;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:rsSpin .8s linear infinite}
.rs-t{position:relative;flex:none;width:44px;height:44px;padding:0;margin:0;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.2);color:#e6ecf2;display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer}
.rs-t svg{width:56%;height:56%;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.rs-t.on{color:#3df5e0;border-color:#3df5e0;box-shadow:0 0 16px rgba(61,245,224,.6),inset 0 0 12px rgba(61,245,224,.2)}
.rs-t:active{transform:scale(.92)}
.rs-hint{position:absolute;z-index:44;right:max(10px,var(--hr,0px));top:calc(var(--ht,${top}) + 69px);max-width:250px;padding:3px 8px;border-radius:8px;background:rgba(5,15,25,.72);color:#dff;font:600 11px/1.5 Vazirmatn,system-ui,sans-serif;direction:rtl;text-align:right;pointer-events:none;opacity:0;transition:opacity .25s}
.rs-hint.on{opacity:1}
@keyframes rsSpin{to{transform:rotate(360deg)}}`;
const ICON = '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3.2 2.4-5.3 5.5-5.3s5.5 2.1 5.5 5.3"/><circle cx="17.2" cy="9.2" r="2.3"/><path d="M16.3 14.4c2.5.1 4.2 1.8 4.2 4.4"/></svg>';
const TXT = { hint: 'لمس کارت: رفتن پیش او · نگه‌داشتن: آوردنش کنار تو', on: 'همهٔ خواهرها هرجا مانده‌اند می‌ایستند', off: 'خواهرها فقط یکی‌یکی (جابه‌جایی همان‌جا)', ground: 'برای جابه‌جایی روی زمین بایست (نه در آب و نه روی دیوار)' };

// ---- pure helpers (the node test imports them)
export const readPrefs = (raw) => {                                       // the stored shape: { v: 1, on: 0 | 1, p: { key: [x, z, yaw] }, h: hint count, t: ms of the last change (the server half, if there ever is one, merges by it) }
  const o = { on: false, p: {}, h: 0, t: 0 }; let j = null; try { j = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { j = null; }
  if (!j || typeof j !== 'object') return o; o.on = !!j.on; o.h = Math.max(0, Math.min(9, j.h | 0)); o.t = typeof j.t === 'number' && isFinite(j.t) && j.t > 0 ? j.t : 0;
  if (j.p && typeof j.p === 'object') for (const k of Object.keys(j.p)) { const a = j.p[k]; if (Array.isArray(a) && a.length >= 3 && a.slice(0, 3).every((n) => typeof n === 'number' && isFinite(n)) && Math.abs(a[0]) < 5000 && Math.abs(a[1]) < 5000) o.p[k] = [a[0], a[1], a[2]]; }
  return o;
};
export const writePrefs = (o) => JSON.stringify({ v: 1, on: o.on ? 1 : 0, h: o.h | 0, t: o.t || 0, p: o.p });
// rate of a stand-in's pose update by distance (Hz; 0 = none): the nearer, the smoother
export const rateAt = (d) => (d < 20 ? 15 : d < 45 ? 7 : 3.5);

// free everything a model of rpg.js `loadHero` holds (the two shared contact-shadow assets — blob / sh / fr — belong to the module, not to her)
export function freeModel(m) {
  if (!m || m.rsFreed) return; m.rsFreed = true;
  try { if (m.mixer) { m.mixer.stopAllAction(); m.mixer.uncacheRoot(m.model); } } catch (e) { /* nothing to undo */ }
  if (m.grp) m.grp.removeFromParent();
  if (m.model) m.model.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.skeleton) o.skeleton.dispose();
    if (o.material) for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
      for (const p in mt) { const t = mt[p]; if (t && t.isTexture) { try { const im = t.image; t.dispose(); if (im && im.close) im.close(); } catch (e) { /* already gone */ } } }
      mt.dispose();
    }
  });
  m.clips = null; m.acts = null; m.rise = null; m.toes = null; m.ik = null;
}

export function createSisters(H, S, G) {
  const T = H.THREE, camera = H.camera, scene = H.scene, SIS = G.SIS, KEYS = SIS.map((s) => s.k);
  const st = { on: false, stand: false, busy: false, ld: null, places: {}, hint: 0, last: 0, shown: true, saveT: 0, hintT: 0, sync: 0, excl: null, mx: 0 };
  const ents = {};                                                      // key -> { key, m (model | null), load (promise | null), x, z, y, yaw, vis, acc, ph }
  let strip = null, hint = null, styleEl = null, cards = {}, tog = null, idleClip = null;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const accent = (k) => (SIS.find((s) => s.k === k) || SIS[0]).c;

  // ---------------------------------------------------------------- prefs (client side)
  function loadPrefs() { let raw = null; try { raw = localStorage.getItem(STORE); } catch (e) { /* blocked */ } const o = readPrefs(raw); st.stand = o.on; st.places = o.p; st.hint = o.h; st.t = o.t; }
  function savePrefs() { st.t = Date.now(); try { localStorage.setItem(STORE, writePrefs({ on: st.stand, p: st.places, h: st.hint, t: st.t })); } catch (e) { /* blocked: this session only */ } }
  // the seam for a server half (spec in REPORT_RS1.md; nothing of it is built here): snapshot() = what to store, adopt(json) = a newer copy from the server (ignored when older than ours)
  const snapshot = () => JSON.parse(writePrefs({ on: st.stand, p: st.places, h: st.hint, t: st.t }));
  function adopt(j) { const o = readPrefs(j); if (!o.t || o.t <= (st.t || 0)) return false; st.stand = o.on; st.places = o.p; st.t = o.t; try { localStorage.setItem(STORE, writePrefs({ ...o, h: st.hint })); } catch (e) { /* blocked */ } if (st.on) { for (const k of Object.keys(ents)) dropEnt(k); if (st.stand) for (const k of Object.keys(st.places)) if (k !== S.key) ents[k] = mkEnt(k, st.places[k]); G.refresh(); paint(); } return true; }

  // ---------------------------------------------------------------- the strip
  function build() {
    if (strip) return;
    if (!styleEl) { styleEl = el('style'); styleEl.textContent = CSS(G.top); document.head.appendChild(styleEl); }
    strip = el('div', 'rs-strip rp-k'); strip.dataset.rs = 'strip';
    tog = el('button', 'rs-t rp-k', ICON); tog.type = 'button'; tog.dataset.rs = 'toggle'; tog.setAttribute('aria-label', 'Sisters stand in the world'); strip.appendChild(tog);
    tog.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    tog.addEventListener('pointerup', (e) => { e.stopPropagation(); setStand(!st.stand, true); });
    for (const s of SIS) {
      const c = el('button', 'rs-c rp-k', '<i></i><u></u>'); c.type = 'button'; c.dataset.k = s.k; c.style.setProperty('--ac', s.c); c.setAttribute('aria-label', s.n);
      c.style.backgroundImage = `url(${G.base}c_${s.k}.webp${G.v})`; cards[s.k] = c; strip.appendChild(c);
      let hold = null, held = false;
      c.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation(); held = false; clearTimeout(hold);
        if (st.stand && s.k !== S.key) hold = setTimeout(() => { held = true; hold = null; bring(s.k); }, HOLD_MS);
      });
      const up = (e) => { e.stopPropagation(); clearTimeout(hold); hold = null; if (!held && e.type === 'pointerup') pick(s.k); held = false; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); c.addEventListener('pointerleave', () => { clearTimeout(hold); hold = null; });
    }
    hint = el('div', 'rs-hint rp-k'); hint.dataset.rs = 'hint';
    const h = G.hud(); h.appendChild(strip); h.appendChild(hint); paint();
  }
  function paint() {
    if (!strip) return;
    for (const k of KEYS) { const c = cards[k]; if (!c) continue; c.classList.toggle('on', k === S.key); c.classList.toggle('ld', st.ld === k); c.classList.toggle('st', !!(st.stand && st.places[k] && k !== S.key)); c.setAttribute('aria-pressed', k === S.key ? 'true' : 'false'); }
    tog.classList.toggle('on', st.stand); tog.setAttribute('aria-pressed', st.stand ? 'true' : 'false');
  }
  function say(t, ms = 5200) { if (!hint) return; hint.textContent = t; hint.classList.add('on'); clearTimeout(st.hintT); st.hintT = setTimeout(() => hint && hint.classList.remove('on'), ms); }
  const canSwitch = () => st.on && !st.busy && G.canSwitch();

  // ---------------------------------------------------------------- switching
  // a free spot beside the sister in play: right, left, in front, behind (1.7 m, then 2.4 m)
  function beside(x, z, yaw) {
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -Math.cos(yaw), rz = Math.sin(yaw);
    for (const d of [1.7, 2.4]) for (const [a, b] of [[rx, rz], [-rx, -rz], [fx, fz], [-fx, -fz]]) { const px = x + a * d, pz = z + b * d; if (G.free(px, pz)) return [px, pz]; }
    return null;
  }
  const pose = () => [S.x, S.z, S.body];
  const grounded = () => S.layer === 0 && !S.sw;                         // (stage B parks a sister where she stands: on the ground, not in the water, not on a wall-walk / ladder)
  async function pick(key) {
    if (!canSwitch() || key === S.key || !cards[key]) return false;
    if (st.stand && !grounded()) { say(TXT.ground); return false; }
    st.busy = true; st.ld = key; paint();
    try {
      const c = pose(), oldKey = S.key; let at = null, dest = st.stand ? st.places[key] : null;
      if (st.stand) {
        if (dest) { st.excl = key; G.refresh(); const p = G.spot(dest[0], dest[1]); at = { x: p[0], z: p[1], yaw: dest[2] }; }
        else { const b = beside(c[0], c[1], S.camYaw); if (!b) { say('جای خالی کنار تو نیست'); return false; } at = { x: b[0], z: b[1], yaw: c[2], keepCam: true }; }          // (no place yet: she steps out beside the sister in play; the camera moves with the control)
      }
      const r = await G.swap(key, at ? { at } : {});
      st.excl = null;
      if (!r) { if (st.stand) G.refresh(); return false; }
      if (st.stand) {
        const e = ents[key]; if (e) { dropEnt(key); }                                                         // (her stand-in made way for the full model)
        delete st.places[key]; park(oldKey, r.old, c);
      } else freeModel(r.old);
      st.sync++; savePrefs(); G.refresh();
      return true;
    } catch (e) { console.warn('sisters pick', e); st.excl = null; return false; }
    finally { st.busy = false; st.ld = null; paint(); }
  }
  // the sister who was in play stays where she stood: her model becomes a stand-in at once (no reload)
  function park(key, m, c) {
    st.places[key] = [c[0], c[1], c[2]];
    const e = ents[key] || (ents[key] = mkEnt(key)); e.x = c[0]; e.z = c[1]; e.yaw = c[2]; e.y = G.ground(c[0], c[1]);
    if (e.m) freeModel(e.m);
    e.m = standify(m); e.vis = false; e.m.grp.visible = false; placeEnt(e); scene.add(e.m.grp);                  // (hidden until the next tick has looked at the frustum: the draw of that frame comes after it)
  }
  // hold a card: she comes here (a free spot beside the sister in play); a sister who is resident is moved, one who is not is only given the new place
  function bring(key) {
    if (!st.stand || !canSwitch() || key === S.key) return false;
    if (!grounded()) { say(TXT.ground); return false; }
    const b = beside(S.x, S.z, S.camYaw); if (!b) { say('جای خالی کنار تو نیست'); return false; }
    st.places[key] = [b[0], b[1], S.body + Math.PI]; const e = ents[key] || (ents[key] = mkEnt(key)); e.x = b[0]; e.z = b[1]; e.yaw = S.body + Math.PI; e.y = G.ground(b[0], b[1]);
    if (e.m) placeEnt(e);
    savePrefs(); G.refresh(); paint(); return true;
  }
  function setStand(on, user) {
    on = !!on; if (on === st.stand) return;
    st.stand = on; savePrefs();
    if (on) { for (const k of Object.keys(st.places)) if (k !== S.key) ents[k] = ents[k] || mkEnt(k, st.places[k]); if (user && st.hint < 3) { st.hint++; savePrefs(); } say(st.hint <= 3 ? TXT.on + ' — ' + TXT.hint : TXT.on); }
    else { for (const k of Object.keys(ents)) dropEnt(k); say(TXT.off, 3200); }
    G.refresh(); paint();
  }

  // ---------------------------------------------------------------- stand-ins
  function mkEnt(key, p) { const e = { key, m: null, load: null, x: 0, z: 0, y: 0, yaw: 0, vis: false, acc: 0, ph: (KEYS.indexOf(key) * 0.37) % 1 }; if (p) { e.x = p[0]; e.z = p[1]; e.yaw = p[2]; } return e; }
  function dropEnt(key) { const e = ents[key]; if (!e) return; if (e.m) freeModel(e.m); e.m = null; e.gone = true; delete ents[key]; }
  // a texture over 1024 px is redrawn at 1024 (4x less GPU memory: ~5 MB instead of ~21 MB); the old GPU copy is deleted first (an immutable GL texture cannot change size)
  function shrink(m, px = 1024) {
    m.model.traverse((o) => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      for (const mt of Array.isArray(o.material) ? o.material : [o.material]) for (const p in mt) {
        const t = mt[p]; if (!t || !t.isTexture || t.userData.rsS || !t.image) continue; const im = t.image, w = im.width || im.naturalWidth || 0, h = im.height || im.naturalHeight || 0;
        t.userData.rsS = 1; if (w <= px || !h) continue;
        const c = document.createElement('canvas'); c.width = px; c.height = Math.max(1, Math.round(h * px / w)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        t.dispose(); t.image = c; t.needsUpdate = true; try { if (im.close) im.close(); } catch (e) { /* a plain image */ }
      }
    });
  }
  // she keeps ONE clip (the idle every sister shares: the first one that was ever read from the sister in play) and nothing else
  function standify(m) {
    if (!idleClip && m.acts && m.acts.idle) idleClip = m.acts.idle.a.getClip(); if (!idleClip && S.hero && S.hero.acts && S.hero.acts.idle) idleClip = S.hero.acts.idle.a.getClip();
    shrink(m);
    m.mixer.stopAllAction(); m.mixer.uncacheRoot(m.model); m.clips = null; m.rise = null; m.toes = null; m.ik = null;
    const a = m.mixer.clipAction(idleClip, m.model); a.setEffectiveTimeScale(0); a.setEffectiveWeight(1); a.play(); m.acts = { idle: { a, d: idleClip.duration, w: 1 } };
    m.model.rotation.x = 0; m.model.position.y = 0; if (m.head) m.head.scale.setScalar(1);
    m.grp.traverse((o) => { o.userData.rpHero = true; if (o.isMesh || o.isSkinnedMesh) { o.castShadow = false; } });
    if (m.sh) m.sh.visible = false; for (const f of m.fr || []) f.visible = false;
    if (m.blob) { m.blob.visible = true; m.blob.scale.setScalar(0.72); m.blob.quaternion.identity(); m.blob.position.y = 0.03; m.blob.rotation.set(0, 0, 0); }
    m.rsStand = true; return m;
  }
  function placeEnt(e) {
    const m = e.m; if (!m) return; m.grp.matrixAutoUpdate = true; m.model.traverse((o) => { o.matrixAutoUpdate = true; }); if (m.blob) m.blob.matrixAutoUpdate = true;
    m.grp.position.set(e.x, e.y, e.z); m.grp.rotation.y = e.yaw; pose1(e, 0, true); freeze(m);
  }
  // matrices are frozen between two pose updates (the scene's per-frame matrix walk skips a frozen subtree: three only recomposes nodes with matrixAutoUpdate)
  function freeze(m) { m.grp.updateMatrixWorld(true); m.grp.traverse((o) => { o.matrixAutoUpdate = false; }); }
  function pose1(e, dt, first) {
    const m = e.m, a = m.acts.idle; const t = first ? e.ph * a.d : (a.a.time + dt) % a.d; a.a.time = t; m.mixer.update(0);
    if (!first) { m.grp.traverse((o) => { if (o.matrixAutoUpdate === false) o.updateMatrix(); }); m.grp.matrixWorldNeedsUpdate = true; m.grp.updateMatrixWorld(true); }
  }
  const sph = new T.Sphere(), pm = new T.Matrix4(), fr = new T.Frustum();
  function cap() { const lvl = G.govLvl(); return G.phone() ? (lvl >= 5 ? 0 : lvl >= 3 ? 1 : 2) : 3; }
  const DRAW_R = () => (G.phone() ? 60 : 90), LOAD_R = () => DRAW_R() + 10;
  function tick(now) {
    if (!st.on) return;
    const home = G.canTick(); if (strip && st.shown !== home) { st.shown = home; strip.style.display = home ? '' : 'none'; hint.style.display = home ? '' : 'none'; }
    const dts = st.last ? Math.min(0.25, (now - st.last) / 1000) : 0; st.last = now;
    if (!st.stand || !home) return;
    if (S.paused) return;
    pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
    const lr = LOAD_R(), dr = DRAW_R(), mx = cap(); st.mx = mx;
    const order = Object.values(ents).map((e) => [Math.hypot(e.x - S.x, e.z - S.z), e]).sort((a, b) => a[0] - b[0]);
    let nRes = 0; for (const [, e] of order) if (e.m || e.load) nRes++;
    // (a resident keeps her slot while she is within LOAD_R + 25 m — no churn when two distances cross; only a lowered cap / being far frees one, the farthest first)
    for (let i = order.length - 1; i >= 0; i--) { const [d, e] = order[i]; if (!(e.m || e.load)) continue; if (d > lr + 25 || nRes > mx) { if (e.m) { freeModel(e.m); e.m = null; e.vis = false; } if (e.load) e.cancel = true; nRes--; } }
    let drawn = 0, busyLoad = order.some(([, e]) => e.load);                  // (one glb in flight at a time: a parse is a burst of main-thread work)
    for (const [d, e] of order) {
      if (!e.m) { if (!e.load && d < lr && nRes < mx && !busyLoad) { nRes++; busyLoad = true; startLoad(e); } continue; }
      sph.center.set(e.x, e.y + 0.9, e.z); sph.radius = 1.5;
      const vis = d < dr && drawn < mx && fr.intersectsSphere(sph);
      if (vis !== e.vis) { e.vis = vis; e.m.grp.visible = vis; }
      if (!vis) continue; drawn++;
      if (e.m.blob) { const bv = d < 14; if (bv !== e.bv) { e.bv = bv; e.m.blob.visible = bv; } }       // (her contact shadow is a transparent double-sided disc = 2 draw calls: only where it can be seen, within 14 m)
      e.acc += dts; const per = 1 / rateAt(d); if (e.acc >= per) { pose1(e, e.acc, false); e.acc = 0; }
    }
  }
  function startLoad(e) {
    const key = e.key; e.cancel = false; e.load = G.load(key).then((m) => {
      e.load = null; const alive = ents[key] === e && !e.cancel && st.on && st.stand && key !== S.key && G.canTick();
      if (!alive) { freeModel(m); return; }
      e.y = G.ground(e.x, e.z); e.m = standify(m); e.m.grp.visible = false; e.vis = false; scene.add(e.m.grp); placeEnt(e); G.refresh();
    }).catch((err) => { e.load = null; console.warn('sisters stand-in', key, err); });
  }
  // the solid bodies of the sisters who stand (a disc each, the standing ones' own list item: [x, z, r]) — the collision list of rpg.js appends them (the sister in play is never one of them)
  function discs() {
    if (!st.on || !st.stand) return []; const out = [];
    for (const k of Object.keys(st.places)) { if (k === S.key || k === st.excl) continue; const p = st.places[k]; out.push([p[0], p[1], 0.4]); }
    return out;
  }

  // ---------------------------------------------------------------- hero mode in / out
  function onKey(e) {
    if (!st.on || !/^Digit[1-6]$/.test(e.code) || e.repeat) return; const k = KEYS[+e.code.slice(5) - 1]; if (k) pick(k);
  }
  function enter() {
    if (st.on) return; st.on = true; loadPrefs(); build(); st.last = 0; st.shown = true;
    if (st.stand) {
      const p = st.places[S.key];
      if (p) { delete st.places[S.key]; st.excl = S.key; G.refresh(); const q = G.spot(p[0], p[1]); st.excl = null; G.place({ x: q[0], z: q[1], yaw: p[2] }); }    // (she starts where she was left, not at the gate)
      for (const k of Object.keys(st.places)) if (k !== S.key) ents[k] = mkEnt(k, st.places[k]);
      if (st.hint < 3) { st.hint++; savePrefs(); say(TXT.hint, 6500); }
    }
    G.refresh(); paint(); window.addEventListener('keydown', onKey);
  }
  function exit() {
    if (!st.on) return;
    if (st.stand && G.canTick()) { st.places[S.key] = [S.x, S.z, S.body]; savePrefs(); }                       // (she stays where she stood when the owner leaves hero mode)
    st.on = false; window.removeEventListener('keydown', onKey);
    for (const k of Object.keys(ents)) dropEnt(k);
    if (strip) { strip.remove(); hint.remove(); strip = hint = null; cards = {}; tog = null; }
    clearTimeout(st.hintT); st.ld = null; st.busy = false; G.refresh();
  }
  const info = () => ({ on: st.on, stand: st.stand, places: JSON.parse(JSON.stringify(st.places)), ents: Object.keys(ents).map((k) => ({ k, res: !!ents[k].m, loading: !!ents[k].load, vis: ents[k].vis })), cap: st.mx });
  return { enter, exit, tick, pick, bring, setStand, snapshot, adopt, discs, free: freeModel, info, st, ents, KEYS, get strip() { return strip; }, cards: () => cards, canSwitch };
}
