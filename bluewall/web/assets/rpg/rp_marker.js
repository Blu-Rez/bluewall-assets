// RP1C-R3 — Job 8 + ADDENDUM 3, as the owner finally wanted it (15 Oct 18:40): NO crown anywhere; a small EMPTY ground ring under her (the size it had before); and above her head a slightly glowing triangle «mention» marker
// that hangs EXACTLY over the head bone with a clear gap.
//   · the SIGN above the head: a small neon marker in the character's OWN colour (her emblem / accent colour) — look 1 = a faceted glowing triangle gem (default), 2 = a flat neon triangle, 3 = a diamond — billboard Sprite,
//     dark underlay + colour glow + white-hot core (drawn once on a 128 px canvas), clamped in size at distance, faded out between 32 and 40 m, a slow float; the self marker also fades out when the camera is squeezed closer than ~2 m;
//   · the HALO: a small soft glow sprite behind the sign (normal blending: an additive one vanishes on the bright day sky), same colour, slow breathing (CPU, one sine per frame);
//   · the GROUND RING: an additive decal of the same colour, empty, that is a CHILD of the hero's own contact-shadow quad (rpg.js `blob`), so it takes the slope, the position and the in-the-air shrink of the shadow for free.
//   ?crown=1|2|3 in the dev page (the name is kept for the tests), marker.setLook(n) in the tests.
// Budget (counted by dev/rp1c3_test.sh): +0 shader programs — the sprites use the parameters of the door icons (SpriteMaterial, map, fog:false), the ring those of the contact shadow (MeshBasicMaterial, map, DoubleSide, fog on),
// blending / opacity / colour are state, not part of a program.  No real light, no per-frame allocation, no image file (canvas only), nothing in the boot bundle.  Calls: the hero costs 2 sprites + 1 ring = 3 (a character that is
// further than 40 m, behind the camera or in first person costs 0: Sprites are frustum culled, the rest is hidden).
// WHY NOT ONE InstancedMesh: a per-instance colour needs `instanceColor` (a different program) or a custom attribute (onBeforeCompile = a different program) — both break «+0 programs»; the colour is a material uniform instead.
export const LOOKS = { 1: 'faceted glowing triangle gem + halo + small ring', 2: 'flat neon triangle + halo + small ring', 3: 'diamond + halo + small ring' };      // (owner 18:40: no crown anywhere; the sign hangs exactly over her head with a clear gap; the ring is small and empty)
const FAR = 40, NEAR_FADE = 8;                                    // metres: invisible at FAR, full below FAR - NEAR_FADE
const D0 = 6, KMAX = 3.5;                                         // the sign keeps its size to 6 m, then grows with the distance up to x3.5 (= 21 m), so it never gets smaller than ~40 px on a phone
const SGW = 0.24;                                                 // width in metres of the sign at the near distance
const SS = 128 / 78;                                              // sprite width / drawn width (the triangle / diamond is 78 of 128 px)

