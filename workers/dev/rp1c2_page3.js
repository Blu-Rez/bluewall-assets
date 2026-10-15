// rp1c2_page3.js — RP1C-R2 Job 2 in the real game: while a building sheet (.bsh.on) is open the joystick + every action button are hidden / untouchable, and they come back when it closes.
//   Opened three ways: the round door button (useNear), the door orb tap + auto-walk, and a sheet opened by something else (the DOM class alone: no S.sheetOn — the `.bsh.on` rule).  Returns JSON.
(async () => {
  const rp = window.__rp, S = rp.S, out = { sc: {}, fail: [] }, wait = (ms) => new Promise((r) => setTimeout(r, ms)), cs = (e) => getComputedStyle(e);
  const D = rp.doors(), it = D.items().find((i) => i.id === 'home:cottage_10') || D.items()[0], yw = Math.atan2(it.fx - it.gx, it.fz - it.gz);
  const hud = () => {
    const t = document.querySelector('.rp-touch'), j = document.querySelector('.rp-joy'), bs = [...document.querySelectorAll('.rp-b, .rp4-b')];
    return { touch: cs(t).display, joy: cs(j).display, nBtn: bs.length, hiddenBtn: bs.filter((b) => cs(b).visibility === 'hidden' && cs(b).pointerEvents === 'none').length, shownBtn: bs.filter((b) => cs(b).visibility !== 'hidden' && cs(b).display !== 'none').length, sheet: !!document.querySelector('.bsh.on'), bshVis: !!document.querySelector('.bsh.on') && cs(document.querySelector('.bsh.on')).visibility, rpSheetRoot: document.querySelector('.rp-on').classList.contains('rp-sheet'), sheetOn: S.sheetOn };
  };
  const untilClosed = async () => { for (let i = 0; i < 80 && (S.sheetOn || document.querySelector('.bsh.on')); i++) await wait(250); await wait(400); };
  const close = async () => { const x = document.querySelector('.bsh.on .bsh-x'); if (x) x.click(); await untilClosed(); };
  rp.pause(false); await close();
  // 0. nothing open: the pad and the buttons are there (the 'act' button is display:none unless a door is near)
  rp.setPos(it.gx - Math.sin(yw) * 13, it.gz - Math.cos(yw) * 13, yw); await wait(1500);
  out.sc.closed = hud(); if (out.sc.closed.touch === 'none' || out.sc.closed.shownBtn < 3) out.fail.push('closed: pad / buttons are missing');
  // 1. the round door button
  rp.goNear(it.id, 1.5); await wait(1200); const n = rp.tickNear(); out.near = n && n.id; rp.useNear(); await wait(1200);
  out.sc.openByButton = hud(); const o1 = out.sc.openByButton; if (!(o1.sheet && o1.touch === 'none' && o1.joy === 'none' && o1.shownBtn === 0 && o1.hiddenBtn === o1.nBtn)) out.fail.push('button-opened sheet: pad / buttons not hidden');
  await close(); out.sc.closedAgain = hud(); const c1 = out.sc.closedAgain; if (!(c1.touch !== 'none' && c1.shownBtn >= 3 && !c1.rpSheetRoot)) out.fail.push('after close: pad / buttons not restored');
  // 2. tap on the orb from 13 m -> auto-walk -> the sheet opens on arrival
  rp.setPos(it.gx - Math.sin(yw) * 13, it.gz - Math.cos(yw) * 13, yw); rp.setLook(yw, 0.25); await wait(3000);
  const [sx, sy] = rp.proj(it.x, it.y, it.z), ok = rp.tapDoor(sx, sy); let tw = 0; while (!S.sheetOn && tw < 40000 && rp.autoState()) { await wait(250); tw += 250; } await wait(1000);
  out.sc.openByWalk = { ...hud(), tapped: ok, walkedMs: tw }; const o2 = out.sc.openByWalk; if (!(o2.sheet && o2.touch === 'none' && o2.shownBtn === 0)) out.fail.push('walk-opened sheet: pad / buttons not hidden');
  const x2 = document.querySelector('.bsh.on .bsh-x'); out.closeBtn = !!x2; await close(); out.sc.closedAfterWalk = hud(); if (!(out.sc.closedAfterWalk.touch !== 'none' && out.sc.closedAfterWalk.shownBtn >= 3)) out.fail.push('after the walk-opened sheet closed: pad / buttons not restored');
  // 3. a sheet opened by someone else (no S.sheetOn): only the DOM has `.bsh.on` — the :has rule + the 0.15 s DOM check must still hide the pad
  { const f = document.createElement('div'); f.className = 'bsh on'; f.style.cssText = 'position:absolute;left:12px;right:12px;bottom:10px;height:120px;z-index:45'; document.querySelector('.rp-on').appendChild(f); await wait(1200);
    out.sc.openForeign = hud(); const o3 = out.sc.openForeign; if (!(o3.touch === 'none' && o3.joy === 'none' && o3.shownBtn === 0)) out.fail.push('foreign .bsh.on: pad / buttons not hidden');
    f.remove(); await wait(1500); out.sc.closedForeign = hud(); if (!(out.sc.closedForeign.touch !== 'none' && out.sc.closedForeign.shownBtn >= 3 && !out.sc.closedForeign.rpSheetRoot)) out.fail.push('foreign sheet removed: pad / buttons not restored'); }
  out.ok = out.fail.length === 0; return JSON.stringify(out);
})()
