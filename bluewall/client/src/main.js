// Blue Wall — entry. The loader (web/index.html) authenticates, downloads this
// bundle and calls window.BlueWall.start(opts).
import { attackRoster } from './armyplan.js';
import { pb, pe, pframe, PROF } from './prof.js';
import { createPerfHud } from './perfhud.js';
import { createGpuTimer } from './gputime.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { createPerf, createCap, installMatrixSkip } from './perf.js';   // PF1: adaptive frame cap
import { createShaderWarm } from './shaderwarm.js';
import { createReflect } from './reflect.js';
import { REFL_LAYER } from './reflect.js'; import { nightPathWanted } from './perf.js';   // PF2: late lights get the mirror layer before the first compile; the bloom (night) path is built only when dusk is near
import { createCoach } from './coach.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { T as THEME, setThemeLevel, levelHint, saveLevelHint } from './theme.js';
import { prefetch, LATE, heroKit } from './assets.js';
import { createLoadView } from './bhud.js';
import { buildNav, bridgesFromLayout } from './nav.js';
import { staticSolids } from './solids.js';
import { CamCtl } from './controls.js';
import { createCamBlock } from './camblock.js';
import { createLayoutLive } from './layout_live.js';      // TR2-S5: the player's own layout
import { createLayoutUI } from './layout_ui.js';
import { createLayoutSync } from './layout_sync.js';
import { UI } from './ui.js';
import { Ambience } from './audio.js';
import { PX } from './fx.js';
import * as L from './layout.js';
import { sample, gameHour, clockParts, todWord } from './tod.js';
import { settings, onSetting } from './settings.js';
import { Econ } from './econ.js';
import { createUpgradeUI } from './upgradeui.js';
import { createArmyUI } from './armyui.js';
import { createSheetUI } from './bsheet.js';                    // T1: the building context sheet (tap a building -> its own sheet)
import { createRankUI } from './rankui.js';
import { createSocialUI } from './socialui.js';
import { createAssist } from './assist.js';
import { createShopUI } from './shopui.js';
import { createBattleMode } from './battle.js';
import { setEmblem } from './textures.js';
import { setGateName } from './her_flags.js';
import { setShieldCrest } from './gear_shield.js';
import { DS, DU } from './destruct.js';
import { createProbe } from './pf_probe.js';                      // PF1: the measuring probe (?pf=1) + the owner's phone benchmark window.BW_bench (nothing runs without ?pf=1 / owner)
import { REACH } from './reach.js';                                  // RP1B: the owner's hero mode lowers draw distance / pixel ratio / update rate here (all neutral = 1 for everyone else)

const VERSION = '4.0';
const PRESETS = {
  ultra: { level: 'ultra', dpr: 2, shadows: true, shadowSize: 2048, bloom: true, lights: 6, msaa: 4 },
  high: { level: 'high', dpr: 1.25, shadows: true, shadowSize: 1536, bloom: true, lights: 4, msaa: 2 },
  medium: { level: 'medium', dpr: 1.1, shadows: true, shadowSize: 1024, bloom: false, lights: 3, msaa: 0 },
  low: { level: 'low', dpr: 1, shadows: false, shadowSize: 512, bloom: false, lights: 2, msaa: 0 },
};

function pickQuality(opts) {
  const want = opts.quality || settings.quality;
  if (want && PRESETS[want]) return { ...PRESETS[want] };
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  let lv = 'high';
  if (cores <= 4 || mem <= 3) lv = 'medium';
  if (cores <= 2 || mem <= 2) lv = 'low';
  return { ...PRESETS[lv] };
}

