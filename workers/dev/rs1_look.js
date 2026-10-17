// rs1_look.js — RS1: a scene for the eyes: stand ON, sisters left standing ahead of the camera at the castle gate, one in play.   python3 rp1c2_q.py -t rs1 evalf rs1_look.js   then:  rp1c2_q.py -t rs1 shot NAME
(async () => {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r)), rp = window.__rp, S = rp.S, h = window.__h; window.__rpPhone = true; const sis = h.sisters;
  if (!h.active) await h.start('elina');
  const g = [...document.querySelectorAll('.rp-b[data-rp=gate]')].pop();   // (the LAST one: a hot-reloaded older instance leaves its hidden HUD in the DOM)
   g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 41 })); g.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 41 })); await sl(300);
  sis.setStand(false); const yaw = S.camYaw, f = [Math.sin(yaw), Math.cos(yaw)], r = [-Math.cos(yaw), Math.sin(yaw)], at = (a, b) => [S.x + f[0] * a + r[0] * b, S.z + f[1] * a + r[1] * b, yaw + Math.PI];
  const want = S.key === 'elina' ? ['aylar', 'melika', 'mobina'] : ['elina', 'aylar', 'mobina']; sis.st.places = {}; sis.st.places[want[0]] = at(7, 2.6); sis.st.places[want[1]] = at(11, -3.4); sis.st.places[want[2]] = at(16, 0);
  sis.setStand(true); for (let i = 0; i < 600 && Object.values(sis.ents).filter((e) => e.m).length < 2; i++) await sl(100);
  for (let i = 0; i < 6; i++) await raf(); await sl(1800);
  return JSON.stringify({ key: S.key, ents: sis.info().ents, cap: sis.st.mx });
})()
