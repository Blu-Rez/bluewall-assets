// The REAL battle HUD (bhud.js createHUD) on a plain page, no 3D: for orb / ability-button looks.  ?st=rdy|cd|off  (state of the two hero powers), ?bg=1 (olive field behind)
import { createHUD } from '../../bot/bluebot_v2/bluewall/client/src/bhud.js';
const Q = new URLSearchParams(location.search), st = Q.get('st') || 'rdy';
document.documentElement.style.background = '#5d6e33'; document.body.style.cssText = 'margin:0;min-height:100vh;background:radial-gradient(circle at 40% 40%,#7b8a46,#56662f 70%,#3f4c24);';
if (Q.get('still')) { const st0 = document.createElement('style'); st0.textContent = '*{animation:none!important}'; document.head.appendChild(st0); }
const root = document.createElement('div'); root.style.cssText = 'position:fixed;inset:0;'; document.body.appendChild(root);
const types = (Q.get('t') || 'spear,sword,archer,cavalry,axerider,giant,hill,dragon,baby,dragonling,pegasus,shieldmaiden,lord').split(',');
const hud = createHUD(root, { target: { name: 'Navid', emblem: 'swords', levels: { keep: 20 }, ratio: 1, loot: { turq: 60, emerald: 60, ruby: 60 } }, types, spells: ['lightning', 'heal', 'freeze', 'rage', 'quake'], onSelect() {}, onSpell() {}, onAbility() {}, onTool: Q.get('tools') || Q.get('scout') ? () => {} : null, toolSet: { squad: !!Q.get('tools'), scout: !!Q.get('scout') }, onEnd() {}, onNext() {} });
hud.ready();
const squads = {}; types.forEach((t, i) => { squads[t] = { n: 8 - (i % 5), hp: [1, 0.8, 0.5, 0.25, 1][i % 5], sent: i % 3 === 0 }; });
const A = (s) => (s === 'rdy' ? { n: 1, sent: true, f: 0, left: 0, ready: true } : s === 'cd' ? { n: 1, sent: true, f: 0.62, left: 12, ready: false } : { n: 1, sent: false, f: 0, left: 0, ready: false });
if (Q.get('scout')) { /* pre-start look: nothing sent yet */ }
hud.update({ left: 150, des: 12, starsN: 0, loot: {}, squads, sel: 'giant', started: !Q.get('scout') && !Q.get('pre'), spellN: { lightning: 3, heal: 2, freeze: 2, rage: 2, quake: 2 }, tools: Q.get('tools') || Q.get('scout') ? { show: true, half: (Q.get('tools') || '').includes('half'), focus: (Q.get('tools') || '').includes('focus'), scout: !!Q.get('scout') } : null, abil: { shieldmaiden: A(st.split(',')[0]), lord: A(st.split(',')[1] || st.split(',')[0]) } });
if (Q.get('res')) {          // result card sample (S10): the real card with the numbers of a real battle (res_sample.json)
  fetch('/s33/res_sample.json').then((r) => r.json()).then((r) => { if (Q.get('res') === 'plain') { delete r.by; delete r.hint; } hud.showResults(r, { onHome() {}, onNext() {} }); setTimeout(() => { window.__ready = true; }, 2600); });
} else setTimeout(() => { window.__ready = true; }, 600);

if (Q.get('scout')) { hud.scoutPanel([{ k: 'Guns', p: 0.62 }, { k: 'Walls', p: 0.06 }, { k: 'Houses', p: 0.18 }, { k: 'Rest', p: 0.14 }], Q.get('scout') === 'card' ? { name: 'Cannon', hits: 'Ground only', line: 'Ground only, its blast hurts crowds. Blind close up and useless against flyers.' } : null); }

// p34: ring tags + dotted arrows on the plain page (fake positions): ?rt=1  (ability buttons: st=off hides them, st=rdy shows them)
if (Q.get('rt')) {
  const pts = [[70, 520, 'spear', 8, 1], [150, 560, 'sword', 6, 0.8], [235, 540, 'archer', 8, 0.5], [320, 570, 'cavalry', 5, 0.25], [190, 640, 'giant', 2, 1]];
  hud.tags(pts.map(([x, y, t, n, k]) => ({ t, x, y, n, k, lit: t === 'sword' })));
  hud.lines([{ x0: 150, y0: 520, x1: 205, y1: 330, c: '#ffa94d', a: 1 }, { x0: 235, y0: 500, x1: 300, y1: 300, c: '#8ce99a', a: 0.85 }]);
}
