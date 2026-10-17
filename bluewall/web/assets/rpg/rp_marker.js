// UI2 (17 Oct 2026) — the head marker, redone.  The owner called the white glass triangle «the worst look» and asked again for what he wanted from the start: a SMALL NEON CROWN and a light of the same colour above every character.
//   WHY RP1C_R3 HAD DROPPED THE CROWN: not a technical reason — the owner himself said «no crown anywhere» on 15 Oct 18:40 (after the first crown sample), and asked for a «slightly glowing triangle mention marker» instead.  On 17 Oct he reversed it (the triangle is the worst look,
//   the crown + same-colour light was his original ask): the newest word wins, so look 1 is the crown again.  The ground ring stays what he fixed on 15 Oct 18:40: small, EMPTY (no crown inside it).
//   · the SIGN above the head, a billboard Sprite drawn once on a 256 px canvas in the character's OWN colour, three numbered looks:  1 = a small neon crown (default: three points, a silver band, pearls on the tips),  2 = a faceted colour gem in a silver cradle (one solid shape),  3 = a thin neon halo ring with a spark
//     (all three: a dark underlay so they read on the bright day sky AND on the night, the colour glow, a white-hot / silver core: the blue-silver HUD language of rp_ui2.js, the colour is hers);
//   · the HALO: a small soft glow sprite behind the sign (normal blending: an additive one vanishes on the bright day sky), same colour, slow breathing (CPU, one sine per frame);
//   · the GROUND RING: an additive decal of the same colour, empty, that is a CHILD of the hero's own contact-shadow quad (rpg.js `blob`), so it takes the slope, the position and the in-the-air shrink of the shadow for free.
//   ?crown=1|2|3 in the dev page (the name is kept for the tests), marker.setLook(n) in the tests.
// The sign is clamped in size at distance, faded out between 32 and 40 m, floats slowly; the self marker also fades out when the camera is squeezed closer than ~2 m, and is hidden in first person.
// Budget (counted by dev/rp1c3_test.sh): +0 shader programs — the sprites use the parameters of the door icons (SpriteMaterial, map, fog:false), the ring those of the contact shadow (MeshBasicMaterial, map, DoubleSide, fog on),
// blending / opacity / colour are state, not part of a program.  No real light, no per-frame allocation, no image file (canvas only), nothing in the boot bundle.  Calls: the hero costs 2 sprites + 1 ring = 3 (a character that is
// further than 40 m, behind the camera or in first person costs 0: Sprites are frustum culled, the rest is hidden).
// WHY NOT ONE InstancedMesh: a per-instance colour needs `instanceColor` (a different program) or a custom attribute (onBeforeCompile = a different program) — both break «+0 programs»; the colour is a material uniform instead.
export const LOOKS = { 1: 'small neon crown + halo + small ring', 2: 'colour gem in a silver cradle + halo + small ring', 3: 'thin neon halo ring with a spark + halo + small ring' };
// per look: the shape's drawn width as a fraction of the canvas (the sprite is made so the DRAWN width is SGW metres at the near distance) and the lowest drawn point as a fraction of the canvas height (the sign rests GAP above her head on it)
const LOOK = { 1: { kind: 'crown', dw: 0.70, base: 0.77 }, 2: { kind: 'crest', dw: 0.72, base: 0.75 }, 3: { kind: 'halo', dw: 0.64, base: 0.64 } };
const FAR = 40, NEAR_FADE = 8;                                    // metres: invisible at FAR, full below FAR - NEAR_FADE
const D0 = 6, KMAX = 3.5;                                         // the sign keeps its size to 6 m, then grows with the distance up to x3.5 (= 21 m), so it never gets smaller than ~40 px on a phone
const SGW = 0.36;                                                 // width in metres of the drawn crown at the near distance (a head is ~0.2 m wide)
const GAP = 0.16;                                                 // metres between the top of her head and the lowest point of the sign at the near distance

