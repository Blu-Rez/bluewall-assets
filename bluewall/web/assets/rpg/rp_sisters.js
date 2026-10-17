// rp_sisters.js — RS1 + RS2: the six sisters together in hero mode (at level 50 the player owns aylar aylin elika elina melika mobina).
//
//  THE BUTTON (RS2)  ONE round button, top-right of the hero HUD, with the face of the sister in play.  A touch fans the other FIVE out of its side (round crops, the face in the middle of the frame, 48 px, a short
//           spring); a touch on one of them goes to her and the fan folds back; a touch anywhere else closes it too (that touch still reaches the stick / the look pad).  The Stage B switch lives inside the fan (its last slot).
//  STAGE A  One touch hands control to that sister without leaving hero mode: her glb is fetched + parsed WHILE the sister in play keeps walking (a spinner on the button + the small «loading <name>» chip, never a page),
//           her textures go to the GPU one frame before she is shown, then one frame swaps the two models at the same spot (same camera, same HUD, same stick) and the old one is FREED (geometry, textures, skeleton, mixer).
//           Nothing but the sister in play is resident: no glb is preloaded, none is kept.
//  STAGE B  (the switch inside the fan, default OFF, remembered) every sister who was left somewhere STANDS there: idle, solid (a disc in the collision list), drawn only when she is near and in view.
//           A stand-in is a cut-down copy: 1024 px texture (4x less GPU memory), ONE idle clip shared by all of them (one AnimationClip object), a pose update at 15 / 7 / 3.5 Hz by distance and none at all out of view,
//           no sun-shadow cast (one call less), her matrices frozen between two pose updates, loaded only when she is within LOAD_R of the player and freed again when she is far.  At most MAXN are resident (the governor can cut it).
//           Touch her in the fan = go to her (the sister in play stays exactly where she is); hold her ~0.5 s = bring her to the sister in play (a free spot beside her).
//           The places are the client's (localStorage `bw_rs_v1`); the server half is a spec in REPORT_RS1.md (nothing of it is built here).
//  THE ENTRANCE (RS2)  entering hero mode and after every switch she steps out of a column of her own light 0.7 m above her feet: the engine's own fall + land clips (nothing new is loaded) and, for ~1 s, a column and a ring of light
//           on the ground (two additive meshes with the parameters of the contact-shadow ring / the door beam: +0 shader programs, two tiny textures made once and freed on exit).  Nothing blocks the stick.
//  The model swap itself (it touches rpg.js's locals: scene, marker, diet, S.models) is rpg.js `swapHero` (marked `// RS1:`); this file owns the button, the stand-ins, the memory rules, the places and the entrance.
const STORE = 'bw_rs_v1';
const HOLD_MS = 500, MAIN_D = 56, FAN_D = 48, TOG_D = 46, GAP = 7, BW = 2, STAG = 30;
const CSS = (top) => `
.rs-wrap{position:absolute;z-index:44;right:max(10px,var(--hr,0px));top:calc(var(--ht,${top}) + 5px);width:${MAIN_D}px;height:${MAIN_D}px;pointer-events:none;direction:ltr}
.rp-sheet .rs-wrap,.rp-on:has(.bsh.on) .rs-wrap{visibility:hidden!important;pointer-events:none!important}
.rs-m,.rs-f{position:absolute;right:0;padding:0;margin:0;border:0;border-radius:50%;background:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer;outline:none}
.rs-img{position:absolute;inset:0;border-radius:50%;border:${BW}px solid var(--ac);background:#2a3038 no-repeat;box-sizing:border-box;overflow:hidden}
.rs-m{top:0;width:${MAIN_D}px;height:${MAIN_D}px;pointer-events:auto;z-index:3;transition:transform .12s}
.rs-m .rs-img{box-shadow:0 0 13px var(--ac),0 2px 8px rgba(0,0,0,.6);transition:box-shadow .15s}
.rs-m:active{transform:scale(.94)}
.rs-wrap.open .rs-m .rs-img{box-shadow:0 0 18px var(--ac),0 0 0 3px rgba(255,255,255,.2),0 2px 8px rgba(0,0,0,.6)}
.rs-bd{position:absolute;left:-5px;bottom:-4px;width:21px;height:21px;border-radius:50%;border:1.5px solid rgba(205,214,224,.65);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.95),rgba(22,26,32,.96));color:#e6ecf2;display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 1px 5px rgba(0,0,0,.6);transition:color .15s,border-color .15s,transform .22s}
.rs-bd svg{width:66%;height:66%;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
.rs-wrap.open .rs-bd{color:#3df5e0;border-color:#3df5e0;transform:rotate(180deg)}
.rs-m.ld .rs-img{filter:brightness(.62)}
.rs-m.ld:after{content:"";position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:rsSpin .8s linear infinite}
.rs-f,.rs-t{top:4px;width:${FAN_D}px;height:${FAN_D}px;z-index:2;opacity:0;visibility:hidden;pointer-events:none;transform:translateX(0) scale(.35);transition:transform .17s ease-in,opacity .13s,visibility 0s .17s}
.rs-f .rs-img{border-color:var(--ac);box-shadow:0 2px 8px rgba(0,0,0,.6)}
.rs-f.cur{display:none}
.rs-f:active .rs-img{filter:brightness(1.12)}
.rs-f u{position:absolute;right:-1px;top:-1px;width:11px;height:11px;border-radius:50%;background:#3df5e0;box-shadow:0 0 6px #3df5e0,0 0 0 1.5px rgba(0,0,0,.65);display:none;text-decoration:none;z-index:2}
.rs-f.st u{display:block}
.rs-t{position:absolute;right:0;top:${(MAIN_D - TOG_D) / 2}px;width:${TOG_D}px;height:${TOG_D}px;padding:0;margin:0;border-radius:50%;border:1.5px solid rgba(205,214,224,.55);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.8),rgba(22,26,32,.88));box-shadow:0 0 12px rgba(61,245,224,.2),0 2px 8px rgba(0,0,0,.55);color:#e6ecf2;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer}
.rs-t svg{width:56%;height:56%;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.rs-t.on{color:#3df5e0;border-color:#3df5e0;box-shadow:0 0 16px rgba(61,245,224,.6),inset 0 0 12px rgba(61,245,224,.2),0 2px 8px rgba(0,0,0,.55)}
.rs-t:active{filter:brightness(1.15)}
.rs-wrap.open .rs-f,.rs-wrap.open .rs-t{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(var(--dx)) scale(1);transition:transform .24s cubic-bezier(.2,.95,.3,1.18) var(--dl),opacity .16s var(--dl),visibility 0s}
.rs-hint{position:absolute;z-index:44;right:max(10px,var(--hr,0px));top:calc(var(--ht,${top}) + ${MAIN_D + 11}px);max-width:340px;padding:3px 9px;border-radius:8px;background:rgba(5,15,25,.74);color:#dff;font:600 11px/1.5 Vazirmatn,system-ui,sans-serif;direction:rtl;text-align:right;pointer-events:none;opacity:0;transition:opacity .2s}
.rs-hint.on{opacity:1}
@keyframes rsSpin{to{transform:rotate(360deg)}}`;
const ICON = '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3.2 2.4-5.3 5.5-5.3s5.5 2.1 5.5 5.3"/><circle cx="17.2" cy="9.2" r="2.3"/><path d="M16.3 14.4c2.5.1 4.2 1.8 4.2 4.4"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24"><path d="M14.5 6.5L9 12l5.5 5.5"/></svg>';        // (the button's corner sign: the fan opens to the left; it turns round while the fan is open)
const TXT = { hint: 'لمس: رفتن پیش او · نگه‌داشتن: آوردنش کنار تو', on: 'ایستادن خواهرها: روشن', off: 'ایستادن خواهرها: خاموش', offHint: 'لمس: جابه‌جایی همان‌جا', ground: 'برای جابه‌جایی روی زمین بایست (نه در آب و نه روی دیوار)', load: 'بارگذاری' };
const FA = { elina: 'الینا', elika: 'الیکا', melika: 'ملیکا', mobina: 'مبینا', aylin: 'آیلین', aylar: 'آیلار' };

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
// RS2: the round crop of a sister's card portrait (the card is 320 x 400): the centre of her FACE (fractions of the card) and how many circle-widths wide the card is drawn.  The face — brow to chin — fills ~65 % of the circle, hair may be cut.
export const FACE = { elina: [0.485, 0.235, 2.15], elika: [0.475, 0.215, 2.15], melika: [0.46, 0.235, 2.1], mobina: [0.5, 0.24, 2.1], aylin: [0.495, 0.235, 2.1], aylar: [0.495, 0.225, 2.15] };
export const faceBg = (k, d) => { const [fx, fy, z] = FACE[k] || [0.5, 0.23, 2.1], w = d * z, h = w * 1.25; return { w: +w.toFixed(2), h: +h.toFixed(2), x: +(d / 2 - fx * w).toFixed(2), y: +(d / 2 - fy * h).toFixed(2) }; };
// RS2: where fan slot i (0 = next to the button) sits: its x offset from the button's right edge (px, negative = to the left) — the slot's own right edge
export const fanX = (i) => -(MAIN_D + GAP + i * (FAN_D + GAP));
// RS2: the look of the entrance light at t seconds: the column (opacity, radius, height in metres) and the ground ring (opacity, outer radius).  All zero at FX_T.
export const FX_T = 1.0;
const ease = (x) => 1 - (1 - x) * (1 - x);
export function entryAt(t) {
  const u = Math.min(1, Math.max(0, t / FX_T)), up = u < 0.1 ? u / 0.1 : Math.pow(Math.max(0, 1 - (u - 0.1) / 0.9), 1.5);
  return { col: 0.8 * up, colR: 0.5 + 0.4 * ease(u), colH: 2.4 + 1.5 * ease(u), ring: u >= 1 ? 0 : 0.95 * Math.pow(1 - u, 1.3), ringR: 0.45 + 1.55 * ease(u) };
}
export const DROP = 0.7;

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
  const st = { on: false, stand: false, busy: false, ld: null, places: {}, hint: 0, last: 0, shown: true, saveT: 0, hintT: 0, sync: 0, excl: null, mx: 0, open: false, fx: 0 };
  const ents = {};                                                      // key -> { key, m (model | null), load (promise | null), x, z, y, yaw, vis, acc, ph }
  let wrap = null, hint = null, styleEl = null, items = {}, tog = null, main = null, mainImg = null, idleClip = null;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const accent = (k) => (SIS.find((s) => s.k === k) || SIS[0]).c;
  const fa = (k) => { const s = SIS.find((x) => x.k === k); return (s && s.fa) || FA[k] || k; };

  // ---------------------------------------------------------------- prefs (client side)
  function loadPrefs() { let raw = null; try { raw = localStorage.getItem(STORE); } catch (e) { /* blocked */ } const o = readPrefs(raw); st.stand = o.on; st.places = o.p; st.hint = o.h; st.t = o.t; }
  function savePrefs() { st.t = Date.now(); try { localStorage.setItem(STORE, writePrefs({ on: st.stand, p: st.places, h: st.hint, t: st.t })); } catch (e) { /* blocked: this session only */ } }
  // the seam for a server half (spec in REPORT_RS1.md; nothing of it is built here): snapshot() = what to store, adopt(json) = a newer copy from the server (ignored when older than ours)
  const snapshot = () => JSON.parse(writePrefs({ on: st.stand, p: st.places, h: st.hint, t: st.t }));
  function adopt(j) { const o = readPrefs(j); if (!o.t || o.t <= (st.t || 0)) return false; st.stand = o.on; st.places = o.p; st.t = o.t; try { localStorage.setItem(STORE, writePrefs({ ...o, h: st.hint })); } catch (e) { /* blocked */ } if (st.on) { for (const k of Object.keys(ents)) dropEnt(k); if (st.stand) for (const k of Object.keys(st.places)) if (k !== S.key) ents[k] = mkEnt(k, st.places[k]); G.refresh(); paint(); } return true; }

  // ---------------------------------------------------------------- the button + the fan (RS2)
  const crop = (img, k, d) => { const f = faceBg(k, d); img.style.backgroundImage = `url(${G.base}c_${k}.webp${G.v})`; img.style.backgroundSize = `${f.w}px ${f.h}px`; img.style.backgroundPosition = `${f.x}px ${f.y}px`; };
  function build() {
    if (wrap) return;
    if (!styleEl) { styleEl = el('style'); styleEl.textContent = CSS(G.top); document.head.appendChild(styleEl); }
    wrap = el('div', 'rs-wrap rp-k'); wrap.dataset.rs = 'wrap';
    for (const s of SIS) {                                              // the five (the one in play is hidden): in front of the button's own slot so they slide OUT from behind it
      const f = el('button', 'rs-f rp-k', '<span class="rs-img"></span><u></u>'); f.type = 'button'; f.dataset.k = s.k; f.style.setProperty('--ac', s.c); f.setAttribute('aria-label', s.n);
      crop(f.firstChild, s.k, FAN_D - 2 * BW); items[s.k] = f; wrap.appendChild(f);
      let hold = null, held = false;
      f.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation(); held = false; clearTimeout(hold);
        if (st.stand && s.k !== S.key) hold = setTimeout(() => { held = true; hold = null; closeFan(); bring(s.k); }, HOLD_MS);
      });
      const up = (e) => { e.stopPropagation(); clearTimeout(hold); hold = null; if (!held && e.type === 'pointerup') { closeFan(); pick(s.k); } held = false; };
      f.addEventListener('pointerup', up); f.addEventListener('pointercancel', up); f.addEventListener('pointerleave', () => { clearTimeout(hold); hold = null; });
    }
    tog = el('button', 'rs-t rp-k', ICON); tog.type = 'button'; tog.dataset.rs = 'toggle'; tog.setAttribute('aria-label', 'Sisters stand in the world'); wrap.appendChild(tog);
    tog.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    tog.addEventListener('pointerup', (e) => { e.stopPropagation(); setStand(!st.stand, true); });
    main = el('button', 'rs-m rp-k', '<span class="rs-img"></span><b class="rs-bd">' + CHEV + '</b>'); main.type = 'button'; main.dataset.rs = 'main'; main.setAttribute('aria-haspopup', 'true'); mainImg = main.firstChild; wrap.appendChild(main);
    main.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
    main.addEventListener('pointerup', (e) => { e.stopPropagation(); st.open ? closeFan() : openFan(); });
    hint = el('div', 'rs-hint rp-k'); hint.dataset.rs = 'hint';
    const h = G.hud(); h.appendChild(wrap); h.appendChild(hint); paint();
  }
  // the button shows the sister in play; the five others take the slots in their canonical order (the one in play is skipped); the toggle is the sixth slot
  function paint() {
    if (!wrap) return;
    const cur = S.key || KEYS[0]; main.style.setProperty('--ac', accent(cur)); crop(mainImg, cur, MAIN_D - 2 * BW); main.setAttribute('aria-label', (SIS.find((s) => s.k === cur) || SIS[0]).n); main.dataset.k = cur;
    let i = 0;
    for (const k of KEYS) { const f = items[k]; if (!f) continue; const on = k === cur; f.classList.toggle('cur', on); f.classList.toggle('st', !!(st.stand && st.places[k] && !on)); if (on) continue; f.style.setProperty('--dx', fanX(i) + 'px'); f.style.setProperty('--dl', i * STAG + 'ms'); i++; }
    tog.style.setProperty('--dx', fanX(i) + 'px'); tog.style.setProperty('--dl', i * STAG + 'ms');
    main.classList.toggle('ld', !!st.ld); tog.classList.toggle('on', st.stand); tog.setAttribute('aria-pressed', st.stand ? 'true' : 'false'); main.setAttribute('aria-expanded', st.open ? 'true' : 'false');
    wrap.classList.toggle('open', st.open);
  }
  const capText = () => (st.stand ? TXT.on + ' — ' + TXT.hint : TXT.off + ' — ' + TXT.offHint);
  function say(t, ms = 5200) { if (!hint) return; hint.textContent = t; hint.classList.add('on'); clearTimeout(st.hintT); st.hintT = setTimeout(() => hint && !st.open && hint.classList.remove('on'), ms); }
  function caption() { if (!hint) return; clearTimeout(st.hintT); hint.textContent = capText(); hint.classList.add('on'); }
  const onOut = (e) => { if (st.open && wrap && !wrap.contains(e.target)) closeFan(); };                         // (capture phase, never stops the event: the same touch still starts the stick / the look pad)
  function openFan() {
    if (!wrap || st.open || !st.on || !G.canTick()) return false;
    st.open = true; paint(); caption(); document.addEventListener('pointerdown', onOut, true); return true;
  }
  function closeFan() {
    if (!st.open) return false; st.open = false; document.removeEventListener('pointerdown', onOut, true);
    if (wrap) { paint(); if (hint) { clearTimeout(st.hintT); hint.classList.remove('on'); } } return true;
  }
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
    if (!canSwitch() || key === S.key || !items[key]) return false;
    if (st.stand && !grounded()) { say(TXT.ground); return false; }
    st.busy = true; st.ld = key; paint(); const chip = G.chip ? G.chip(TXT.load + ' ' + fa(key), accent(key)) : null;                    // RS2: the chip (never a page): the world stays as it is while she is fetched
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
      st.sync++; savePrefs(); G.refresh(); entry();                                                            // RS2: (the swap ran in this very task: she is shown in this frame, the light starts with her)
      return true;
    } catch (e) { console.warn('sisters pick', e); st.excl = null; return false; }
    finally { st.busy = false; st.ld = null; if (chip) chip.hide(); paint(); }
  }
  // the sister who was in play stays where she stood: her model becomes a stand-in at once (no reload)
  function park(key, m, c) {
    st.places[key] = [c[0], c[1], c[2]];
    const e = ents[key] || (ents[key] = mkEnt(key)); e.x = c[0]; e.z = c[1]; e.yaw = c[2]; e.y = G.ground(c[0], c[1]);
    if (e.m) freeModel(e.m);
    e.m = standify(m); e.vis = false; e.m.grp.visible = false; placeEnt(e); scene.add(e.m.grp);                  // (hidden until the next tick has looked at the frustum: the draw of that frame comes after it)
  }
  // hold her in the fan: she comes here (a free spot beside the sister in play); a sister who is resident is moved, one who is not is only given the new place
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
    if (on) { for (const k of Object.keys(st.places)) if (k !== S.key) ents[k] = ents[k] || mkEnt(k, st.places[k]); }
    else { for (const k of Object.keys(ents)) dropEnt(k); }
    G.refresh(); paint(); if (st.open) caption(); else if (user) say(on ? TXT.on : TXT.off, 3200);
  }

  // ---------------------------------------------------------------- the entrance (RS2)
  // a column of her own light and a ring on the ground (additive; the parameters of the contact-shadow ring / the door beam = the same programs as theirs, +0), and she drops DROP m out of it: the game's own fall + land clips.
  let rig = null, fx = null;
  function rigMake() {
    if (rig) return rig;
    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
    const ringT = tex(128, 128, (g, w) => { const r = w / 2, a = g.createRadialGradient(r, r, 0, r, r, r); a.addColorStop(0, 'rgba(255,255,255,.16)'); a.addColorStop(0.55, 'rgba(255,255,255,.05)'); a.addColorStop(0.7, 'rgba(255,255,255,.55)'); a.addColorStop(0.8, 'rgba(255,255,255,1)'); a.addColorStop(0.9, 'rgba(255,255,255,.5)'); a.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = a; g.fillRect(0, 0, w, w); });
    const colT = tex(64, 128, (g, w, h) => { const im = g.createImageData(w, h), d = im.data; for (let y = 0; y < h; y++) { const v = 1 - y / (h - 1), av = Math.pow(1 - v, 1.15) * Math.min(1, v / 0.04 + 0.0); for (let x = 0; x < w; x++) { const ah = Math.pow(Math.max(0, Math.cos(Math.PI * (x / (w - 1) - 0.5))), 2.4), o = (y * w + x) * 4; d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.round(255 * Math.min(1, av * ah)); } } g.putImageData(im, 0, 0); });   // (a soft beam: bright at the foot and in the middle, nothing at the edges or the top — no hard glass tube)
    const mat = (map, ring) => new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: T.FrontSide, blending: T.AdditiveBlending, color: new T.Color('#ffffff'), opacity: 0, polygonOffset: !!ring, polygonOffsetFactor: ring ? -2 : 0, polygonOffsetUnits: ring ? -2 : 0 });
    const ringG = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), colG = new T.BufferGeometry();
    colG.setAttribute('position', new T.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0, 0, 0, -0.5, 0, 0, 0.5, 0, 1, 0.5, 0, 1, -0.5], 3)); colG.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2)); colG.setAttribute('normal', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], 3)); colG.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6]);   // (two crossed upright quads: a soft beam from every side, ONE draw call)
    const ring = new T.Mesh(ringG, mat(ringT, true)), col = new T.Mesh(colG, mat(colT, false)), grp = new T.Group();
    for (const o of [ring, col]) { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; o.userData.rpHero = true; o.userData.rpFx = true; } ring.renderOrder = 4; col.renderOrder = 10; grp.add(ring); grp.add(col); grp.userData.rpHero = true;
    try { if (H.renderer && H.renderer.initTexture) { H.renderer.initTexture(ringT); H.renderer.initTexture(colT); } } catch (e) { /* the first draw uploads instead */ }
    return (rig = { grp, ring, col, tex: [ringT, colT], geo: [ringG, colG], mat: [ring.material, col.material] });
  }
  function rigFree() {
    if (!rig) return; rig.grp.removeFromParent(); for (const t of rig.tex) t.dispose(); for (const g of rig.geo) g.dispose(); for (const m of rig.mat) m.dispose(); rig = null; fx = null; st.fx = 0;
  }
  function entry() {
    if (!st.on || !G.canTick() || S.where !== 'home' || !S.hero) return false;
    let dy = 0; if (S.grounded && S.layer === 0 && !S.sw && S.st === 'loco') { dy = DROP; S.y += dy; S.grounded = false; S.vy = 0; S.st = 'fall'; S.stT = 0; }      // (the camera follows her down; the stick works from the first frame)
    if (G.govLvl() >= 5) return true;                                                                         // (a phone at the governor's last steps: the drop only, no light)
    const r = rigMake(), hex = accent(S.key), c = new T.Color(hex).lerp(new T.Color('#ffffff'), 0.35);
    r.mat[0].color.copy(c); r.mat[1].color.copy(c); r.grp.position.set(S.x, S.y - dy + 0.03, S.z); if (r.grp.parent !== scene) scene.add(r.grp);
    fx = { t: 0 }; st.fx = 1; fxApply(0); return true;
  }
  function fxApply(t) {
    if (!rig) return; const a = entryAt(t);
    rig.ring.visible = a.ring > 0.004; rig.col.visible = a.col > 0.004;
    rig.ring.scale.set(a.ringR * 2.2, 1, a.ringR * 2.2); rig.mat[0].opacity = a.ring;                       // (the bright circle of the texture sits at 0.8 of the half-width: the plane is 1.1 x wider than the circle)
    rig.col.scale.set(a.colR * 2, a.colH, a.colR * 2); rig.mat[1].opacity = a.col;
  }
  function fxTick(dts) {
    if (!fx) return; fx.t += dts;
    if (fx.t >= FX_T) { fxApply(FX_T); rig.grp.removeFromParent(); fx = null; st.fx = 0; return; }
    fxApply(fx.t);
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
  function tick(now, dt) {
    if (!st.on) return;
    const home = G.canTick(); if (wrap && st.shown !== home) { st.shown = home; wrap.style.display = home ? '' : 'none'; hint.style.display = home ? '' : 'none'; if (!home) closeFan(); }
    const dts = dt != null ? Math.min(0.25, dt) : st.last ? Math.min(0.25, (now - st.last) / 1000) : 0; st.last = now;      // (RS2: the light is paced by the game clock — the same dt the sim gets, 0 while paused — so it never runs ahead of her drop)
    if (fx && home && !S.paused) fxTick(dts); else if (fx && !home) { rig.grp.removeFromParent(); fx = null; st.fx = 0; }
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
    }
    G.refresh(); paint(); window.addEventListener('keydown', onKey);
    entry();                                                                                                  // RS2: she steps out of the light
  }
  function exit() {
    if (!st.on) return;
    if (st.stand && G.canTick()) { st.places[S.key] = [S.x, S.z, S.body]; savePrefs(); }                       // (she stays where she stood when the owner leaves hero mode)
    closeFan(); rigFree();
    st.on = false; window.removeEventListener('keydown', onKey);
    for (const k of Object.keys(ents)) dropEnt(k);
    if (wrap) { wrap.remove(); hint.remove(); wrap = hint = null; items = {}; tog = main = mainImg = null; }
    clearTimeout(st.hintT); st.ld = null; st.busy = false; G.refresh();
  }
  const info = () => ({ on: st.on, stand: st.stand, open: st.open, fx: st.fx, places: JSON.parse(JSON.stringify(st.places)), ents: Object.keys(ents).map((k) => ({ k, res: !!ents[k].m, loading: !!ents[k].load, vis: ents[k].vis })), cap: st.mx });
  const fxSet = (t) => { if (!fx) return false; fx.t = Math.max(0, Math.min(FX_T - 1e-3, t)); fxApply(fx.t); return true; };                // (dev / the proof: freeze the light at t seconds)
  return { enter, exit, tick, pick, bring, setStand, openFan, closeFan, entry, fxSet, snapshot, adopt, discs, free: freeModel, info, st, ents, KEYS, get wrap() { return wrap; }, get main() { return main; }, get tog() { return tog; }, get rig() { return rig; }, items: () => items, canSwitch };
}