async function start(opts) {
  const root = opts.root || document.body, tg = opts.tg || null;
  const prog = (p, txt) => { try { opts.progress && opts.progress(p * 100, txt); } catch (e) { /* ignore */ } };
  L.setMap('night');
  const Q = pickQuality(opts);
  Q.grass = settings.grass; Q.trees = settings.trees; Q.dev = !!opts.dev;
  Q.level0 = levelHint(opts.level); setThemeLevel(Q.level0); if (opts.dev) window.__bwTheme = THEME;            // p35 P9: the world is built before the server answers, so it starts in the mood of the last level this device showed
  if (!settings.shadows) Q.shadows = false;
  // dev/test: ?h=13.5 pins the game hour
  const devH = opts.hour != null ? +opts.hour : null;
  let hourF = null; const pinned = () => (hourF != null ? hourF : devH);   // PF2: BW_bench forces the hour (13 / 23) through ctx.setHour(h); null = the real clock again
  const hourNow = () => { const p = pinned(); return p != null ? p : gameHour(); };

  const PFOFF = /[?&]pfoff=1/.test(location.search);   // PF1: ?pfoff=1 = every PF1 behaviour change off (old frame cap, pixel floor, audio timing, matrices): the A/B switch for BW_bench on a phone
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: Q.level !== 'low' && !/[?&]aa=0/.test(location.search), powerPreference: 'high-performance', stencil: false });   // PF1: MSAA stays as it was (the hero view draws at ~1.7x, where the edges show); ?aa=0 = MSAA off, only to A/B on a phone with BW_bench
  } catch (e) { throw new Error('webgl'); }
  if (!renderer.capabilities.isWebGL2) Q.msaa = 0;
  const MSKIP = PFOFF ? { on: false, skip: 0, run: 0 } : installMatrixSkip(THREE, !/[?&]nomskip=1/.test(location.search));   // PF1: unchanged objects keep their matrices (bit-identical result; ?nomskip=1 = off)
  const DYN = { s: 1, hero: false }, CAP = createCap(PFOFF);   // PF1: DYN.hero = the sharp hero view (pixel-ratio floor 1.0); CAP = adaptive frame cap (perf.js)   // dynamic resolution scale (keeps the frame rate up)
  // p28 thermal governor: after a long, continuous, full-rate session (or when the frame time creeps up = the phone is throttling) it steps the sustained load down in small,
  // hard-to-notice steps (render scale, shadow / mirror refresh); resting (idle, panels, hidden) cools it back. "Cool mode" (settings) is the manual, stronger version.
  const GOV = { lvl: 0, active: 0, win: 0, wn: 0, base: 0, since: 0, steps: 0 }, GOVK = [1, 0.95, 0.9, 0.82];
  const cool = () => !!settings.coolMode;
  const dpr = () => { let b = Math.min(window.devicePixelRatio || 1, REACH.cap || Q.dpr); if (cool()) b = Math.min(b, 1); return Math.max(REACH.own ? 0.5 : DYN.hero ? 1 : 0.75, b * (+settings.resScale || 1) * (REACH.own ? 1 : DYN.s) * REACH.dpr * (cool() ? 0.9 : (REACH.own ? 1 : GOVK[GOV.lvl]))); };   // RP1C: in hero mode the hero's own governor owns the resolution (REACH.cap / REACH.own)   // PF1 + RP1C (merged by the mother): floor 1.0 in the hero view unless RP1C's own hero governor is in charge (it cuts shadows / crowd / bloom first and may take the pixel ratio down to 0.5 as the very last step)
  renderer.setPixelRatio(dpr());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = !!Q.shadows; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.8, 3200);
  let battle = null;                                        // attack mode (created after the UI)
  let pre = false;                                          // the late models download in the background while the world is being built
  const OLD = !!(opts.dev && (opts.oldLoad || window.__bwOldLoad));        // dev only: the p38 loader (one big compile + a full-scene warm-up), for the before / after measurement
  const early = []; let pw = performance.now();                             // (stage durations of the world build: sent to the black box once it exists)
  const progW = (p, txt) => { const n = performance.now(); if (n - pw > 250) { early.push(['w:' + String(txt).slice(0, 22), n - pw]); if (opts.dev) console.info('[late] stage before "' + txt + '" ' + ((n - pw) | 0) + 'ms'); } pw = n; if (!pre && p >= 0.46) { pre = true; prefetch(LATE); } prog(p * (OLD ? 0.72 : 0.62), p >= 1 ? 'Waking the realm…' : txt); };
  const world = await buildWorld(renderer, scene, Q, progW);
  let P = sample(hourNow());
  world.setTime(P, Date.now());
  world.setWeather && world.setWeather(opts.weather || 'auto', true);
  const refl = createReflect({ renderer, scene, camera, water: world.water, level: Q.level, DYN });   // (high / ultra: the moat mirrors the castle)

  const G = L.GATE;
  const ctl = new CamCtl(camera, renderer.domElement, world.fastHeight || ((x, z) => L.height(x, z)), { azim: Math.atan2(G.nx, G.nz) + 0.22 });
  ctl.block = createCamBlock({ height: world.fastHeight }).set(world.targets || []).spheres(() => world.creatures || []);
  world.layout = createLayoutLive(world, { onChange: () => { ctl.block.set(world.targets || []); } });      // TR2-S5: shows the player's moved homes / production lots / storehouses (layout_live.js)
  world.applyLayout = (rec) => world.layout.apply(rec);      // TR2-S5: the attack map applies the defender's record (player_target.layout): idempotent, null = nothing happens (BT1_R2)
  const applyCtl = () => { ctl.rotSpeed = +settings.rotSpeed || 1; ctl.zoomSpeed = +settings.zoomSpeed || 1; ctl.invert = !!settings.invertRotate; };
  applyCtl();
  let composer = null, bloom = null;
  const NRES = Math.max(0.5, Math.min(1, +((/[?&]nres=([0-9.]+)/.exec(location.search) || [])[1]) || 1));   // PF2: ?nres=0.7 = the night (bloom composer) path renders at 0.7 x the resolution: an A/B switch for BW_bench on a phone, 1 = unchanged (default)
  function makeComposer() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: Q.msaa });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(Math.ceil(size.x / 3), Math.ceil(size.y / 3)), 0.55, 0.45, 1.05);       // (a third of the resolution: the glow is soft anyway, and the blur chain is the costly part)
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.setPixelRatio(renderer.getPixelRatio() * NRES);   // PF2: * NRES
  }
  function dropComposer() { if (!composer) return; try { composer.dispose(); bloom.dispose(); } catch (e) { /* ignore */ } composer = null; bloom = null; }
  if (Q.bloom && settings.bloom) makeComposer();
  // which way a frame is drawn: through the bloom composer at night (and not in cool mode), straight to the screen by day.  (dev: window.__bwPath = 'c' | 'd' forces one, for the colour-jump measurements)
  // p39: a path whose programs are not built yet is not switched to (the switch used to stall the phone for seconds at dusk / dawn): `pathReady` is filled by the sliced compile (shaderwarm.js)
  const pathReady = { screen: false, rt: false };
  const useComposer = () => {
    if (!composer) return false;
    if (opts.dev && window.__bwPath) return window.__bwPath === 'c';
    if (cool() || REACH.nobloom) return false;
    const want = P.night > 0.25;
    if (OLD || !lateReady) return want;
    if (want && pathReady.screen && !pathReady.rt) return false;            // the bloom path is not built yet: stay on the plain one
    if (!want && pathReady.rt && !pathReady.screen) return true;            // started at night and the plain path is not built yet: stay on the bloom one
    return want;
  };
  // dev only: mean luminance of every drawn frame (window.__bwLumOn = true -> window.__bwLum = [{f, lum, rgb, exp, dpr, path}]) - to see a colour jump as numbers
  let _lc = null, _lx = null;
  function lumSample(tag) {
    try {
      if (!_lc) { _lc = document.createElement('canvas'); _lc.width = 32; _lc.height = 18; _lx = _lc.getContext('2d', { willReadFrequently: true }); }
      _lx.drawImage(renderer.domElement, 0, 0, 32, 18); const d = _lx.getImageData(0, 0, 32, 18).data; let r = 0, g = 0, b = 0; const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      r /= n; g /= n; b /= n; (window.__bwLum = window.__bwLum || []).push({ f: frames, lum: +(0.2126 * r + 0.7152 * g + 0.0722 * b).toFixed(2), rgb: [r, g, b].map((v) => +v.toFixed(1)), exp: +renderer.toneMappingExposure.toFixed(3), dpr: +renderer.getPixelRatio().toFixed(2), path: useComposer() ? 'c' : 'd', night: +(P.night || 0).toFixed(2), tag: tag || 'mid' });
    } catch (e) { /* dev only */ }
  }

  // ------------------------------------------------ layout (portrait / whatever the phone does)
  function layout() { root.style.cssText = 'position:fixed;inset:0;overflow:hidden;overflow:clip'; resize(); }
  // a panel that is still sliding in must never be able to scroll the page (focus / scrollIntoView would shift the whole HUD)
  const unscroll = () => { if (root.scrollTop || root.scrollLeft) { root.scrollTop = 0; root.scrollLeft = 0; } const se = document.scrollingElement; if (se && (se.scrollTop || se.scrollLeft)) { se.scrollTop = 0; se.scrollLeft = 0; } };
  root.addEventListener('scroll', unscroll, { passive: true }); window.addEventListener('scroll', unscroll, { passive: true });
  function resize() {
    const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight;
    renderer.setPixelRatio(dpr());
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 0.8 ? 63 : 52; camera.updateProjectionMatrix();                // (p38: a wider angle of view: 58 -> 63 portrait, 46 -> 52 landscape)
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio() * NRES); composer.setSize(w, h); }   // PF2: * NRES
    const dh = renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    PX.scale.value = dh / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    if (world.weather && world.weather.setPx) world.weather.setPx(PX.scale.value);
    ctl.setView(w / h < 0.8);
    if (battle) battle.resize();
  }

  // ------------------------------------------------ UI, sound, picking
  const audio = new Ambience();
  const ui = new UI({ tg, mount: root, version: VERSION, owner: !!(opts.owner || opts.dev), onOwner: async (k) => { if (k === 'bench') { try { ui.openSettings(false); } catch (e) { /* ignore */ } setTimeout(() => { try { window.BW_bench && window.BW_bench.run(); } catch (e) { /* ignore */ } }, 700); return !!window.BW_bench; }   /* mother: PF1's phone benchmark (closes the settings panel first: the bench refuses to run behind an open panel) */ const p = econ.prem(), b = k === 'max' ? { max: true } : k === 'royal' ? { own: { tesla: 4, dragonling: true } } : k === 'plain' ? { own: { tesla: 0, dragonling: false } } : { prem: { sap: p.sap + 200, onyx: p.onyx + 40 } }; const j = await econ.dev(b); const ok = !!(j && j.ok); if (ok && k === 'max') { saveLevelHint(30); setTimeout(() => location.reload(), 1100); }     /* (p36: the houses take their colours when the world is built: a fresh start shows the whole level-30 realm) */ return ok; }, onClick: () => audio.click && audio.click(), onShop: (k) => shop && shop.open(k), onTutorial: () => { ui.openSettings(false); coach.reset(); setTimeout(() => coach.home(true), 450); } });
  const econ = new Econ({ token: opts.token || null, level: opts.level || Q.level0 || 20 });
  if (!opts.token && opts.gems) Object.assign(econ.st.gems, opts.gems);
  ui.setProfile({ name: opts.name || 'Blꪊe', level: econ.st.level });
  setGateName(opts.name || 'Blue Wall');                       // the realm's name over the main gate (her_flags.js)
  ui.setGems(econ.wallet()); ui.setPrem(econ.prem());
  world.events && (world.events.onBallista = (x, y, z, kind) => { const d = Math.hypot(camera.position.x - x, camera.position.y - y, camera.position.z - z), v = Math.max(0, 1 - d / 240); if (kind === 'cannon') { if (audio.thump) audio.thump(v * 0.9); } else audio.twang(v); });
  const upgrade = createUpgradeUI(root, { econ, ui, world, audio, tg });
  const armyUI = createArmyUI(root, { econ, ui, audio, onAttack: (target, loader) => startBattle(target, loader), onShop: (k) => shop && shop.open(k) });
  const rankUI = createRankUI(root, { econ, ui, audio });
  const socialUI = createSocialUI(root, { econ, ui, audio });
  const shop = createShopUI(root, { econ, ui, audio });
  const assist = createAssist(root, { econ, ui, audio, army: armyUI, upgrade, rank: rankUI, social: socialUI, shop, tg });
  const coach = createCoach(ui.root || root, { audio, ui, econ, battleHost: root });   // first-hour tour (once, for a new player) + first-attack tour; replay from Settings
  ctl.onIntroEnd = () => { if (coach.isNew()) setTimeout(() => coach.home(), 700); };
  battle = createBattleMode({ renderer, scene, camera, root, world, audio, econ, ui, weatherMode: opts.weather || 'auto',
    pf: { sw: () => sw, mark: (n, d) => bbox.mark(n, d), rt: () => (useComposer() && composer ? composer.readBuffer : null), draw: () => { if (useComposer()) composer.render(); else renderer.render(scene, camera); }, old: () => OLD } });      // (PERF2: the battle loader uses the p39 shader-warm machinery and reports to the black box; lazy, `sw` / `bbox` are built further down)
  const startBattle = (target, loader) => { audio.start && audio.start(); battle.start(target, null, loader); };
  let giftReady = false; const giftQ = [];
  econ.on((st, ev) => {
    if (st.emblem && !(battle && battle.active)) setEmblem(st.emblem);
    if (st.emblem) setShieldCrest(st.emblem);                         // (the realm's crest on every shield of its army: gear_shield.js)
    ui.setProfile({ level: st.level, cups: st.tro || 0 }); ui.setGems(econ.wallet()); ui.setPrem(econ.prem()); world.vaults && world.vaults.setFill(econ.wallet()); upgrade.update(); armyUI.update(); rankUI.update(); assist.update(); shop.update();
    if ((ev === 'load' || (ev && (ev.upgrade || ev.dev))) && world.levels && !(battle && battle.active)) { if (settings.previewLevel) { world.setLevel(settings.previewLevel); setThemeLevel(settings.previewLevel); } else { world.levels.setMany(st.prog.b); const cl = (st.prog.b && st.prog.b.keep) || st.level || 30; setThemeLevel(cl); saveLevelHint(cl); } }
    if (!(battle && battle.active)) { const V = st.vis || st.own || {}; world.tesla && world.tesla.set(V.tesla || 0); world.setDragonlings && world.setDragonlings(!!V.dragonling); world.setCamp && st.emblem && world.setCamp(st.emblem, attackRoster(st.army)); world.setArmyTiers && st.army && st.army.lv && world.setArmyTiers(st.army.lv); }      // (royal Tesla coils on the walls; the camp's colours follow the barracks tier)
    if (ev && ev.collect && ev.n > 0) { audio.coins && audio.coins(); }
    if (ev && (ev.gift || ev.sap || ev.onyx || ev.ruby || ev.emerald)) {
      const showGift = () => {
        if (battle && battle.active) { setTimeout(showGift, 3000); return; }                 // (not in the middle of a fight)
        audio.coins && audio.coins();
        const f = (n) => (n >= 10000 ? (Math.floor(n / 100) / 10).toLocaleString('en-US') + 'K' : n.toLocaleString('en-US'));
        const parts = []; for (const [k, name] of [['ruby', 'ruby'], ['emerald', 'emerald'], ['gift', 'turquoise'], ['sap', 'sapphire'], ['onyx', 'onyx']]) if (ev[k]) parts.push('+' + f(ev[k]) + ' ' + name);
        ui.toast(ev.inv && ev.gift && !ev.sap && !ev.onyx && !ev.conv ? 'A friend joined with your link: +' + f(ev.gift) + ' turquoise!' : parts.join(' · ') + (ev.conv ? ' — arrived from BlueBot!' : ' — a gift from your games!'));
      };
      if (giftReady) setTimeout(showGift, 2600); else giftQ.push(showGift);                  // (the gift is announced when the loading screen and the welcome card are gone, not behind them)
    }
  });
  econ.load().then(function again() { if (!opts.token || econ.loaded || econ.denied) return; ui.toast('Connection lost — retrying…'); setTimeout(() => econ.load().then(again), 8000); });
  const badgeTick = () => { for (const b of world.badges || []) b.sprite.userData.set(econ.ready(b.id), econ.full(b.id)); };
  badgeTick(); setInterval(badgeTick, 1000);
  layout();
  ctl.dist = camera.aspect < 0.8 ? 300 : 240; ctl.target.set(18, 2, 16);
  window.addEventListener('resize', layout);
  try { tg && tg.onEvent && tg.onEvent('viewportChanged', layout); } catch (e) { /* ignore */ }

  const clockNow = () => { const h = hourNow(), c = clockParts(new Date(), pinned()); c.hour = h; c.tod = todWord(h); return c; };
  const clock = () => ui.setClock(clockNow());
  clock(); setInterval(clock, 1000);
  ctl.onFirstTouch = () => { audio.start(); };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3(), sph = new THREE.Sphere();
  const sheets = createSheetUI(root, { econ, ui, audio, upgrade, army: armyUI, afterCollect: () => badgeTick() });       // T1 (bsheet.js)
  const SHEET_MAP = { keep: 'keep', wall: 'wall', gate: 'wall', tower: 'wall', barracks: 'barracks', forge: 'forge', training: 'training', stable: 'stable', workshop: 'workshop', lair: 'lair', archer: 'towers', vault_ruby: 'vault_ruby', vault_emerald: 'vault_emerald', vault_turq: 'vault_turq' };   // (RP1B: shared with the hero mode's door button)
  ctl.onTap = (x, y) => {
    if (ui.settingsOpen) return;
    ndc.set((x / root.clientWidth) * 2 - 1, -(y / root.clientHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null, bd = 1e9;
    for (const c of world.creatures || []) {
      if (c.vis && !c.vis()) continue;
      sph.set(c.center(), c.r);
      if (ray.ray.intersectSphere(sph, hit)) { const d = hit.distanceTo(camera.position); if (d < bd) { bd = d; best = c.id; } }
    }
    for (const p of world.picks) {
      if (ray.ray.intersectBox(p.box, hit)) { const d = hit.distanceTo(camera.position); if (d < bd) { bd = d; best = p.id; } }
    }
    const SM = SHEET_MAP;
    if (best && sheets.tap(best, SM)) return;                  // T1: the building's own sheet (exact id -> SM -> prefix ws: home: civic: mine_ vault_); an id without one keeps the old behaviour below
    sheets.close();
    if (best && SM[best]) { upgrade.focus(SM[best]); return; }
    if (best && best.startsWith('mine_')) {
      const m = best.slice(5);
      ui.showMine(best, () => ({ ready: econ.ready(m), rate: econ.st.mines[m].rate, cap: econ.st.mines[m].cap, room: econ.room(m) }), async () => { const n = await econ.collect(m); badgeTick(); return n; });
    } else if (best) ui.show(best); else ui.hide();
  };

  // ------------------------------------------------ settings -> live changes
  onSetting((k, v) => {
    if (k === 'resScale') resize();
    if (k === 'coolMode') { refl.off = !!v; resize(); GOV.lvl = 0; GOV.active = 0; }
    if (k === 'perfInfo') hud.set(!!v);
    if (k === 'bloom') { if (v && Q.bloom !== false && !composer) { makeComposer(); resize(); if (lateReady && !pathReady.rt) warmOther(); else if (lateReady) warmLoose(true); } if (!v) dropComposer(); }   // PF2: warmOther (bloom switched on: build the night path only when dusk is near)   // PF3: else warmLoose (the chain of a composer that was off)
    if (k === 'shadows') { renderer.shadowMap.enabled = v && Q.shadows !== false; world.setShadows && world.setShadows(v); scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); }
    if (['rotSpeed', 'zoomSpeed', 'invertRotate'].includes(k)) applyCtl();
    if (k === 'previewLevel' && world.setLevel) { world.setLevel(v || econ.st.level); setThemeLevel(v || (econ.st.prog && econ.st.prog.b && econ.st.prog.b.keep) || econ.st.level); }   // owner-only preview of the castle at any level
    if (world.setOption) world.setOption(k, v);
    audio.setVolumes && audio.setVolumes(settings);
  });
  audio.setVolumes && audio.setVolumes(settings);

  // ------------------------------------------------ intro: cinematic welcome card over the held camera, then the fly-in
  if (world.dragon) world.dragon.s = world.dragon.curve.getLength() * 0.5 - 95;
  ctl.startIntro(7.5); ctl.intro.hold = true;
  try { window.speechSynthesis && speechSynthesis.getVoices(); } catch (e) { /* ignore */ }
  // the lord's voice: Chrome drops a speak() issued right after cancel(), and a page may not speak before the first tap, so it tries when the card
  // appears AND again on the tap if the first attempt never started
  let spoke = false;
  const say = (text) => {
    if (!settings.voice || !window.speechSynthesis) return;
    try {
      const ss = window.speechSynthesis; if (spoke || ss.speaking || ss.pending) return;                 // (already on its way: never cut it off and restart it)
      const u = new SpeechSynthesisUtterance(text), vs = ss.getVoices();
      const v = vs.find((x) => /Daniel|UK English Male|en-GB.*Male/i.test(x.name)) || vs.find((x) => /^en-GB/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang));
      if (v) u.voice = v; u.lang = (v && v.lang) || 'en-GB'; u.rate = 0.86; u.pitch = 0.72; u.volume = Math.min(1, (Number.isFinite(+settings.master) ? +settings.master : 0.9) * 1.1);
      u.onstart = () => { spoke = true; };
      ss.resume(); ss.speak(u);                                                                           // (straight from the tap: Chrome only allows speech inside a user gesture)
    } catch (e) { /* no speech on this device */ }
  };
  // Late content (creatures, farm, siege camp, army, defenses) is part of LOADING: it is streamed (prefetched while the world is built),
  // built, every shader compiled (compileAsync — both the plain and the bloom/night render path), every texture / buffer / shadow shader
  // used once (a full warm-up render with culling off), and only then the loading screen goes away. After that nothing is left to build,
  // compile or upload, so the first seconds of play are as smooth as any other.
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const T0 = performance.now(), lateT = {};
  let slowN = 0;
  const sw = createShaderWarm({ renderer, scene, camera, onSlow: (nm, d, np) => { if (slowN++ < 10) { try { bbox.mark('u:' + nm + '×' + np, d); } catch (e) { /* ignore */ } } } });     // (units that took > 150 ms to link: the first ten are named in the black box)
  const mark = (n, t0) => { const d = performance.now() - t0; lateT[n] = d; try { bbox.mark(n, d); } catch (e) { /* ignore */ } if (opts.dev) console.info('[late] ' + n + ' ' + (d | 0) + 'ms'); };
  let lateReady = false;
  // PF2 F1: a light that the late stage adds (the model dragon's belly glow, in the hidden `late:prowler` bucket) was NOT on the mirror's layer until reflect.js re-tagged after 240 ticks, so the mirror pass compiled
  // 29 programs with 5 point lights right after the first draw, and the main view's 6-light programs were not the ones it used.  Every light gets the layer before the first compile now (reflect.js keeps its own re-tag).
  const tagLights = () => scene.traverse((o) => { if (o.isLight && !o.layers.isEnabled(REFL_LAYER)) o.layers.enable(REFL_LAYER); });   // PF2
  const lateSequence = async () => {
    const B0 = 0.72, step = (f, txt) => prog(B0 + (1 - B0) * Math.min(1, f), txt);          // the world build + base precompile own the first 72 % of the bar
    const compileFor = (rt) => { try { renderer.setRenderTarget(rt); return renderer.compileAsync(scene, camera); } finally { renderer.setRenderTarget(null); } };
    const night = () => !!composer && P.night > 0.25;
    const warm = () => {                                                                     // (old loader) draw everything once, wherever the camera is
      const list = []; scene.traverse((o) => { if (o.frustumCulled && (o.isMesh || o.isPoints || o.isLine || o.isSprite)) { o.frustumCulled = false; list.push(o); } });
      try { if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; if (night()) composer.render(); else renderer.render(scene, camera); }
      finally { for (const o of list) o.frustumCulled = true; }
    };
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true; clearTimeout(wd);
      lateReady = true; if (world.setLateBudget) world.setLateBudget(6);
      lateT.ready = performance.now() - T0; if (opts.dev) console.info('[late] built ' + (lateT.built | 0) + 'ms, compiled ' + (lateT.compiled | 0) + 'ms, ready ' + (lateT.ready | 0) + 'ms');
      mark('ready', T0);
      prog(1, 'Ready!'); if (opts.ready) opts.ready(); startWelcome();
      if (!OLD) setTimeout(warmOther, 400);                                                // the other render path is built later, in small slices, while nobody is looking   (PF2: warmOther)
    };
    const wd = setTimeout(() => { console.warn('late: watchdog'); try { while (world.revealLate(8) > 0); } catch (e) { /* ignore */ } finish(); }, opts.lateTimeout || 75000);   // never trap the player on the loading screen
    try {
      if (world.setLateBudget) world.setLateBudget(22);
      const poll = setInterval(() => step(0.45 * world.lateProgress(), 'Waking the realm…'), 150);
      let tm = performance.now();
      try { await world.startLate(); } finally { clearInterval(poll); }
      lateT.built = performance.now() - T0; step(0.45, 'Forging shaders…'); mark('late-built', tm);
      tagLights();   // PF2: F1 (before the first compile of the late stage)
      if (OLD) {
        // compile the path that is on screen right now first (screen by day, the bloom target at night)
        try { await compileFor(night() ? composer.readBuffer : null); } catch (e) { /* the first draw will compile instead */ }
        step(0.6, 'Forging shaders…');
        // browsers without KHR_parallel_shader_compile link lazily on first use: pay that now, a few programs per frame
        { const list = renderer.info.programs || []; let i = 0; while (i < list.length) { const t1 = performance.now(); do { try { list[i++].getUniforms(); } catch (e) { /* ignore */ } } while (i < list.length && performance.now() - t1 < 12); step(0.6 + 0.15 * i / list.length, 'Forging shaders…'); await nextFrame(); } }
        lateT.compiled = performance.now() - T0;
        const total = Math.max(1, world.revealLate(0)); let left = total;
        while ((left = world.revealLate(1)) > 0) { step(0.75 + 0.13 * (1 - left / total), 'Placing the garrison…'); await nextFrame(); }
        for (let i = 0; i < 3; i++) await nextFrame();                                       // the shadow pass meets the last bucket's depth shaders
        step(0.9, 'Warming up…'); await nextFrame(); warm(); await nextFrame();
        if (composer) { try { await compileFor(night() ? null : composer.readBuffer); } catch (e) { /* ignore */ } step(0.96, 'Warming up…'); await nextFrame();
          // the other render path once (dusk / dawn switch to it later): its targets and bloom chain are created now, not mid-game
          if (night()) renderer.render(scene, camera); else composer.render(); await nextFrame(); }
        for (let i = 0; i < 2; i++) await nextFrame();
      } else {
        // p39: the same work, in small slices (shaderwarm.js): one material unit at a time with a sync point after it, a yield to the browser between slices
        tm = performance.now();
        const on = useComposer() ? 'rt' : 'screen';
        await sw.compile(() => (on === 'rt' ? (composer ? composer.readBuffer : undefined) : null), { path: on, progress: (f) => step(0.45 + 0.30 * f, 'Forging shaders…') });
        pathReady[on] = true; lateT.compiled = performance.now() - T0; mark('late-compile', tm);
        // PF3: three things the scene walk cannot see, each one a compile INSIDE a frame before: the PMREM sky scene's night-only dome (first built at dusk), the bloom chain's full-screen materials (night boot), the depth programs
        try { if (world.envScene) await sw.compile(() => sw.looseRT(), { path: 'env', root: world.envScene, lightsFrom: world.envScene, target: 60 }); } catch (e) { /* ignore */ }   // PF3
        try { if (useComposer()) await warmLoose(); } catch (e) { /* ignore */ }   // PF3
        tm = performance.now();
        const total = Math.max(1, world.revealLate(0)); let left = total;
        while ((left = world.revealLate(1)) > 0) { step(0.75 + 0.13 * (1 - left / total), 'Placing the garrison…'); await nextFrame(); }
        for (let i = 0; i < 3; i++) await nextFrame();                                       // the shadow pass meets the last bucket's depth shaders
        mark('reveal', tm); tm = performance.now();
        // first draw of everything that is off screen, a chunk at a time (buffers, textures, pipelines) — never one giant frame
        const renderOnce = () => { if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; if (useComposer()) composer.render(); else renderer.render(scene, camera); };
        const nw = await sw.warmDraw(renderOnce, { progress: (f) => step(0.88 + 0.10 * f, 'Warming up…') });
        mark('warm-draw', tm); lateT.warmN = nw;
        tm = performance.now(); try { await sw.warmShadow({ rt: () => (useComposer() && composer ? composer.readBuffer : null), progress: (f) => step(0.98 + 0.01 * f, 'Warming up…') }); } catch (e) { /* ignore */ } mark('warm-shadow', tm);   // PF3: the depth (shadow) programs of every caster variant, sliced, behind the card
        for (let i = 0; i < 2; i++) await nextFrame();
      }
    } catch (e) { console.warn('late', e); try { while (world.revealLate(8) > 0); } catch (e2) { /* ignore */ } }
    finish();
  };
  // p39: the render path that is NOT in use (the bloom composer by day, the plain screen path at night) is compiled later, at idle, a few programs per slice;
  // `useComposer` does not switch to a path before it is ready.  (Before: all of it ran at load = a second 10+ s stall.)
  let bgRunning = false;
  const bgOk = () => !document.hidden && !(battle && battle.active) && !!composer && !composerParked && (P.night > 0.15 || (!ctl.intro && performance.now() - lastInput > 3000));      // (PERF2: not while the intro / welcome card plays, not within 3 s of a touch)
  // PF3: the bloom chain (high-pass, 5 blurs, composite, blend, output) lives in no scene, so no scene walk compiled it: the first night frame did, 8-9 programs in one task.  Sliced here; also again whenever the
  // composer is rebuilt (an attack parks it, dispose() releases those programs).  Never two at once.
  let looseP = null;
  const warmLoose = (idle) => {
    if (OLD || !composer) return Promise.resolve(0); if (looseP) return looseP;
    const c = composer, list = sw.passLoose(c).map((e) => ({ ...e, skip: () => composer !== c }));
    return (looseP = sw.compileLoose(list, idle ? { gap: 30, duty: 0.25, canRun: () => composer !== c || bgOk() } : {}).catch(() => 0).then((n) => { looseP = null; return n; }));
  };
  async function bgCompile() {
    if (OLD || bgRunning || !composer) return; bgRunning = true;
    const key = useComposer() ? 'screen' : 'rt', t0 = performance.now();
    try {
      if (!pathReady[key]) {
        await sw.compile(() => (key === 'rt' ? (composer ? composer.readBuffer : undefined) : null), { path: key, target: 60, gap: 30, duty: 0.25, maxNew: 1, k0: 1, canRun: bgOk });      // (PERF2: after a slice of d ms wait 3 d: the main thread is busy at most a quarter of the time; a slice links one unit's programs, never more)
        if (key === 'rt') { await warmLoose(true); while (!bgOk()) await new Promise((r) => setTimeout(r, 400)); try { composer.render(); renderer.render(scene, camera); } catch (e) { /* ignore */ } }   // (its targets + the bloom chain once, now; the last draw is the one that is shown)   (PF3: warmLoose first: the chain's programs are made in slices, the draw below meets none)
        pathReady[key] = true; mark('bg-' + key, t0);
      }
    } catch (e) { console.warn('bgCompile', e); }
    bgRunning = false;
  }
  // PF2 F2: the night path (bloom composer: +82..90 programs) is not built by day until dusk is near (perf.js nightPathWanted: ≈ 4 real minutes before night > 0.25); the plain path, when the session starts at night, is still built at once
  const warmOther = () => { if (OLD || bgRunning || !composer || pathReady.rt && pathReady.screen) return; if (useComposer() || EAGER || nightPathWanted(hourNow())) bgCompile(); };   // PF2   (PF3: EAGER = the owner / dev build builds the other path at idle right after the start: nothing is compiled while he plays or measures)
  const EAGER = !!(opts.owner || opts.dev || opts.rpg) && !/[?&]eager=0/.test(location.search);   // PF3: (?eager=0 = off, for the A/B in the rig)
  const startWelcome = async () => {
    ui.root.classList.add('wel');                                                            // (the HUD stays hidden while the report loads)
    let raids = [];
    try { raids = (await socialUI.raids()) || []; } catch (e) { raids = []; }
    const lost = raids.some((r) => r.stars > 0 || (r.tro || 0) < 0), line = !raids.length ? 'Welcome, my lord.' : lost ? 'My lord. While you were away, your castle was attacked.' : 'My lord. Your walls held against an attack.';
    spoke = false; const vt = setTimeout(() => say(line), 1200);                          // (works where the page may already speak)
    const tapped = await ui.showWelcome(clockNow(), { auto: opts.welcomeAuto ?? 9, raids });
    clearTimeout(vt);
    if (tapped) say(line);
    if (raids.length) socialUI.markSeen();
    if (ctl.intro) ctl.intro.hold = false;
    giftReady = true; for (const f of giftQ.splice(0)) setTimeout(f, 900);
  };

  // ------------------------------------------------ loop
  let last = performance.now(), t = 0, frames = 0, running = true, raf = 0, lastDraw = 0, rafPrev = 0;
  // p37 (owner 6 Oct 12:09, old N6 "the picture suddenly goes snowy and the light jumps"): a resize re-allocates the canvas' drawing buffer, and the old code did it at the END of a frame that had
  // already been drawn — so the browser showed the EMPTY (on a phone: garbage / "snow") buffer for one frame.  Now the resize is only ever asked for here and done at the START of the next
  // frame, right before it is drawn.  (dev: window.__bwLegacyResize = true brings the old order back, for the before / after measurement)
  let pendingResize = false, composerParked = false;
  let legacyAtEnd = false;
  const wantResize = () => { if (opts.dev && window.__bwLegacyResize) legacyAtEnd = true; else pendingResize = true; };
  // a GPU that lost its context (memory pressure on a phone) comes back with empty buffers: three.js rebuilds its own state, we re-allocate the render targets and the shadow map before the next draw
  let ctxLost = 0;
  let restoreGpu = false;
  renderer.domElement.addEventListener('webglcontextrestored', () => { ctxLost++; pendingResize = true; restoreGpu = true; if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }, false);
  let wasBreathing = false, lastShake = 0; const dyn = { acc: 0, n: 0, bad: 0, good: 0, skip: 0, rmin: 99, slow: false, noRaise: 0 };
  // heat: never draw faster than the chosen rate (a 120 Hz phone would otherwise render 120 fps and cook), and watching the kingdom without
  // touching it for a while drops to 30 fps. Any touch brings the full rate back on the next frame.
  let lastInput = performance.now(); const poke = () => { lastInput = performance.now(); };
  // heat (p22): a panel / the hub covering the map -> ~16 fps behind it; 3.5 s without a touch -> 30 fps (was 12 s). Checked twice a second, not per frame.
  const PANELS = '.bwa.on,.bws.on,.bwu.on,.bwk.on,.bwh.on,.bw-set.on'; let panelUp = false, panelChk = 0;
  for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown']) window.addEventListener(ev, poke, { passive: true, capture: true });
  const bbox = createPerf({ renderer, tier: Q.level, token: () => econ.token });
  for (const [n, d] of early) bbox.mark(n, d);
  const gpu = createGpuTimer(renderer.getContext());
  const hud = createPerfHud({ root, renderer, info: renderer.info, gpu });
  if (cool()) refl.off = true;
  if (settings.perfInfo) hud.set(true);
  const PFH = { make: null };                                       // PF1: (set below: the owner's hero loader, for the benchmark's hero walk)
  createProbe({ renderer, scene, camera, ctl, world, Q, DYN, GOV, ui, PFH, MSKIP, CAP, owner: !!(opts.owner || opts.dev || opts.rpg), token: () => econ.token, getHero: () => hero, getBattle: () => battle, getComposer: () => composer, getBloom: () => bloom, setHour: (h) => { hourF = h; }, nightPath: () => ({ rt: pathReady.rt, scr: pathReady.screen, comp: !!composer, used: useComposer() }), warmNight: () => warmOther() });     // PF1: null for a player   // PF2: the bench's hour / night-path hooks
  // RP1 — owner-only hero mode (the code is a separate module, fetched when the button is tapped: a normal player never downloads it)
  let hero = null;
  if (opts.owner || opts.rpg) {
    const hb = document.createElement('button'); hb.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l4.6 4.2L12 5.5l3.9 7.2 4.6-4.2-1.8 10H5.3z"/><path d="M5.8 21h12.4"/></svg>'; hb.className = 'rp-open';
    hb.style.cssText = 'position:absolute;z-index:6;left:10px;top:' + (opts.rpgTop || 'calc(env(safe-area-inset-top,0px) + 150px)') + ';width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.25);color:#e6ecf2';
    const heroWarm = async (progress) => { try { if (OLD || !composer || pathReady.screen) return 0; const t0 = performance.now(); await sw.compile(null, { path: 'screen', progress, target: 60 }); pathReady.screen = true; mark('hero-screen', t0); return 1; } catch (e) { return 0; } };   // RP1C-R3: PF1 F9 — booted at night, the plain (screen) path is built only at idle; hero mode on a phone switches the bloom off = draws that path: build it (sliced, behind the loading card) before the first hero frame
    // PF3: AFTER enter(): what the first hero frames would otherwise compile / build inside a frame — the portal door (made by enter), the ground tufts (made when the camera comes down), the hero's own depth (shadow) programs.
    // One synchronous batch behind the loading card (k0 24 = the whole list in the first slice, before the first hero frame); the other render path gets the same units at idle when it is built.
    const heroAfter = async (progress) => { try { if (OLD) return 0; const t0 = performance.now(), on = useComposer() ? 'rt' : 'screen', rtf = () => (on === 'rt' ? (composer ? composer.readBuffer : undefined) : null);
      try { if (world.ground && world.ground.warm) world.ground.warm(); } catch (e) { /* ignore */ }
      await sw.compile(rtf, { path: on, k0: 24, target: 400, progress: (f) => progress && progress(0.5 * f) });
      const n = await sw.warmShadow({ rt: rtf, k0: 24, target: 400, progress: (f) => progress && progress(0.5 + 0.5 * f) });
      if (pathReady.rt && pathReady.screen && !bgRunning) { bgRunning = true; const o = on === 'rt' ? 'screen' : 'rt'; sw.compile(() => (o === 'rt' ? (composer ? composer.readBuffer : undefined) : null), { path: o, target: 60, gap: 30, duty: 0.25, maxNew: 1, k0: 1, canRun: bgOk }).catch(() => 0).then(() => { bgRunning = false; }); }
      mark('hero-after', t0); return n + 1; } catch (e) { return 0; } };
    const mkHero = async (q) => { hero = (await import(/* @vite-ignore */ new URL(heroKit.base + 'rpg/rpg.js' + (q || heroKit.v), document.baseURI).href)).create({ THREE, renderer, scene, camera, root, ctl, world, L, buildNav, bridgesFromLayout, staticSolids, createLoadView, base: new URL(heroKit.base, document.baseURI).href, v: heroKit.v, parseGLB: heroKit.parse, reach: REACH, warm: heroWarm, warmAfter: heroAfter, resize: wantResize, sheets, SM: SHEET_MAP, dev: !!opts.dev }); if (opts.dev) window.__rp = hero.dev; return hero; };   // RP1C-R3: warm: heroWarm   // PF3: warmAfter: heroAfter
    PFH.make = async () => hero || mkHero();                        // PF1
    hb.onclick = async () => { if (hero) return hero.openPick(); hb.disabled = true; try { (await mkHero()).openPick(); } catch (e) { console.warn('hero', e); } hb.disabled = false; };
    if (opts.dev) window.__rpLoad = async (q) => { if (hero) { hero.exit(); hero.closePick(); } return mkHero(q); };
    root.appendChild(hb); setInterval(() => { hb.style.display = (hero && hero.active) || (battle && battle.active) || root.classList.contains('wel') ? 'none' : ''; }, 400);
  }
  // TR2-S5: the editor («Arrange») + where the layout is kept (server / this browser)
  const layoutSync = createLayoutSync(econ, { onServer: (j) => { if (j && j.ok && j.changed) { world.layout.load(j.layout || { v: 1, m: {} }); if (j.dropped && j.dropped.length) ui.toast('Some buildings were put back where they fit'); } } });      // (the server's effective record is what the game shows; sync 'changed' = it is not what we sent)
  const layoutUI = createLayoutUI({ root, world, camera, renderer, ctl, scene, blocked: () => !!((battle && battle.active) || (hero && hero.active) || root.classList.contains('wel') || ui.settingsOpen || panelUp), save: (rec) => layoutSync.save(rec), toast: (m) => ui.toast(m) });
  econ.on((st, ev) => { if (ev === 'load' && !(battle && battle.active)) layoutSync.load().then((rec) => { if (rec && !layoutUI.active) world.layout.load(rec); }).catch((e) => console.warn('layout', e)); });
  let coachBat = false, hdt = 0;
  let badgesHid = false;                                                                   // UI1_R4: the mines' «+43K» gem pills (3D sprites) are hidden while the hero is out
  const perf = { acc: 0, n: 0, checked: 0 }, fpsm = { n: 0, t: 0, max: 0 };
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (!running) return;
    if (rafPrev) { const d = now - rafPrev; if (d > 3 && d < dyn.rmin) dyn.rmin = d; } rafPrev = now;       // display refresh interval (smallest gap seen)
    const inBattle = !!(battle && battle.active), inHero = !!(hero && hero.active), uw = inHero && hero.scene !== scene;
    DYN.hero = inHero && !PFOFF;   // PF1
    if (inHero !== badgesHid) { badgesHid = inHero; for (const b of world.badges || []) b.sprite.visible = !inHero && !inBattle; }   // UI1_R4: in hero mode a ruby «+43K» pill (the gem badge above a mine, 12 x 6 m, 37 m up) hung in the sky in the middle of the view, straight above the hero, and never went away: a kingdom-map sign, not for the hero
    // p37: an attack is drawn by day, straight to the screen: the bloom composer (a half-float multisampled target + the blur chain = the biggest idle block of GPU memory) is parked for its duration and
    // built again when the home map is back — one more thing less to run out of on a phone that is short of GPU memory (a lost context was the one way the picture could go half as bright / the ground black)
    if (inBattle && composer && !composerParked && P && P.night <= 0.25) { composerParked = true; dropComposer(); }
    else if (!inBattle && composerParked) { composerParked = false; if (Q.bloom && settings.bloom) { makeComposer(); if (lateReady) warmLoose(true); } }   // PF3: warmLoose: the new composer's chain is compiled at idle, not by the first night frame
    const slow = settings.fps === 30 || cool() || (!inBattle && (!!(ctl.intro && ctl.intro.hold) || (settings.idleEco && !ctl.intro && !inHero && ctl.ptrs.size === 0 && now - lastInput > 3500)));   // (the held scene behind the welcome card: 30 fps is plenty)
    bbox.phase(inBattle ? (battle.loading ? 'battle:load' : 'battle') : (ctl.intro ? 'home:intro' : 'home')); bbox.frame(now);
    if (now - panelChk > 450) { panelChk = now; panelUp = !inBattle && !!root.querySelector(PANELS); }
    const gapMs = panelUp ? 60 : slow ? 29 : CAP.gap(); if (now - lastDraw < gapMs) return;   // PF1: the cap is adaptive (perf.js createCap) ~60-90 fps / ~45 / 30 when idle: 120 Hz -> every 2nd vsync = 60; 90 Hz keeps every frame
    const gapReal = now - lastDraw, w0 = performance.now(); lastDraw = now;   // PF1: the REAL interval and the JS time of this frame feed the cap
    if (pendingResize) { pendingResize = false; resize(); }
    if (restoreGpu) { restoreGpu = false; try { world.restoreGpu && world.restoreGpu(); } catch (e) { console.warn('restoreGpu', e); } }
    fpsm.max = Math.max(fpsm.max, now - last);
    const dt = Math.min(panelUp ? 0.1 : 0.05, (now - last) / 1000); last = now; t += dt;
    if (inBattle) { ctl.shake = 0; P = sample(battle.hour); if (!battle.loading && !coachBat && !coach.running() && !coach.seen('battle') && coach.isNew()) { coachBat = true; setTimeout(() => { if (!(battle.active && !battle.loading && !(battle.session && (battle.session.started || battle.session.over || battle.session.confirming)) && coach.battle())) coachBat = false; }, 1400); } } else {
      ctl.shake = settings.shake ? (world.shake.out || 0) : 0;
      if (!inHero) ctl.update(dt);
      P = sample(hourNow());
      P.fogD *= Math.min(1, Math.max(0.6, 400 / Math.max(1, ctl.dist))) * REACH.fog;     // p38: far out the haze must not swallow the (bigger) valley  (RP1B: REACH.fog = 1 except in hero mode)
    }
    if (opts.dev && window.__bw && window.__bw.ov) Object.assign(P, window.__bw.ov);                     // (dev only: live tuning of the time-of-day numbers)
    if (!inBattle && world.key && world.key.shadow && world.key.castShadow) {        // home: the sun's shadow box (±110 m) follows the view in 20 m steps, so the stable, the pasture, the camp get shadows too (re-drawn only when it steps)
      const kk = world.key, sx = Math.round(ctl.target.x / 20) * 20, sz = Math.round(ctl.target.z / 20) * 20;
      if (kk.target.position.x !== sx || kk.target.position.z !== sz) { kk.target.position.set(sx, 0, sz); kk.target.updateMatrixWorld(); if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }
    }
    pb(); pe('main:pre');
    world.setTime(P, Date.now());
    renderer.toneMappingExposure = P.exposure * (world.exposureMul ? world.exposureMul(inBattle) : 1);
    if (bloom) bloom.strength = P.bloom;
    pe('main:time'); hdt += dt; if (!uw && (!inHero || REACH.upd < 2 || frames % REACH.upd === 0)) { world.update(t, inHero ? Math.min(hdt, 0.1) : dt, camera); hdt = 0; } else if (!inHero || uw) hdt = 0; pb();      // (RP1B: in hero mode the world may update every 2nd drawn frame, with the time it missed)
    if (world.layout && world.layout.pending) world.layout.tick();      // TR2-S5: one stage of "show the moved things" per frame
    layoutUI.update(dt);      // TR2-S5
    scene.matrixWorldAutoUpdate = !(inHero && !uw && REACH.mtx && REACH.upd > 1 && frames % REACH.upd !== 0);       // RP1C: hero mode: between two world updates only the hero's own nodes get new matrices (cull.js era()); the world's nodes only move inside world.update
    if (inBattle) battle.frame(now, dt);
    if (inHero) hero.frame(now, dt);
    pe('battle');                                                           // (the attack plays on this very map: sim, camera, units, destruction)
    // shadows: refresh every 3rd drawn frame (every 2nd on ultra): the sun/moon move slowly and it is the biggest steady GPU cost
    if (renderer.shadowMap.enabled) { renderer.shadowMap.autoUpdate = false; if (frames % (cool() ? 6 : (Q.level === 'ultra' ? (slow && !inBattle ? 3 : 2) : (slow || panelUp) && !inBattle ? 5 : 3) + (slow || panelUp ? 0 : GOV.lvl + CAP.lvl) + REACH.sh) === 0) renderer.shadowMap.needsUpdate = true; }   // PF1: shadows are the first thing a struggling frame gives up (+1 per cap step)
    // behind the loading screen nobody sees the frames: draw a third of them (the explicit warm-up renders still draw everything)
    if (!(inBattle && battle.loading) && (lateReady || frames % 3 === 0)) { if (hud.on) gpu.begin(renderer.shadowMap.needsUpdate ? 's' : 'p'); pb(); if (uw) renderer.render(hero.scene, camera); else { refl.update(dt, { battle: inBattle || REACH.norefl }); pe('refl'); if (useComposer()) composer.render(); else renderer.render(scene, camera); } if (opts.dev && window.__bwLumOn) lumSample(); pe('render(submit)'); if (hud.on) gpu.end(); }
    CAP.frame(gapReal, performance.now() - w0, dyn.rmin < 90 ? dyn.rmin : 0, now, slow || panelUp || !!ctl.intro || document.hidden || !!(inBattle && battle.loading));   // PF1: adaptive cap (perf.js)
    // dynamic resolution: keep up with the frame cap (60, or 30 when slow). A resize re-allocates the render targets (a hitch of its own), so:
    // change only after two bad windows in a row, in steps of 0.1, ignore the window that contains the resize, and after a drop stay down for a minute.
    dyn.acc += dt; dyn.n++;
    const dk = (panelUp ? 2 : slow ? 1 : 0) + 3 * CAP.lvl;                                                          // (behind a panel the rate is capped on purpose: never judge the GPU there)
    if (dyn.slow !== dk) { dyn.slow = dk; dyn.acc = 0; dyn.n = 0; dyn.bad = 0; dyn.good = 0; }
    if (dyn.acc > 1.5 && !ctl.intro && !panelUp && !(opts.dev && window.__bwFixDyn)) {
      const avg = dyn.acc / dyn.n; dyn.acc = 0; dyn.n = 0;
      const rf = Math.min(34, Math.max(4, dyn.rmin)); dyn.rmin = 99;                                  // ms between display frames
      if (dyn.skip) { dyn.skip = 0; dyn.bad = 0; dyn.good = 0; }
      else {
        const expect = Math.max(gapMs > 25 ? 0.0333 : gapMs > 15 ? 0.0222 : 0.0167, rf * Math.ceil(gapMs / rf) / 1000);   // seconds per drawn frame when the GPU keeps up (never expect better than 60 fps: a 90 Hz screen must not push the quality down)
        let ns = DYN.s;
        if (avg > expect * 1.3) { dyn.good = 0; if ((PFOFF || slow || CAP.lvl > 1) && !CAP.cpuBound && ++dyn.bad >= 2) { ns = Math.max(0.6, DYN.s - (avg > expect * 1.8 ? 0.2 : 0.1)); dyn.bad = 0; dyn.noRaise = now + 60000; } }
        else if (avg < expect * 1.08) { dyn.bad = 0; if (++dyn.good >= 4 && now > dyn.noRaise) { ns = Math.min(1, DYN.s + 0.1); dyn.good = 0; } }
        else { dyn.bad = 0; dyn.good = 0; }
        if (Math.abs(ns - DYN.s) > 0.01) { DYN.s = ns; dyn.skip = 1; wantResize(); }
      }
    }
    if (hud.on) hud.frame(dt, () => { const sz = renderer.getDrawingBufferSize(new THREE.Vector2()); return { dpr: renderer.getPixelRatio(), basedpr: Math.min(window.devicePixelRatio || 1, Q.dpr), dyn: DYN.s, w: sz.x, h: sz.y, preset: Q.level, shadow: renderer.shadowMap.enabled ? '1/' + (cool() ? 6 : (Q.level === 'ultra' ? (slow && !inBattle ? 3 : 2) : (slow || panelUp) && !inBattle ? 5 : 3) + (slow || panelUp ? 0 : GOV.lvl + CAP.lvl) + REACH.sh) : 'off', refl: refl.enabled && !refl.off ? 'on' : 'off', bloom: composer && P.night > 0.25 && !cool() ? 'on' : (composer ? 'idle' : 'off'), cap: slow ? 30 : 60, cool: cool() ? 'on' : 'off', gov: GOV.lvl, mode: inHero ? (uw ? 'hero/under' : 'hero') : inBattle ? 'battle' : 'map', cap: CAP.lvl }; });     // PF1: mode for the readout
    // governor: count full-rate play time; judge the average frame time over 30 s windows
    {
      if (slow || panelUp || document.hidden || CAP.lvl) { GOV.active = Math.max(0, GOV.active - dt * 2); GOV.win = 0; GOV.wn = 0; }   // PF1: a capped frame rate is not 'creep'
      else {
        GOV.active += dt; GOV.win += dt * 1000; GOV.wn++; GOV.since += dt;
        if (GOV.active > 30 * (GOV.steps + 1) && GOV.wn > 200) {                         // a 30 s window of full-rate frames is over
          const avg = GOV.win / GOV.wn; GOV.steps++; GOV.win = 0; GOV.wn = 0;
          if (!GOV.base || GOV.steps <= 4) GOV.base = GOV.base ? Math.min(GOV.base, avg) : avg;       // baseline = the best of the first two minutes
          const creep = GOV.steps > 4 && avg > GOV.base * 1.3 + 1.5, timed = GOV.active > 360 + 240 * GOV.lvl;
          if ((creep || timed) && GOV.lvl < 3 && GOV.since > 60) { GOV.lvl++; GOV.since = 0; refl.every = 3 + 2 * GOV.lvl; wantResize(); }
          else if (!creep && !timed && GOV.lvl > 0 && GOV.since > 180) { GOV.lvl--; GOV.since = 0; refl.every = 3 + 2 * GOV.lvl; wantResize(); }
        }
      }
    }
    if (legacyAtEnd) { legacyAtEnd = false; resize(); }                                   // (dev: the OLD order — the canvas is re-allocated after the frame was drawn)
    if (opts.dev && window.__bwLumOn) lumSample('end');                                  // (dev: what the canvas holds when the frame is handed to the browser)
    pframe(); frames++;
    if (inBattle) { fpsm.n++; fpsm.t += dt; if (fpsm.t >= 1) { ui.setFPS(Math.round(fpsm.n / fpsm.t), Math.round(fpsm.max)); fpsm.n = 0; fpsm.t = 0; fpsm.max = 0; } return; }
    if (PFOFF ? frames === 2 : (lateReady || frames > 1800) && frames % 30 === 2 && !audio.ctx) audio.prepare(P.night > 0.55 ? 'night' : 'day');   // PF1: the ~5.8 MB of sound is fetched AFTER the models (it used to compete with the 14 MB late stage at frame 2); a tap before that still prepares it at once (audio.unlock)
    if (!audio.ctx && world.takeThunder && frames % 30 === 0) world.takeThunder();   // no stale claps on the first tap
    if (lateReady && !pathReady.rt && frames % 120 === 7) warmOther();   // PF2: the day turns towards dusk: the night path is built now, at idle
    if (frames === 4 && world.startLate) { if (opts.nolate) { lateReady = true; prog(1, 'Ready!'); if (opts.ready) opts.ready(); startWelcome(); } else lateSequence(); }   // (nolate: dev pages only)
    fpsm.n++; fpsm.t += dt; if (fpsm.t >= 1) { ui.setFPS(Math.round(fpsm.n / fpsm.t), Math.round(fpsm.max)); fpsm.n = 0; fpsm.t = 0; fpsm.max = 0; }
    // sound tied to world events
    audio.update && audio.update(dt, { P, world, camera });
    if (world.breathing && !wasBreathing && world.dragon) audio.roar(Math.max(0.15, 1 - camera.position.distanceTo(world.dragon.position) / 320));
    wasBreathing = world.breathing;
    if ((world.shake.v || 0) > lastShake + 0.2) audio.thump(Math.max(0.1, world.shake.out * 2));
    lastShake = world.shake.v || 0;
  };
  // p39: BEFORE the first frame: every program of what the world has built so far is linked now, one unit per slice (the first frame used to do all of it in one go)
  if (!OLD) {
    const t0 = performance.now(), on = useComposer() ? 'rt' : 'screen';
    try { await sw.compile(() => (on === 'rt' ? (composer ? composer.readBuffer : undefined) : null), { path: on, progress: (f) => prog(0.62 + 0.10 * f, 'Forging shaders…') }); } catch (e) { console.warn('precompile', e); }
    mark('base-compile', t0);
  }
  raf = requestAnimationFrame(loop);
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden; last = performance.now();
    if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 60000 && opts.token && !(battle && battle.active)) econ.load();     // (back from a long break: the world moved on — builders, mines, raids)
    if (!document.hidden) hiddenAt = 0;
    if (settings.bgMute) audio.pause && audio.pause(document.hidden);
  });
  if (opts.dev) window.__bw = { armyUI, DS, DU, THREE, refl, coach, scene, camera, ctl, world, renderer, ui, Q, settings, audio, econ, get battle() { return battle; }, get lateReady() { return lateReady; }, pathReady, sw, lateT, useComposer, get t() { return t; }, get frames() { return frames; }, pause(v) { running = !v; }, dynTo(v) { DYN.s = v; wantResize(); }, loseCtx(ms = 600) { const x = renderer.getContext().getExtension('WEBGL_lose_context'); if (!x) return false; x.loseContext(); setTimeout(() => x.restoreContext(), ms); return true; }, get ctxLost() { return ctxLost; }, P: () => P, bloom: () => bloom, composer: () => composer, ov: {} };
  if (opts.dev) window.__bw.layoutUI = layoutUI;                                                       // (TR2-S5: the layout editor, for dev/tr2_s5_*.py)
  if (opts.dev) window.__bw.bbox = bbox;                                                                  // (PERF2: the black box, for dev/pf_battle_gate.py)
  return { stop() { cancelAnimationFrame(raf); } };
}

window.BlueWall = { start };