const rgb = (hex) => { const n = parseInt(String(hex).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const toward = (c, w, t) => [c[0] + (w[0] - c[0]) * t, c[1] + (w[1] - c[1]) * t, c[2] + (w[2] - c[2]) * t];
const WHITE = [255, 255, 255], BLACK = [0, 0, 0];

// ---- the textures ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// the sign.  Every look: (1) a dark underlay, (2) the colour glow, (3) the white-hot / silver core, so it reads on the bright day sky AND on the night.
const CROWN = [[0.15, 0.77], [0.15, 0.37], [0.325, 0.56], [0.5, 0.26], [0.675, 0.56], [0.85, 0.37], [0.85, 0.77]];
const CRADLE = [[0.14, 0.38], [0.30, 0.58], [0.5, 0.70], [0.70, 0.58], [0.86, 0.38]];
export function drawSign(cv, hex, kind) {
  const S = cv.width, g = cv.getContext('2d'), c = rgb(hex), hot = toward(c, WHITE, 0.8), k = S / 128;
  g.clearRect(0, 0, S, S); g.lineJoin = 'round'; g.lineCap = 'round';
  const poly = (P) => { g.beginPath(); P.forEach((p, i) => { const x = p[0] * S, y = p[1] * S; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
  const pearl = (x, y, r) => { g.save(); g.shadowColor = css(c, 1); g.shadowBlur = 9 * k; g.fillStyle = css(hot, 1); g.beginPath(); g.arc(x * S, y * S, r * k, 0, 6.2832); g.fill(); g.restore(); };
  const silverBand = (x0, x1, y, w) => { const lg = g.createLinearGradient(x0 * S, 0, x1 * S, 0); lg.addColorStop(0, 'rgba(138,160,192,0.9)'); lg.addColorStop(0.5, 'rgba(246,250,255,1)'); lg.addColorStop(1, 'rgba(138,160,192,0.9)'); g.save(); g.strokeStyle = lg; g.lineWidth = w * k; g.beginPath(); g.moveTo(x0 * S, y * S); g.lineTo(x1 * S, y * S); g.stroke(); g.restore(); };
  if (kind === 'crown') {
    g.save(); g.strokeStyle = 'rgba(4,10,24,0.62)'; g.lineWidth = 15 * k; poly(CROWN); g.stroke(); g.restore();                                                                   // 1. dark underlay
    g.save(); poly(CROWN); const fg = g.createLinearGradient(0, 0.26 * S, 0, 0.77 * S); fg.addColorStop(0, css(c, 0.42)); fg.addColorStop(1, css(c, 0.14)); g.fillStyle = fg; g.fill(); g.restore();        // a faint colour fill, lighter at the points
    g.save(); g.shadowColor = css(c, 1); g.shadowBlur = 16 * k; g.strokeStyle = css(c, 1); g.lineWidth = 7.5 * k; poly(CROWN); g.stroke(); g.stroke(); g.restore();                           // 2. the colour glow
    g.save(); g.strokeStyle = css(hot, 0.97); g.lineWidth = 2.8 * k; poly(CROWN); g.stroke(); g.restore();                                                                                 // 3. the white-hot core
    silverBand(0.19, 0.81, 0.665, 3.6);                                                                                                                                                      // the silver band (the HUD's bezel)
    pearl(0.15, 0.37, 5); pearl(0.5, 0.26, 5.6); pearl(0.85, 0.37, 5);                                                                                                                       // pearls on the three points
  } else if (kind === 'crest') {                                                                                                                                                             // a faceted colour gem resting in a silver cradle: one SOLID shape (the crown is a thin neon line)
    const cradle = () => { g.beginPath(); CRADLE.forEach((p, i) => { const x = p[0] * S, y = p[1] * S; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); };
    g.save(); g.strokeStyle = 'rgba(4,10,24,0.66)'; g.lineWidth = 15 * k; cradle(); g.stroke(); g.restore();                                                                              // 1. dark underlay
    const sg = g.createLinearGradient(0.14 * S, 0, 0.86 * S, 0); sg.addColorStop(0, '#8aa0c0'); sg.addColorStop(0.5, '#f6faff'); sg.addColorStop(1, '#8aa0c0');
    g.save(); g.strokeStyle = sg; g.lineWidth = 8 * k; cradle(); g.stroke(); g.restore();                                                                                                   // the silver cradle
    g.save(); g.strokeStyle = css(c, 0.8); g.lineWidth = 2 * k; g.shadowColor = css(c, 1); g.shadowBlur = 8 * k; cradle(); g.stroke(); g.restore();                                          // a thin colour edge with a soft glow
    pearl(0.14, 0.38, 4.6); pearl(0.86, 0.38, 4.6);
    const T0 = [0.5, 0.17], R0 = [0.65, 0.40], B0 = [0.5, 0.64], L0 = [0.35, 0.40], C0 = [0.5, 0.40], X = (q) => [q[0] * S, q[1] * S];
    const tri = (a2, b2, d2) => { g.beginPath(); g.moveTo(...X(a2)); g.lineTo(...X(b2)); g.lineTo(...X(d2)); g.closePath(); };
    g.save(); g.strokeStyle = 'rgba(4,10,24,0.66)'; g.lineWidth = 13 * k; g.beginPath(); g.moveTo(...X(T0)); g.lineTo(...X(R0)); g.lineTo(...X(B0)); g.lineTo(...X(L0)); g.closePath(); g.stroke(); g.restore();   // the gem: dark underlay,
    g.save(); g.shadowColor = css(c, 1); g.shadowBlur = 16 * k; g.fillStyle = css(c, 1); g.beginPath(); g.moveTo(...X(T0)); g.lineTo(...X(R0)); g.lineTo(...X(B0)); g.lineTo(...X(L0)); g.closePath(); g.fill(); g.restore();   // the colour glow,
    g.save(); tri(T0, L0, C0); g.fillStyle = css(toward(c, WHITE, 0.55), 1); g.fill(); tri(T0, R0, C0); g.fillStyle = css(toward(c, WHITE, 0.2), 1); g.fill(); tri(L0, B0, C0); g.fillStyle = css(toward(c, BLACK, 0.22), 1); g.fill(); tri(R0, B0, C0); g.fillStyle = css(toward(c, BLACK, 0.42), 1); g.fill(); g.restore();   // the facets,
    g.save(); g.strokeStyle = css(hot, 0.97); g.lineWidth = 2.6 * k; g.beginPath(); g.moveTo(...X(T0)); g.lineTo(...X(R0)); g.lineTo(...X(B0)); g.lineTo(...X(L0)); g.closePath(); g.stroke(); g.restore();   // the white-hot edge
  } else {                                                                                                                                                                                      // 'halo': a thin neon ring seen from slightly above + a four-point spark over it
    const ell = () => { g.beginPath(); g.ellipse(0.5 * S, 0.54 * S, 0.30 * S, 0.085 * S, 0, 0, 6.2832); };
    g.save(); g.strokeStyle = 'rgba(4,10,24,0.6)'; g.lineWidth = 13 * k; ell(); g.stroke(); g.restore();
    g.save(); g.shadowColor = css(c, 1); g.shadowBlur = 15 * k; g.strokeStyle = css(c, 1); g.lineWidth = 7 * k; ell(); g.stroke(); g.stroke(); g.restore();
    g.save(); g.strokeStyle = css(hot, 0.97); g.lineWidth = 2.6 * k; ell(); g.stroke(); g.restore();
    const sx = 0.5 * S, sy = 0.27 * S, a = 0.12 * S, b = 0.045 * S;
    const star = () => { g.beginPath(); g.moveTo(sx, sy - a); g.quadraticCurveTo(sx + b * 0.3, sy - b * 0.3, sx + a * 0.62, sy); g.quadraticCurveTo(sx + b * 0.3, sy + b * 0.3, sx, sy + a); g.quadraticCurveTo(sx - b * 0.3, sy + b * 0.3, sx - a * 0.62, sy); g.quadraticCurveTo(sx - b * 0.3, sy - b * 0.3, sx, sy - a); g.closePath(); };
    g.save(); g.strokeStyle = 'rgba(4,10,24,0.6)'; g.lineWidth = 8 * k; star(); g.stroke(); g.restore();
    g.save(); g.shadowColor = css(c, 1); g.shadowBlur = 12 * k; g.fillStyle = css(hot, 1); star(); g.fill(); g.restore();
  }
}
export function drawHalo(cv) {                                          // white, tinted by the material colour; additive
  const S = cv.width, g = cv.getContext('2d'), r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  r.addColorStop(0, 'rgba(255,255,255,0.80)'); r.addColorStop(0.2, 'rgba(255,255,255,0.62)'); r.addColorStop(0.45, 'rgba(255,255,255,0.30)'); r.addColorStop(0.72, 'rgba(255,255,255,0.08)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.clearRect(0, 0, S, S); g.fillStyle = r; g.fillRect(0, 0, S, S);
}
export function drawRing(cv) {                                          // white, tinted by the material colour; additive: a faint disc, a thin bright ring at 0.8 of the radius, a soft outer fade
  const S = cv.width, g = cv.getContext('2d'), r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  [[0, 0.07], [0.5, 0.12], [0.66, 0.30], [0.76, 0.80], [0.80, 1.0], [0.84, 0.80], [0.92, 0.22], [1, 0]].forEach(([s, a]) => r.addColorStop(s, `rgba(255,255,255,${a})`));
  g.clearRect(0, 0, S, S); g.fillStyle = r; g.fillRect(0, 0, S, S);       // (RP1C-R3, owner 15 Oct 18:40: NO crown inside the ring)
}

export function createMarker(H, S, G = {}) {
  const T = H.THREE, camera = H.camera;
  const st = { on: false, look: LOOK[G.look] ? G.look : 1, ms: 0, vis: 0, calls: 0 };
  const ents = []; let haloTex = null, ringTex = null, planeGeo = null;
  const v = new T.Vector3(), _hv = new T.Vector3(), tex = (cv) => { const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 2; return t; };
  const canvas = (n) => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };

  function shared() {
    if (!haloTex) { const c = canvas(128); drawHalo(c); haloTex = tex(c); }
    if (!ringTex) { const c = canvas(256); drawRing(c); ringTex = tex(c); }
    if (!planeGeo) planeGeo = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  }
  const paintSign = (e) => { const n = st.look; drawSign(e.cv, e.hex, LOOK[n].kind); e.signTex.needsUpdate = true; e.drawn = n; };
  // attach a marker to `node` (a Group; the sprites become its children, so they follow it through the scene switches).  opts: head = the height of the top of her head in node space, blob = the contact-shadow mesh to hang the ring on,
  // self = this is the character the camera follows (hidden in first person, faded out when the camera is squeezed against her)
  function attach(node, hex, opts = {}) {
    shared(); const e = { node, hex, self: !!opts.self, bone: opts.bone || null, head: opts.head || 1.9, ph: Math.random() * 6.28, blob: opts.blob || null, drawn: 0 };
    e.cv = canvas(256); e.signTex = tex(e.cv); paintSign(e);
    e.mSign = new T.SpriteMaterial({ map: e.signTex, transparent: true, depthWrite: false, opacity: 1, fog: false });                                                       // = the door icons' parameters: the same program
    e.mHalo = new T.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.9, fog: false, color: new T.Color(hex) });       // (normal blending: an additive glow is invisible on the bright day sky)
    e.mRing = new T.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, blending: T.AdditiveBlending, color: new T.Color(hex), opacity: 0.7 });   // = the contact shadow's parameters
    e.halo = new T.Sprite(e.mHalo); e.halo.renderOrder = 11; e.sign = new T.Sprite(e.mSign); e.sign.renderOrder = 12;
    e.ring = new T.Mesh(planeGeo, e.mRing); e.ring.renderOrder = 4; e.ring.frustumCulled = false; e.ring.castShadow = e.ring.receiveShadow = false;
    for (const o of [e.halo, e.sign, e.ring]) { o.userData.rpHero = true; o.userData.rpMarker = true; }
    node.add(e.halo); node.add(e.sign);
    if (e.blob) { e.ring.position.y = 0.012; e.blob.add(e.ring); } else { e.ring.position.y = 0.05; node.add(e.ring); }       // (the ring's size is set in apply(): RING_W metres whatever the blob's scale)
    ents.push(e); apply(e, 1, 3, 4, 0); return e;
  }
  function detach(e) {
    const i = ents.indexOf(e); if (i < 0) return; ents.splice(i, 1);
    for (const o of [e.halo, e.sign, e.ring]) o.removeFromParent();
    e.mSign.dispose(); e.mHalo.dispose(); e.mRing.dispose(); e.signTex.dispose();
  }
  const fadeOf = (d) => Math.min(1, Math.max(0, (FAR - d) / NEAR_FADE));
  const RING_W = 1.3;                                                           // RP1C-R3 (owner 18:40: «back to the smaller ring»): outer diameter in metres (the bright circle = 0.8 of it = 1.04 m, about a pace across)
  const SELF_NEAR = [1.5, 2.8];                                                 // the self marker: gone at 1.5 m from the camera, full at 2.8 m (the camera squeezed against her would show a huge sign)
  // size / position / opacity of one marker for the camera distance d, the fade f (0..1), the time t and the ground direction camera -> character (yaw: the ring is turned to face the camera)
  function apply(e, f, tt, d = 4, yaw = 0) {
    if (e.self) f *= Math.min(1, Math.max(0, (d - SELF_NEAR[0]) / (SELF_NEAR[1] - SELF_NEAR[0])));
    if (e.drawn !== st.look) paintSign(e);
    const L = LOOK[st.look], k = Math.min(KMAX, Math.max(1, d / D0)), w = SGW * k, sw = w / L.dw;       // w = the drawn width in metres, sw = the sprite's side
    let sx = 0, sz = 0, hy = e.head; if (e.bone) { if (e.boneOff == null) e.node.updateMatrixWorld(true); e.bone.getWorldPosition(_hv); e.node.worldToLocal(_hv); sx = _hv.x; sz = _hv.z; if (e.boneOff == null) e.boneOff = e.head - _hv.y; hy = _hv.y + e.boneOff; }       // (the head bone's height too: swimming / lying, she is 1 m lower than standing and the sign follows her head)
    const up = hy + GAP * (0.6 + 0.4 * k) + (L.base - 0.5) * sw + 0.025 * k * Math.sin(tt * 1.5 + e.ph);       // exactly over her head (the horizontal position of the head bone, not of her feet: she sways, the cape, the lean on a turn) with a clear gap that grows a little with the distance
    const vis = f > 0.01 && !(e.self && S.mode === 'first') && (!e.node.parent || e.node.visible);
    e.sign.visible = vis; e.halo.visible = vis; e.ring.visible = vis;
    if (!vis) return;
    e.sign.position.set(sx, up, sz); e.sign.scale.set(sw, sw, 1); e.mSign.opacity = f;
    const br = Math.sin(tt * 1.25 + e.ph); e.halo.position.set(sx, up, sz); const hs = w * 3.5 * (1 + 0.07 * br); e.halo.scale.set(hs, hs, 1); e.mHalo.opacity = f * (0.86 + 0.12 * br);
    e.mRing.opacity = f * 0.68; if (!e.blob) e.ring.position.y = 0.05;
    const bs = e.blob ? (S.shLook === 1 ? 1 : 0.72) : 1; e.ring.scale.set(RING_W / bs, 1, RING_W / bs);       // (the ring is a child of the blob, whose scale is 0.72 in the shadow looks B / C (rpg.js placeBlob): divided out here, so the ring is RING_W in every look and still shrinks with the blob in the air)
    e.ring.rotation.y = yaw - (e.blob ? 0 : e.node.rotation.y);
  }
  function tick(now) {
    if (!st.on) return; const t0 = performance.now(), tt = now / 1000; let vis = 0, calls = 0;
    for (const e of ents) {
      e.node.getWorldPosition(v); const dx = v.x - camera.position.x, dz = v.z - camera.position.z, d = Math.hypot(dx, v.y - camera.position.y, dz), f = fadeOf(d);
      apply(e, f, tt, d, Math.atan2(-dx, -dz)); if (e.sign.visible) { vis++; calls += 3; }
    }
    st.vis = vis; st.calls = calls; st.ms = performance.now() - t0;
  }
  function setLook(n) { st.look = LOOK[n | 0] ? n | 0 : 1; return st.look; }
  // the hero: her own colour (the emblem colour of the sister), the head height and her contact shadow come from rpg.js
  function enter() {
    if (st.on) return; st.on = true; const h = S.hero; if (!h || !G.colour) return;
    attach(h.grp, G.colour(S.key), { head: G.head, blob: h.blob, bone: h.head, self: true });
  }
  function exit() {
    if (!st.on) return; st.on = false; for (const e of ents.slice()) detach(e);
    if (haloTex) { haloTex.dispose(); haloTex = null; } if (ringTex) { ringTex.dispose(); ringTex = null; } if (planeGeo) { planeGeo.dispose(); planeGeo = null; }
  }
  const info = () => ({ on: st.on, look: st.look, markers: ents.length, visible: st.vis, calls: st.calls, ms: +st.ms.toFixed(3), colours: ents.map((e) => e.hex) });
  return { enter, exit, tick, attach, detach, setLook, info, st, ents, LOOKS };
}
