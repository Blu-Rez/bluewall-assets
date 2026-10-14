// RP4 — combat HUD (DOM, owner-only).  Icons + digits only — NO words, NO Persian text.  Same glass + turquoise look as the hero buttons of rpg.js (.rp-b).
//   create({ root, elements, element, accent, base, onPress(name), kit }) -> hud
//   hud.set(state)  per frame values    hud.digit(x, y, text, color, scale)  floating damage digits (screen px)    hud.marker(x, y, on)  lock ring    hud.target(on, frac, hp, color)  target bar
//   hud.add(name, { svg, size, cx, cy, cb })  an extra round button (dev page: dodge / jump)    hud.moveHost(btns)  re-seat the host's jump / dodge / sprint buttons around the attack button
const TOP = 'max(env(safe-area-inset-top,0px),calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px)))', BOT = 'max(env(safe-area-inset-bottom,0px),calc(var(--tg-safe-area-inset-bottom,0px) + var(--tg-content-safe-area-inset-bottom,0px)))';   // (as rpg.js: below Telegram's fullscreen header)
const CSS = (`
.rp4-b{position:absolute;z-index:42;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#e6ecf2;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.2),inset 0 0 14px rgba(255,255,255,.07),0 3px 10px rgba(0,0,0,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:transform .07s,box-shadow .12s,border-color .12s,opacity .15s}
.rp4-b.dn{transform:scale(.9);border-color:rgba(61,245,224,.95);box-shadow:0 0 18px rgba(61,245,224,.55),inset 0 0 14px rgba(255,255,255,.12)}
.rp4-b svg.ic{width:46%;height:46%;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px rgba(61,245,224,.7));pointer-events:none}
.rp4-b.atk{border-color:var(--ac);box-shadow:0 0 16px var(--ac),inset 0 0 16px rgba(255,255,255,.08),0 3px 10px rgba(0,0,0,.45)}
.rp4-b.atk svg.ic{width:50%;height:50%;filter:drop-shadow(0 0 5px var(--ac))}
.rp4-b.hot{box-shadow:0 0 22px var(--ac),inset 0 0 18px rgba(255,255,255,.22)}
.rp4-b.off{opacity:.42}
.rp4-b svg.rg{position:absolute;inset:-3px;width:calc(100% + 6px);height:calc(100% + 6px);transform:rotate(-90deg);pointer-events:none}
.rp4-b svg.rg circle{fill:none;stroke-width:3}
.rp4-cd{position:absolute;font:700 17px/1 Exo2,system-ui,sans-serif;color:#fff;text-shadow:0 0 6px #000,0 0 3px #000;pointer-events:none}
.rp4-pips{position:absolute;z-index:42;display:flex;gap:5px;pointer-events:none}
.rp4-pips i{width:7px;height:7px;border-radius:50%;background:rgba(205,214,224,.28);border:1px solid rgba(205,214,224,.5);transition:background .08s,box-shadow .08s}
.rp4-pips i.on{background:var(--ac);border-color:#fff;box-shadow:0 0 8px var(--ac)}
.rp4-g{position:absolute;z-index:42;left:64px;top:calc(env(safe-area-inset-top,0px) + 6px);width:62px;height:62px;pointer-events:none}
.rp4-g svg{position:absolute;inset:0;width:100%;height:100%}
.rp4-g img{position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;object-fit:contain;filter:drop-shadow(0 0 4px var(--ac))}
.rp4-g b{position:absolute;left:0;right:0;bottom:-13px;text-align:center;font:700 12px/1 Exo2,system-ui,sans-serif;color:#e6ecf2;text-shadow:0 0 5px #000,0 0 2px #000}
.rp4-t{position:absolute;z-index:42;left:max(140px,calc(50vw - min(44vw,250px) / 2));top:calc(env(safe-area-inset-top,0px) + 14px);width:min(44vw,250px);height:12px;border-radius:7px;border:1.5px solid rgba(205,214,224,.5);background:rgba(14,18,24,.66);box-shadow:0 0 10px rgba(61,245,224,.18);opacity:0;transition:opacity .18s;pointer-events:none;overflow:hidden}
.rp4-t.on{opacity:1}.rp4-t i{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(90deg,var(--ec),#fff 160%);transform-origin:0 50%}
.rp4-t u{position:absolute;left:0;top:0;bottom:0;width:100%;background:rgba(255,255,255,.55);transform-origin:0 50%;text-decoration:none}
.rp4-th{position:absolute;z-index:42;left:max(140px,calc(50vw - min(44vw,250px) / 2));top:calc(env(safe-area-inset-top,0px) + 29px);width:min(44vw,250px);text-align:center;font:700 12px/1 Exo2,system-ui,sans-serif;color:#e6ecf2;text-shadow:0 0 5px #000,0 0 2px #000;opacity:0;transition:opacity .18s;pointer-events:none}
.rp4-th.on{opacity:1}
.rp4-m{position:absolute;z-index:41;left:0;top:0;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:2px solid rgba(61,245,224,.95);box-shadow:0 0 12px rgba(61,245,224,.8),inset 0 0 8px rgba(61,245,224,.4);pointer-events:none;display:none;will-change:transform}
.rp4-m:before,.rp4-m:after{content:"";position:absolute;background:rgba(61,245,224,.95);box-shadow:0 0 6px rgba(61,245,224,.9)}
.rp4-m:before{left:50%;top:-8px;width:2px;height:8px;margin-left:-1px}.rp4-m:after{left:50%;bottom:-8px;width:2px;height:8px;margin-left:-1px}
.rp4-d{position:absolute;z-index:43;left:0;top:0;font:900 22px/1 Exo2,system-ui,sans-serif;color:#fff;text-shadow:0 0 6px rgba(0,0,0,.9),0 2px 3px rgba(0,0,0,.9),-1px 0 0 rgba(0,0,0,.8),1px 0 0 rgba(0,0,0,.8);pointer-events:none;display:none;will-change:transform,opacity;white-space:nowrap}
.rp4-a{position:absolute;z-index:41;left:0;top:0;width:36px;height:36px;margin:-18px 0 0 -18px;pointer-events:none;display:none;will-change:transform,opacity}.rp4-a svg{width:100%;height:100%;fill:#ff3b2f;stroke:#fff;stroke-width:1.4;stroke-linejoin:round;filter:drop-shadow(0 0 7px rgba(255,60,40,.95))}
.rp4-v{position:absolute;inset:0;z-index:40;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 50%,rgba(255,40,40,0) 55%,rgba(255,40,40,.55) 100%)}
`).split('env(safe-area-inset-top,0px)').join(TOP);
const ICON = {
  attack: '<svg class="ic" viewBox="0 0 24 24"><path d="M20 4l-9.6 9.6"/><path d="M20 4h-4.2M20 4v4.2"/><path d="M8.2 11.8l4 4"/><path d="M10 14l-5.5 5.5"/><circle cx="4" cy="20" r="1.1"/></svg>',
  skill1: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 2.5c1 4.4 5.6 5.7 5.6 10.7a5.6 5.6 0 0 1-11.2 0c0-2.2 1.1-3.5 2.2-4.6.2 2 1.1 3 2.2 3.4C11.2 8.8 10.9 5.6 12 2.5z"/></svg>',
  skill2: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2L19 19M19 5l-2.8 2.8M7.8 16.2L5 19"/></svg>',
  lock: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.6"/><circle cx="12" cy="12" r="1.2"/><path d="M12 2.4v4M12 17.6v4M2.4 12h4M17.6 12h4"/></svg>',
  dodge: '<svg class="ic" viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5"/><path d="M19.8 3.6v4.2h-4.2"/><circle cx="12" cy="12" r="1.7"/><path d="M1.5 9.5h3M1 12.5h3.4M1.5 15.5h3"/></svg>',
  jump: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 19V6M6 11l6-6 6 6"/><path d="M7 21h10"/></svg>',
  sprint: '<svg class="ic" viewBox="0 0 24 24"><path d="M13.5 2.5L5.5 13.5h6l-1.2 8 8-11.5h-6z"/></svg>',
};
// centre of each button, in px from the right / bottom edge, and its size (thumb arc around the attack button)
export const LAYOUT = { attack: { size: 88, cx: 64, cy: 86 }, dodge: { size: 60, cx: 160, cy: 52 }, skill1: { size: 54, cx: 160, cy: 128 }, skill2: { size: 54, cx: 120, cy: 192 }, jump: { size: 56, cx: 46, cy: 188 }, sprint: { size: 48, cx: 44, cy: 254 }, lock: { size: 44, left: 12, top: 172 } };

