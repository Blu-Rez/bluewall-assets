// ===================================================================== neon loader variants (lab)
const TP = __TITLE_PATHS__;
const q = new URLSearchParams(location.search), V = q.get('v') || 'N1', P0 = q.has('p') ? +q.get('p') : 89;

// the title as plain vector paths, scaled to a given width and centred at (cx, cy): no font, no JS fitting, nothing that can double up
function titleG(key, w, cx, cy) {
  const t = TP[key], s = w / (t.x1 - t.x0), h = (t.y1 - t.y0) * s;
  return { s, h, tf: `translate(${f1(cx - w / 2 - t.x0 * s)} ${f1(cy - h / 2 - t.y0 * s)}) scale(${s.toFixed(5)})`, d: t.d, base: cy + h / 2 };
}
const defsBlur = (id, sd) => `<filter id="${id}" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

// ---------------------------------------------------------------- N1  neon sign: outlined tube lettering, reflected on the floor, segmented tube bar
function titleN1() {
  const T = titleG('cinzel', 292, CX, 352), ns = 'vector-effect="non-scaling-stroke"';
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsBlur('nb10', 7)}${defsBlur('nb3', 2.2)}${defsBlur('nb1', .9)}
   <linearGradient id="nrf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
   <mask id="nrm"><rect x="0" y="${f1(T.base)}" width="${W}" height="30" fill="url(#nrf)"/></mask>
   <path id="tN1" d="${T.d}" ${ns}/></defs>
   <g mask="url(#nrm)" opacity=".55"><g transform="translate(0 ${f1(T.base * 2 + 4)}) scale(1 -1)"><g transform="${T.tf}" fill="none" stroke-linejoin="round"><use href="#tN1" stroke="#2f8bff" stroke-width="3" ${ns}/></g></g></g>
   <g transform="${T.tf}" fill="none" stroke-linejoin="round">
    <use class="nfl" href="#tN1" stroke="#1a62ff" stroke-width="12" filter="url(#nb10)" opacity=".9" ${ns}/>
    <use href="#tN1" fill="#041a46" fill-opacity=".72" stroke="none"/>
    <use class="nfl2" href="#tN1" stroke="#3cb6ff" stroke-width="4.4" filter="url(#nb3)" ${ns}/>
    <use href="#tN1" stroke="#7fd9ff" stroke-width="2.6" ${ns}/>
    <use href="#tN1" stroke="#f4feff" stroke-width="1.2" ${ns}/></g></svg>`;
}
function dividerN1(cy) {
  const L = 92, g = 'filter="url(#nd3)"';
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsBlur('nd3', 2)}</defs>
   <g stroke-linecap="round"><path d="M${CX - 14 - L} ${cy}H${CX - 14}M${CX + 14} ${cy}H${CX + 14 + L}" stroke="#2f8bff" stroke-width="3" ${g} opacity=".9"/><path d="M${CX - 14 - L} ${cy}H${CX - 14}M${CX + 14} ${cy}H${CX + 14 + L}" stroke="#e9fbff" stroke-width="1.2"/>
   <path d="M${CX} ${cy - 8}L${CX + 8} ${cy}L${CX} ${cy + 8}L${CX - 8} ${cy}Z" fill="#041a46" stroke="#3cb6ff" stroke-width="3" ${g}/><path d="M${CX} ${cy - 8}L${CX + 8} ${cy}L${CX} ${cy + 8}L${CX - 8} ${cy}Z" fill="none" stroke="#f4feff" stroke-width="1.2"/>
   <circle cx="${CX - 14 - L - 6}" cy="${cy}" r="1.6" fill="#e9fbff"/><circle cx="${CX + 14 + L + 6}" cy="${cy}" r="1.6" fill="#e9fbff"/></g></svg>`;
}
function framesN1() {                                              // thin neon corner brackets around the whole poster
  const m = 14, l = 34, p = (x, y, dx, dy) => `M${x} ${y + dy * l}V${y}H${x + dx * l}`;
  const d = p(m, m + 40, 1, 1) + p(W - m, m + 40, -1, 1) + p(m, H - m, 1, -1) + p(W - m, H - m, -1, -1);
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsBlur('nf2', 2)}</defs><path d="${d}" fill="none" stroke="#2f8bff" stroke-width="2.4" filter="url(#nf2)" opacity=".8"/><path d="${d}" fill="none" stroke="#bfeaff" stroke-width="1" opacity=".9"/></svg>`;
}
const NCELLS = 26;
function barN1(p0) {
  const bw = 318, bh = 30, cw = (bw - 14) / NCELLS;
  let cells = ''; for (let i = 0; i < NCELLS; i++) cells += `<rect class="nc" data-i="${i}" x="${(7 + i * cw + .9).toFixed(2)}" y="6" width="${(cw - 1.8).toFixed(2)}" height="${bh - 12}" rx="2.2" fill="#0b2a63" fill-opacity=".55"/>`;
  return `<div class="nbar" style="bottom:60px">
   <div class="nlab"><span class="nl">LOADING</span><span class="np" id="pct">${p0}<i>%</i></span></div>
   <svg width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}" style="overflow:visible"><defs>${defsBlur('nbg', 4)}
    <linearGradient id="ncg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2fdff"/><stop offset=".5" stop-color="#6fd0ff"/><stop offset="1" stop-color="#1d7bff"/></linearGradient></defs>
    <rect x="1.5" y="1.5" width="${bw - 3}" height="${bh - 3}" rx="${bh / 2 - 1.5}" fill="#030c20" fill-opacity=".85" stroke="#2f8bff" stroke-width="5" filter="url(#nbg)" opacity=".85"/>
    <rect x="1.5" y="1.5" width="${bw - 3}" height="${bh - 3}" rx="${bh / 2 - 1.5}" fill="none" stroke="#9fe0ff" stroke-width="1.6"/>
    <g id="ncells">${cells}</g></svg></div>`;
}
function setBarN1(p) {
  const n = p / 100 * NCELLS; document.querySelectorAll('.nc').forEach((c) => { const i = +c.dataset.i, f = Math.max(0, Math.min(1, n - i));
    if (f >= 1) { c.setAttribute('fill', 'url(#ncg)'); c.setAttribute('fill-opacity', '1'); c.style.filter = 'drop-shadow(0 0 3px #5ccbff)'; }
    else if (f > 0) { c.setAttribute('fill', 'url(#ncg)'); c.setAttribute('fill-opacity', (.25 + f * .6).toFixed(2)); c.style.filter = 'drop-shadow(0 0 5px #9fe6ff)'; }
    else { c.setAttribute('fill', '#0b2a63'); c.setAttribute('fill-opacity', '.55'); c.style.filter = ''; } });
}