const rgb = (hex) => { const n = parseInt(String(hex).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const toward = (c, w, t) => [c[0] + (w[0] - c[0]) * t, c[1] + (w[1] - c[1]) * t, c[2] + (w[2] - c[2]) * t];

// ---- the textures ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// the sign: a neon triangle ▼ (kind 'chev') or a diamond ◆ ('dia'), three passes so it reads on the bright day sky AND on the night: (1) a dark underlay, (2) the colour glow, (3) the white-hot core
export function drawSign(cv, hex, kind) {
  const S = cv.width, g = cv.getContext('2d'), c = rgb(hex), hot = toward(c, [255, 255, 255], 0.8), k = S / 128;
  const P = kind === 'dia' ? [[0.5, 0.12], [0.88, 0.5], [0.5, 0.88], [0.12, 0.5]] : [[0.17, 0.22], [0.83, 0.22], [0.5, 0.80]];
  g.clearRect(0, 0, S, S); g.lineJoin = 'round'; g.lineCap = 'round';
  if (kind === 'gem') return drawGem(g, S, c, hot, k);
  const path = () => { g.beginPath(); P.forEach((p, i) => { const x = p[0] * S, y = p[1] * S; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
  g.save(); g.strokeStyle = 'rgba(6,10,18,0.58)'; g.lineWidth = 15 * k; path(); g.stroke(); g.restore();                                   // 1. dark underlay
  g.save(); path(); g.fillStyle = css(c, 0.30); g.fill(); g.restore();                                                                       // 2. a faint colour fill
  g.save(); g.shadowColor = css(c, 1); g.shadowBlur = 16 * k; g.strokeStyle = css(c, 1); g.lineWidth = 8.5 * k; path(); g.stroke(); g.stroke(); g.restore();   // 3. the colour glow
  g.save(); g.strokeStyle = css(hot, 0.97); g.lineWidth = 3 * k; path(); g.stroke(); g.restore();                                            // 4. the white-hot core
}
// the gem: an upside-down three-sided pyramid seen from the side (a lit right facet, a darker left one, a bright top rim), a soft glow in her colour: the «mention» marker of the owner's word
function drawGem(g, S, c, hot, k) {
  const A = [0.16, 0.24], B = [0.84, 0.24], C = [0.5, 0.82], M = [0.5, 0.40], X = (p) => [p[0] * S, p[1] * S];
  const tri = (a, b, d) => { g.beginPath(); const pa = X(a), pb = X(b), pd = X(d); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); g.lineTo(pd[0], pd[1]); g.closePath(); };
  g.save(); g.strokeStyle = 'rgba(6,10,18,0.58)'; g.lineWidth = 15 * k; tri(A, B, C); g.stroke(); g.restore();                                                  // 1. dark underlay
  g.save(); g.shadowColor = css(c, 1); g.shadowBlur = 18 * k; g.strokeStyle = css(c, 1); g.lineWidth = 8 * k; tri(A, B, C); g.stroke(); g.restore();                    // 2. colour glow
  g.save(); tri(A, M, C); g.fillStyle = css(toward(c, [0, 0, 0], 0.35), 0.80); g.fill(); tri(M, B, C); g.fillStyle = css(toward(c, [255, 255, 255], 0.15), 0.95); g.fill(); tri(A, B, M); g.fillStyle = css(toward(c, [255, 255, 255], 0.55), 0.95); g.fill(); g.restore();   // 3. the facets
  g.save(); g.strokeStyle = css(hot, 0.97); g.lineWidth = 3 * k; tri(A, B, C); g.stroke(); g.lineWidth = 2 * k; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(...X(A)); g.lineTo(...X(M)); g.lineTo(...X(B)); g.moveTo(...X(M)); g.lineTo(...X(C)); g.stroke(); g.restore();   // 4. white-hot edges
}
export function drawHalo(cv) {                                          // white, tinted by the material colour; additive
  const S = cv.width, g = cv.getContext('2d'), r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  r.addColorStop(0, 'rgba(255,255,255,0.80)'); r.addColorStop(0.2, 'rgba(255,255,255,0.62)'); r.addColorStop(0.45, 'rgba(255,255,255,0.30)'); r.addColorStop(0.72, 'rgba(255,255,255,0.08)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.clearRect(0, 0, S, S); g.fillStyle = r; g.fillRect(0, 0, S, S);
}
export function drawRing(cv) {                                          // white, tinted by the material colour; additive: a faint disc, a thin bright ring at 0.8 of the radius, a soft outer fade, the faint crown in the middle
  const S = cv.width, g = cv.getContext('2d'), r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  [[0, 0.07], [0.5, 0.12], [0.66, 0.30], [0.76, 0.80], [0.80, 1.0], [0.84, 0.80], [0.92, 0.22], [1, 0]].forEach(([s, a]) => r.addColorStop(s, `rgba(255,255,255,${a})`));
  g.clearRect(0, 0, S, S); g.fillStyle = r; g.fillRect(0, 0, S, S);       // (RP1C-R3, owner 15 Oct 18:40: NO crown inside the ring)
}

export function createMarker(H, S, G = {}) {
  const T = H.THREE, camera = H.camera;
  const st = { on: false, look: G.look || 1, ms: 0, vis: 0, calls: 0 };
  const ents = []; let haloTex = null, ringTex = null, planeGeo = null;
  const v = new T.Vector3(), _hv = new T.Vector3(), tex = (cv) => { const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 2; return t; };
  const canvas = (n) => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };

  function shared() {
    if (!haloTex) { const c = canvas(128); drawHalo(c); haloTex = tex(c); }
    if (!ringTex) { const c = canvas(256); drawRing(c); ringTex = tex(c); }
    if (!planeGeo) planeGeo = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  }
  const paintSign = (e) => { const n = st.look; drawSign(e.cv, e.hex, n === 1 ? 'gem' : n === 3 ? 'dia' : 'chev'); e.signTex.needsUpdate = true; e.drawn = n; };
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
    const k = Math.min(KMAX, Math.max(1, d / D0)), w = SGW * k, sw = w * SS;
    let sx = 0, sz = 0, hy = e.head; if (e.bone) { if (e.boneOff == null) e.node.updateMatrixWorld(true); e.bone.getWorldPosition(_hv); e.node.worldToLocal(_hv); sx = _hv.x; sz = _hv.z; if (e.boneOff == null) e.boneOff = e.head - _hv.y; hy = _hv.y + e.boneOff; }       // (the head bone's height too: swimming / lying, she is 1 m lower than standing and the sign follows her head)
    const up = hy + 0.20 + 0.50 * w + 0.025 * k * Math.sin(tt * 1.5 + e.ph);       // (a clear gap between the top of her head and the tip of the gem: ~20 cm at the near distance)       // exactly over her head: the horizontal position of the head bone, not of her feet (she sways, the cape, the lean on a turn)
    const vis = f > 0.01 && !(e.self && S.mode === 'first') && (!e.node.parent || e.node.visible);
    e.sign.visible = vis; e.halo.visible = vis; e.ring.visible = vis;
    if (!vis) return;
    e.sign.position.set(sx, up, sz); e.sign.scale.set(sw, sw, 1); e.mSign.opacity = f;
    const br = Math.sin(tt * 1.25 + e.ph); e.halo.position.set(sx, up, sz); const hs = w * 3.0 * (1 + 0.07 * br); e.halo.scale.set(hs, hs, 1); e.mHalo.opacity = f * (0.80 + 0.14 * br);
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
  function setLook(n) { st.look = Math.max(1, Math.min(3, n | 0)); return st.look; }
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