export function create(ctx) {
  const root = ctx.root, doc = root.ownerDocument, els = {}, hold = {}, digits = [], live = [];
  const SB = BOT, SR = 'env(safe-area-inset-right,0px)';
  const ac = ctx.accent || '#ff6a3a', ec = ctx.accent || '#ff6a3a';
  if (!doc.getElementById('rp4-css')) { const s = doc.createElement('style'); s.id = 'rp4-css'; s.textContent = CSS; doc.head.appendChild(s); }
  const wrap = doc.createElement('div'); wrap.style.cssText = '--ac:' + ac + ';position:absolute;inset:0;pointer-events:none;z-index:40'; wrap.className = 'rp4 rp-k'; root.appendChild(wrap);                // (rp-k: the host's hero mode hides every other child of the game root)
  const mk = (tag, cls, html, css) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (css) e.style.cssText = css; return e; };
  const place = (e, L) => { if (L.left != null) { e.style.left = 'calc(env(safe-area-inset-left,0px) + ' + L.left + 'px)'; e.style.top = 'calc(' + TOP + ' + ' + L.top + 'px)'; e.style.right = e.style.bottom = 'auto'; } else { e.style.right = 'calc(' + SR + ' + ' + (L.cx - L.size / 2) + 'px)'; e.style.bottom = 'calc(' + SB + ' + ' + (L.cy - L.size / 2) + 'px)'; e.style.left = e.style.top = 'auto'; } e.style.width = e.style.height = L.size + 'px'; };
  const C = 2 * Math.PI * 25.5;                                               // cooldown ring (r = 25.5 in a 56-box)
  function button(name, L, o = {}) {
    const b = mk('div', 'rp4-b' + (o.cls ? ' ' + o.cls : ''), (o.svg || ICON[name]) + (o.ring ? '<svg class="rg" viewBox="0 0 56 56"><circle cx="28" cy="28" r="25.5" stroke="rgba(255,255,255,.12)"/><circle class="v" cx="28" cy="28" r="25.5" stroke="' + ac + '" stroke-dasharray="' + C.toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="0" stroke-linecap="round"/></svg><span class="rp4-cd"></span>' : ''));
    b.style.pointerEvents = 'auto'; place(b, L); wrap.appendChild(b); els[name] = b; if (o.ring) { b._v = b.querySelector('circle.v'); b._cd = b.querySelector('.rp4-cd'); }
    const down = (e) => { e.preventDefault(); b.classList.add('dn'); if (name === 'attack') hold.attack = 0.33; (o.cb || ctx.onPress)(name, true); try { b.setPointerCapture(e.pointerId); } catch (_) { } };
    const up = () => { b.classList.remove('dn'); if (name === 'attack') hold.attack = 0; (o.cb || ctx.onPress)(name, false); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('contextmenu', (e) => e.preventDefault());
    return b;
  }
  button('attack', LAYOUT.attack, { cls: 'atk' }); button('skill1', LAYOUT.skill1, { ring: true }); button('skill2', LAYOUT.skill2, { ring: true }); button('lock', LAYOUT.lock);
  const pips = mk('div', 'rp4-pips', '<i></i><i></i><i></i><i></i>'); pips.style.right = 'calc(' + SR + ' + ' + (LAYOUT.attack.cx - 17) + 'px)'; pips.style.bottom = 'calc(' + SB + ' + ' + (LAYOUT.attack.cy + LAYOUT.attack.size / 2 + 5) + 'px)'; wrap.appendChild(pips);
  // gauge: HP (outer arc) + stamina (inner arc) around the element emblem, digits under it
  const R1 = 27, R2 = 20, A1 = 2 * Math.PI * R1 * 0.75, A2 = 2 * Math.PI * R2 * 0.75, F1 = 2 * Math.PI * R1, F2 = 2 * Math.PI * R2;
  const g = mk('div', 'rp4-g', '<svg viewBox="0 0 62 62" style="transform:rotate(135deg)"><circle cx="31" cy="31" r="' + R1 + '" fill="rgba(14,18,24,.55)" stroke="rgba(205,214,224,.22)" stroke-width="5" stroke-dasharray="' + A1.toFixed(1) + ' ' + F1.toFixed(1) + '" stroke-linecap="round"/><circle class="hp" cx="31" cy="31" r="' + R1 + '" fill="none" stroke="#3df5e0" stroke-width="5" stroke-dasharray="' + A1.toFixed(1) + ' ' + F1.toFixed(1) + '" stroke-linecap="round"/><circle cx="31" cy="31" r="' + R2 + '" fill="none" stroke="rgba(205,214,224,.2)" stroke-width="3.5" stroke-dasharray="' + A2.toFixed(1) + ' ' + F2.toFixed(1) + '" stroke-linecap="round"/><circle class="st" cx="31" cy="31" r="' + R2 + '" fill="none" stroke="#ffe08a" stroke-width="3.5" stroke-dasharray="' + A2.toFixed(1) + ' ' + F2.toFixed(1) + '" stroke-linecap="round"/></svg><img alt="" src="' + (ctx.emblem || '') + '"><b>0</b>');
  g.style.setProperty('--ac', ac); wrap.appendChild(g); const gHp = g.querySelector('circle.hp'), gSt = g.querySelector('circle.st'), gNum = g.querySelector('b'); if (!ctx.emblem) g.querySelector('img').style.display = 'none';
  const tb = mk('div', 'rp4-t', '<u></u><i></i>'); tb.style.setProperty('--ec', '#ff6a3a'); wrap.appendChild(tb); const tbI = tb.querySelector('i'), tbU = tb.querySelector('u'); const th = mk('div', 'rp4-th', ''); wrap.appendChild(th);
  const alerts = []; for (let i = 0; i < 3; i++) { const a = mk('div', 'rp4-a', '<svg viewBox="0 0 24 24"><path d="M3 4.5L21 12 3 19.5 7.5 12z"/></svg>'); wrap.appendChild(a); alerts.push(a); }
  const mkr = mk('div', 'rp4-m'); wrap.appendChild(mkr); const vig = mk('div', 'rp4-v'); wrap.appendChild(vig);
  for (let i = 0; i < 14; i++) { const d = mk('div', 'rp4-d'); wrap.appendChild(d); digits.push({ e: d, on: false, t: 0, x: 0, y: 0, s: 1, life: 0.8, vx: 0 }); }
  let ghost = 1, lastHp = -1, lastSt = -1, vigT = 0, tbHold = 0, tbOn = false, tFrac = 1;

  const hud = {
    el: wrap, els, LAYOUT,
    add(name, L, svg, cb) { return button(name, L, { svg, cb }); },
    moveHost(btns) {                                                         // the host's own buttons: same ring of thumb positions (restored by dispose)
      for (const n of ['dodge', 'jump', 'sprint']) { const b = btns && btns[n]; if (!b) continue; if (!b.__rp4) b.__rp4 = b.style.cssText; place(b, LAYOUT[n]); }
      hud._host = btns;
    },
    /** values (every frame): hp, hpMax, st, stMax, cd[2], cdMax[2], n (combo index -1..3), lock (bool), hot (bool: hit landed) */
    set(s, dt) {
      const hpf = s.hpMax > 0 ? Math.max(0, Math.min(1, s.hp / s.hpMax)) : 0, stf = Math.max(0, Math.min(1, s.st / s.stMax));
      if (hpf !== lastHp) { gHp.style.strokeDasharray = (A1 * hpf).toFixed(1) + ' ' + F1.toFixed(1); gHp.setAttribute('stroke', hpf < 0.3 ? '#ff5a4a' : '#3df5e0'); gNum.textContent = Math.ceil(s.hp); lastHp = hpf; }
      if (stf !== lastSt) { gSt.style.strokeDasharray = (A2 * stf).toFixed(1) + ' ' + F2.toFixed(1); lastSt = stf; }
      for (let i = 0; i < 2; i++) { const b = els['skill' + (i + 1)], cd = s.cd[i], f = cd > 0 ? cd / s.cdMax[i] : 0; b._v.style.strokeDashoffset = (C * f).toFixed(1); b.classList.toggle('off', cd > 0); const cs = cd > 0 ? String(Math.ceil(cd)) : ''; if (b._cs !== cs) { b._cs = cs; b._cd.textContent = cs; } }
      const ps = pips.children; for (let i = 0; i < 4; i++) { const on = i <= s.n; if (ps[i]._on !== on) { ps[i]._on = on; ps[i].classList.toggle('on', on); } }
      els.lock.style.borderColor = s.lock ? 'rgba(61,245,224,.95)' : ''; els.lock.style.boxShadow = s.lock ? '0 0 16px rgba(61,245,224,.7),inset 0 0 12px rgba(61,245,224,.25)' : '';
      if (hold.attack > 0) { hold.attack -= dt; if (hold.attack <= 0) { hold.attack = 0.33; ctx.onPress('attack', true); } }
      if (vigT > 0) { vigT -= dt; vig.style.opacity = Math.max(0, vigT / 0.35).toFixed(2); }
      if (tbHold > 0) { tbHold -= dt; if (tbHold <= 0 && tbOn) { tbOn = false; tb.classList.remove('on'); th.classList.remove('on'); } }
      if (ghost > tFrac) { ghost = Math.max(tFrac, ghost - dt * 0.9); tbU.style.transform = 'scaleX(' + ghost.toFixed(3) + ')'; }
    },
    alert(i, x, y, rot, a) { const e = alerts[i]; if (!e._on) { e._on = true; e.style.display = 'block'; } e.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(3) + 'rad)'; e.style.opacity = a.toFixed(2); },
    alertsEnd(n) { for (let i = n; i < alerts.length; i++) if (alerts[i]._on) { alerts[i]._on = false; alerts[i].style.display = 'none'; } },
    hot(on) { els.attack.classList.toggle('hot', !!on); },
    hurt() { vigT = 0.35; vig.style.opacity = '0.9'; },
    /** target bar: shown while a target is locked / just hit */
    target(frac, hp, color, holdFor) {
      tFrac = Math.max(0, Math.min(1, frac)); tb.style.setProperty('--ec', color || '#ff6a3a'); tbI.style.transform = 'scaleX(' + tFrac.toFixed(3) + ')'; if (ghost < tFrac) { ghost = tFrac; tbU.style.transform = 'scaleX(' + ghost.toFixed(3) + ')'; }
      th.textContent = Math.max(0, Math.ceil(hp)); tbHold = holdFor == null ? 2.4 : holdFor; if (!tbOn) { tbOn = true; tb.classList.add('on'); th.classList.add('on'); }
    },
    targetOff() { tbHold = 0.001; },
    marker(x, y, on) { if (!on) { if (mkr._on) { mkr._on = false; mkr.style.display = 'none'; } return; } if (!mkr._on) { mkr._on = true; mkr.style.display = 'block'; } mkr.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; },
    digit(x, y, text, color, scale, vx) { let d = null; for (const q of digits) if (!q.on) { d = q; break; } if (!d) { d = digits.reduce((a, b) => (a.t > b.t ? a : b)); } d.on = true; d.t = 0; d.x = x; d.y = y; d.s = scale || 1; d.vx = vx || 0; d.life = 0.85; d.e.textContent = text; d.e.style.color = color || '#fff'; d.e.style.fontSize = Math.round(22 * (scale || 1)) + 'px'; d.e.style.display = 'block'; },
    /** per frame: float the digits (call with the CURRENT screen position of where they were spawned — they carry their own offsets) */
    digits(dt) { for (const d of digits) { if (!d.on) continue; d.t += dt; const k = d.t / d.life; if (k >= 1) { d.on = false; d.e.style.display = 'none'; continue; } const rise = 62 * (1 - Math.pow(1 - k, 2)), pop = k < 0.12 ? 0.6 + (k / 0.12) * 0.7 : 1.3 - Math.min(0.3, (k - 0.12) * 0.8); d.e.style.transform = 'translate3d(' + (d.x + d.vx * k - 14).toFixed(1) + 'px,' + (d.y - rise - 12).toFixed(1) + 'px,0) scale(' + pop.toFixed(2) + ')'; d.e.style.opacity = (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4).toFixed(2); } },
    setVisible(v) { wrap.style.display = v ? '' : 'none'; if (hud._host) for (const n in hud._host) { const b = hud._host[n]; if (b && b.__rp4 != null && !v) b.style.cssText = b.__rp4; } },
    dispose() { if (hud._host) for (const n in hud._host) { const b = hud._host[n]; if (b && b.__rp4 != null) { b.style.cssText = b.__rp4; b.__rp4 = null; } } wrap.remove(); },
  };
  return hud;
}