// ---------------------------------------------------------------- N2  white-hot glowing title, rune ring, energy-core bar with a travelling spark
function titleN2() {
  const T = titleG('bask', 262, CX, 352), ns = 'vector-effect="non-scaling-stroke"';
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsBlur('wb14', 9)}${defsBlur('wb4', 3)}
   <linearGradient id="wfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#e3f6ff"/><stop offset=".55" stop-color="#9fdcff"/><stop offset="1" stop-color="#e9f9ff"/></linearGradient>
   <linearGradient id="wsw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
   <path id="tN2" d="${T.d}"/><clipPath id="wcl"><use href="#tN2" transform="${T.tf}"/></clipPath></defs>
   <g transform="${T.tf}" stroke-linejoin="round"><use href="#tN2" fill="none" stroke="#1a62ff" stroke-width="22" filter="url(#wb14)" opacity=".85" ${ns}/>
     <use href="#tN2" fill="none" stroke="#46c2ff" stroke-width="7" filter="url(#wb4)" opacity=".9" ${ns}/>
     <use href="#tN2" fill="url(#wfg)" stroke="#bfeaff" stroke-width="1.2" ${ns}/></g>
   <g clip-path="url(#wcl)"><rect class="wsweep" x="-120" y="${f1(352 - T.h)}" width="70" height="${f1(T.h * 2)}" fill="url(#wsw)" transform="skewX(-18)"/></g></svg>`;
}
function runeRing(cx, cy, r) {
  let t = '', dm = ''; for (let i = 0; i < 72; i++) { const a = i * Math.PI / 36, l = i % 6 === 0 ? 7 : 3.2; t += `M${f1(cx + Math.cos(a) * (r - l))} ${f1(cy + Math.sin(a) * (r - l))}L${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}`; }
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + .3, x = cx + Math.cos(a) * (r + 9), y = cy + Math.sin(a) * (r + 9); dm += `<path d="M${f1(x)} ${f1(y - 4.5)}L${f1(x + 3.4)} ${f1(y)}L${f1(x)} ${f1(y + 4.5)}L${f1(x - 3.4)} ${f1(y)}Z" fill="#cfefff"/>`; }
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsBlur('rg2', 2.4)}</defs>
   <g class="spin1" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3aa4ff" stroke-width="2.4" filter="url(#rg2)" opacity=".8"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#cfefff" stroke-width=".9" opacity=".8"/><path d="${t}" stroke="#bfeaff" stroke-width=".9" opacity=".8"/>${dm}</g>
   <g class="spin2" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r - 15}" fill="none" stroke="#7fd0ff" stroke-width="1" stroke-dasharray="3 7" opacity=".6"/></g></svg>`;
}
function dividerN2(cy) {
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="d2g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7fd0ff" stop-opacity="0"/><stop offset=".5" stop-color="#e9fbff"/><stop offset="1" stop-color="#7fd0ff" stop-opacity="0"/></linearGradient>${defsBlur('d2b', 2.4)}</defs>
   <rect x="${CX - 120}" y="${cy - .8}" width="240" height="1.6" fill="url(#d2g)"/><rect x="${CX - 120}" y="${cy - 1.4}" width="240" height="2.8" fill="url(#d2g)" filter="url(#d2b)" opacity=".8"/>
   <path d="M${CX} ${cy - 7}L${CX + 7} ${cy}L${CX} ${cy + 7}L${CX - 7} ${cy}Z" fill="#e9fbff"/><path d="M${CX} ${cy - 7}L${CX + 7} ${cy}L${CX} ${cy + 7}L${CX - 7} ${cy}Z" fill="#5cc4ff" filter="url(#d2b)" opacity=".9"/></svg>`;
}
function barN2(p0) {
  const bw = 318, bh = 16, ticks = Array.from({ length: 11 }, (_, i) => `<rect x="${(1 + i * (bw - 2) / 10 - .5).toFixed(1)}" y="${i % 5 === 0 ? 4 : 6}" width="1" height="${i % 5 === 0 ? 8 : 5}" fill="#8fd2ff" opacity="${i % 5 === 0 ? .8 : .5}"/>`).join('');
  return `<div class="ebar" style="bottom:64px"><div class="ebadge" id="ebd"><svg width="64" height="40" viewBox="0 0 64 40"><path d="M16 2H48L62 20L48 38H16L2 20Z" fill="#06173a" stroke="#6fd0ff" stroke-width="1.6"/><path d="M16 2H48L62 20L48 38H16L2 20Z" fill="none" stroke="#2f8bff" stroke-width="5" opacity=".35"/></svg><b id="pct">${p0}<i>%</i></b></div>
   <div class="etrack"><div class="efill" id="efill" style="width:${p0}%"><div class="estripe"></div><div class="egloss"></div><div class="etip"><span></span></div></div></div>
   <svg class="eticks" width="${bw}" height="16" viewBox="0 0 ${bw} 16">${ticks}</svg><div class="elab">LOADING</div></div>`;
}
function setBarN2(p) {
  document.getElementById('efill').style.width = p + '%';
  const b = document.getElementById('ebd'); b.style.left = `calc(${p}% - 32px)`;
}

// ---------------------------------------------------------------- N3  chrome title with a neon rim, gothic rails, a row of crystal gems that fill one by one
function titleN3() {
  const T = titleG('cinzel', 296, CX, 352), ns = 'vector-effect="non-scaling-stroke"';
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsBlur('cb10', 6)}${defsBlur('cb3', 1.8)}
   <linearGradient id="cfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".32" stop-color="#d9ecfb"/><stop offset=".5" stop-color="#7ea9d3"/><stop offset=".53" stop-color="#2a4f86"/><stop offset=".8" stop-color="#8fc3ee"/><stop offset="1" stop-color="#f1f9ff"/></linearGradient>
   <path id="tN3" d="${T.d}"/></defs>
   <g transform="${T.tf}" stroke-linejoin="round"><use href="#tN3" fill="none" stroke="#2a78ff" stroke-width="9" filter="url(#cb10)" opacity=".75" ${ns}/>
    <use href="#tN3" fill="none" stroke="#041433" stroke-width="4.2" ${ns}/><use href="#tN3" fill="url(#cfg)" stroke="none"/>
    <use href="#tN3" fill="none" stroke="#7fd9ff" stroke-width="1.6" filter="url(#cb3)" ${ns}/><use href="#tN3" fill="none" stroke="#e8fbff" stroke-width=".8" ${ns}/></g></svg>`;
}
function railsN3() {
  const rail = (x) => `<path d="M${x} 150V690" stroke="url(#rl)" stroke-width="1.4"/><path d="M${x} 150V690" stroke="url(#rl)" stroke-width="5" filter="url(#rb)" opacity=".5"/>` + [230, 352, 470, 590].map((y) => `<path d="M${x} ${y - 6}L${x + 4} ${y}L${x} ${y + 6}L${x - 4} ${y}Z" fill="#cfefff"/>`).join('');
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="rl" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="690"><stop offset="0" stop-color="#7fd0ff" stop-opacity="0"/><stop offset=".3" stop-color="#9fdcff"/><stop offset=".7" stop-color="#9fdcff"/><stop offset="1" stop-color="#7fd0ff" stop-opacity="0"/></linearGradient>${defsBlur('rb', 2.4)}</defs>${rail(22)}${rail(W - 22)}</svg>`;
}
function dividerN3(cy) { return dividerN2(cy); }
const GEM = 'M15 1L28 16L15 37L2 16Z', NG = 10;
function barN3(p0) {
  const gw = 30, gap = 5, tot = NG * gw + (NG - 1) * gap, x0 = (W - tot) / 2;
  let g = ''; for (let i = 0; i < NG; i++) g += `<g transform="translate(${x0 + i * (gw + gap)} 0)"><path d="${GEM}" fill="#06173a" stroke="#2a5fb5" stroke-width="1.2"/><g clip-path="url(#gc${i})"><path class="gf" data-i="${i}" d="${GEM}" fill="url(#gg)"/></g><path d="${GEM}" fill="none" stroke="#9fdcff" stroke-width="1" opacity=".9"/><path d="M15 1L28 16L15 20L2 16Z" fill="#fff" opacity=".18"/></g>`;
  const clips = Array.from({ length: NG }, (_, i) => `<clipPath id="gc${i}"><rect id="gcr${i}" x="0" y="0" width="0" height="40"/></clipPath>`).join('');
  return `<div class="gbar" style="bottom:56px"><svg width="${W}" height="44" viewBox="0 0 ${W} 44" style="overflow:visible"><defs>${clips}${defsBlur('gb', 3)}<linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2fdff"/><stop offset=".45" stop-color="#7fd6ff"/><stop offset="1" stop-color="#2a82ff"/></linearGradient></defs>${g}</svg>
   <div class="glab"><span class="nl">LOADING</span> <span class="np" id="pct">${p0}<i>%</i></span></div></div>`;
}
function setBarN3(p) {
  for (let i = 0; i < NG; i++) { const f = Math.max(0, Math.min(1, p / 10 - i)); document.getElementById('gcr' + i).setAttribute('width', (30 * f).toFixed(1)); const el = document.querySelector(`.gf[data-i="${i}"]`); if (el) el.style.filter = f > 0 ? 'drop-shadow(0 0 4px #7fd6ff)' : ''; }
}

// ---------------------------------------------------------------- compose
let html = sky(CX, 300, 42);
html += halo(CX, 262, 210, 190, 'rgba(110,190,255,.55)');
if (V === 'N2') html += runeRing(CX, 266, 70);
else html += `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><circle cx="195" cy="268" r="118" fill="none" stroke="#9fd8ff" stroke-width="1" opacity=".22"/><circle cx="195" cy="268" r="132" fill="none" stroke="#9fd8ff" stroke-width=".6" stroke-dasharray="2 5" opacity=".25"/></svg>`;
html += beam(CX, 300, 700, 120) + motes(3, 40, 60, 600) + castle(-6);
html += img('dragon', 214, CX, 160, DRAGON_F) + halo(CX, 272, 70, 46, 'rgba(120,200,255,.5)') + img('crown', 116, CX, 272, CROWN_F);
html += `<svg class="fx" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${[[CX, 237, 6, 1], [150, 294, 3.5, .8], [242, 290, 4, .8], [60, 170, 4, .6], [336, 380, 3.5, .6]].map((s) => sparkle(...s)).join('')}</svg>`;
html += FOGBOT + vignette();
if (V === 'N1') html += framesN1() + titleN1() + dividerN1(414) + barN1(P0);
if (V === 'N2') html += titleN2() + dividerN2(388) + barN2(P0);
if (V === 'N3') html += railsN3() + titleN3() + dividerN3(388) + barN3(P0);
html += `<div class="tip" id="bw-tip" style="bottom:30px">Waking the realm…</div>`;
const stage = document.getElementById('bw-stage'); stage.innerHTML = html;
const fit = () => { const s = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; };
addEventListener('resize', fit); fit();
window.bwLoading = (p) => { p = Math.max(0, Math.min(100, Math.round(p))); const e = document.getElementById('pct'); if (e) e.innerHTML = `${p}<i>%</i>`; if (V === 'N1') setBarN1(p); if (V === 'N2') setBarN2(p); if (V === 'N3') setBarN3(p); };
window.bwLoading(P0);
document.body.dataset.ready = 1;
