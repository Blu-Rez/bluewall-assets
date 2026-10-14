const W = 390, H = 844, CX = 195;
const IMG = { dragon: { src: '/pub/dragon.webp', w: 840, h: 731 }, crown: { src: '/pub/crown.webp', w: 560, h: 363 } };
let seed = 1; const rnd = (s) => { if (s !== undefined) seed = s; seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const f1 = (x) => (+x).toFixed(1);

// ---------------------------------------------------------------- sky: rays + stars + vignette
function sky(cx, cy, s0) {
  rnd(s0); let rays = '';
  for (let i = 0; i < 18; i++) { const a = i * Math.PI * 2 / 18 + rnd() * .1, w = .05 + rnd() * .06, L = 700;
    rays += `<polygon points="${f1(cx)},${f1(cy)} ${f1(cx + L * Math.cos(a - w))},${f1(cy + L * Math.sin(a - w))} ${f1(cx + L * Math.cos(a + w))},${f1(cy + L * Math.sin(a + w))}" fill="url(#bwRay)" opacity="${(.25 + rnd() * .35).toFixed(2)}"/>`; }
  let dots = ''; for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H * .78, s = rnd() * 1.8 + .4; dots += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${s.toFixed(2)}" fill="#9fdcff" opacity="${(.15 + rnd() * .55).toFixed(2)}"/>`; }
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
   <radialGradient id="bwRay" cx="${cx}" cy="${cy}" r="500" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7cc9ff" stop-opacity=".55"/><stop offset=".6" stop-color="#2a7be0" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
   <filter id="bwRb"><feGaussianBlur stdDeviation="6"/></filter></defs><g filter="url(#bwRb)">${rays}</g>${dots}</svg>`;
}
const vignette = () => `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><radialGradient id="bwVig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bwVig)"/></svg>`;

// ---------------------------------------------------------------- fortress silhouettes
// shapes: arrays of SVG path strings; front layer gets the rim light, windows and the gate glow
function fortress(v) {
  const F = [], B = [], wins = [], gates = [], flags = [];
  const G = 820;
  // conical-roof tower: body x..x+w from `top` down to `base`, roof overhang, slightly concave cone, finial (+ optional pennant)
  const tower = (L, x, w, top, rh, o = {}) => {
    const base = o.base ?? G, ov = o.ov ?? w * .16, cx = x + w / 2, ap = top - rh, sp = o.spire ?? Math.max(4, rh * .2);
    L.push(`M${f1(x)} ${base}L${f1(x)} ${f1(top + 3)}L${f1(x - ov)} ${f1(top + 3)}L${f1(x - ov)} ${f1(top)}Q${f1(cx - w * .1)} ${f1(top - rh * .38)} ${f1(cx)} ${f1(ap)}Q${f1(cx + w * .1)} ${f1(top - rh * .38)} ${f1(x + w + ov)} ${f1(top)}L${f1(x + w + ov)} ${f1(top + 3)}L${f1(x + w)} ${f1(top + 3)}L${f1(x + w)} ${base}Z`);
    L.push(`M${f1(cx - .55)} ${f1(ap + 2)}L${f1(cx - .55)} ${f1(ap - sp)}L${f1(cx + .55)} ${f1(ap - sp)}L${f1(cx + .55)} ${f1(ap + 2)}Z`);
    if (o.ball) L.push(circle(cx, ap - sp * .55, 1.3));
    if (o.flag) flags.push([cx + .5, ap - sp, o.flag]);
    if (o.win) for (const [fx, fy, k] of o.win) wins.push([x + w * fx, top + fy, k || 1, L === F]);
  };
  const circle = (x, y, r) => `M${f1(x - r)} ${f1(y)}a${r} ${r} 0 1 0 ${f1(2 * r)} 0a${r} ${r} 0 1 0 ${f1(-2 * r)} 0Z`;
  // crenellated block (walls, keeps): top with merlons
  const cren = (L, x0, x1, top, o = {}) => {
    const base = o.base ?? G, mw = o.mw ?? 4.2, mh = o.mh ?? 4.2; let d = `M${f1(x0)} ${base}L${f1(x0)} ${f1(top - mh)}`; let x = x0; let up = true;
    while (x < x1 - .01) { const nx = Math.min(x1, x + mw); d += `L${f1(nx)} ${f1(up ? top - mh : top)}`; up = !up; if (nx < x1) d += `L${f1(nx)} ${f1(up ? top - mh : top)}`; x = nx; }
    d += `L${f1(x1)} ${base}Z`; L.push(d);
  };
  const slope = (L, pts) => L.push('M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z');
  if (v === 'D1') {            // the Citadel: symmetric fortress, gatehouse keep with twin turrets and a central spire under the title diamond
    slope(B, [[-5, 812], [-5, 728], [28, 720], [62, 726], [100, 712], [140, 722], [195, 716], [250, 722], [290, 712], [328, 726], [362, 720], [395, 728], [395, 812]]);
    tower(B, 44, 10, 712, 20); tower(B, 336, 10, 712, 20); tower(B, 128, 8, 704, 16); tower(B, 254, 8, 704, 16);
    cren(F, -4, 394, 732);
    tower(F, 4, 26, 714, 30, { win: [[.5, 12], [.5, 30]], flag: 1 }); tower(F, 360, 26, 714, 30, { win: [[.5, 12], [.5, 30]], flag: -1 });
    tower(F, 70, 28, 707, 32, { win: [[.33, 10], [.67, 10], [.5, 24]], flag: 1, ball: 1 }); tower(F, 292, 28, 707, 32, { win: [[.33, 10], [.67, 10], [.5, 24]], flag: -1, ball: 1 });
    cren(F, 96, 294, 722);
    cren(F, 158, 232, 708, { mw: 4.6 });
    tower(F, 148, 18, 701, 25, { win: [[.5, 9], [.5, 22]], ball: 1 }); tower(F, 224, 18, 701, 25, { win: [[.5, 9], [.5, 22]], ball: 1 });
    tower(F, 183, 24, 698, 22, { win: [[.5, 8]], spire: 4 });
    for (const [x, y] of [[171, 716], [177, 716], [213, 716], [219, 716], [114, 727], [126, 727], [264, 727], [276, 727], [40, 738], [350, 738]]) wins.push([x, y, .85, true]);
  } else if (v === 'D2') {     // the Crag: fairy-tale fortress on a rocky outcrop, asymmetric towers, mountains in the haze
    slope(B, [[-5, 820], [-5, 700], [24, 684], [50, 698], [80, 678], [112, 704], [140, 696], [160, 716], [230, 716], [252, 700], [282, 708], [316, 680], [346, 698], [372, 688], [395, 700], [395, 820]]);
    slope(F, [[-5, 820], [-5, 772], [26, 764], [56, 752], [86, 740], [110, 732], [130, 728], [260, 728], [282, 733], [304, 742], [334, 756], [362, 766], [395, 770], [395, 820]]);
    cren(F, 112, 288, 722, { base: 760 });
    tower(F, 104, 20, 708, 26, { base: 760, win: [[.5, 10]], ball: 1 });
    tower(F, 136, 26, 694, 22, { base: 760, win: [[.5, 9], [.3, 22], [.7, 22]], flag: 1, spire: 6 });
    cren(F, 162, 230, 706, { base: 760, mw: 4.4 });
    tower(F, 184, 22, 694, 20, { base: 720, win: [[.5, 8]], spire: 5, ball: 1 });
    tower(F, 226, 24, 702, 28, { base: 760, win: [[.5, 10], [.5, 22]], flag: -1 });
    tower(F, 260, 18, 712, 24, { base: 760, win: [[.5, 10]] });
    tower(F, 288, 14, 724, 20, { base: 770, win: [[.5, 9]] });
    slope(F, [[296, 790], [296, 736], [302, 736], [302, 732], [306, 732], [306, 736], [312, 736], [312, 732], [316, 732], [316, 738], [340, 750], [340, 790]]);
    tower(F, 336, 12, 740, 16, { base: 790, win: [[.5, 8]], flag: -1 });
    tower(F, 30, 12, 752, 16, { base: 800, win: [[.5, 8]] });
    for (const [x, y] of [[174, 714], [216, 714], [196, 718], [124, 728], [270, 728]]) wins.push([x, y, .85, true]);
  } else {                      // the Blue Wall: a long crenellated wall with regular cone-roofed towers and a great central gatehouse
    slope(B, [[-5, 812], [-5, 722], [40, 714], [90, 720], [140, 710], [195, 716], [250, 710], [300, 720], [350, 712], [395, 722], [395, 812]]);
    cren(F, -4, 394, 732, { mw: 4 });
    const xs = [14, 64, 114, 276, 326, 376]; const hs = [716, 712, 708, 708, 712, 716];
    xs.forEach((x, i) => tower(F, x - 10, 20, hs[i], 26 + (2 - Math.abs(2.5 - i)) * 2.5, { win: [[.5, 10], [.5, 24]], flag: i < 3 ? 1 : -1 }));
    cren(F, 150, 240, 712, { mw: 5 });
    tower(F, 142, 20, 702, 26, { win: [[.5, 9], [.5, 22]], ball: 1 }); tower(F, 228, 20, 702, 26, { win: [[.5, 9], [.5, 22]], ball: 1 });
    tower(F, 182, 26, 699, 23, { win: [[.3, 9], [.7, 9]], spire: 4 });
    for (let x = 30; x < 380; x += 25) if (Math.abs(x - CX) > 56) wins.push([x, 740, .75, true]);
    for (const [x, y] of [[168, 720], [180, 720], [210, 720], [222, 720]]) wins.push([x, y, .85, true]);
  }
  // ---- render
  const front = F.join(''), back = B.join('');
  let s = `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
   <linearGradient id="bwCas" x1="0" y1="666" x2="0" y2="790" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0c1f45"/><stop offset=".45" stop-color="#06132c"/><stop offset="1" stop-color="#02060f"/></linearGradient>
   <radialGradient id="bwRim" cx="195" cy="620" r="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e6f8ff"/><stop offset=".45" stop-color="#9ad8ff"/><stop offset="1" stop-color="#3f86d6"/></radialGradient>
   <linearGradient id="bwBack" x1="0" y1="676" x2="0" y2="780" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1b4386"/><stop offset="1" stop-color="#0a1f46"/></linearGradient>
   <radialGradient id="bwWin"><stop offset="0" stop-color="#e8faff" stop-opacity=".95"/><stop offset=".35" stop-color="#7fd0ff" stop-opacity=".55"/><stop offset="1" stop-color="#2a8cff" stop-opacity="0"/></radialGradient>
   <linearGradient id="bwGate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8faff"/><stop offset=".45" stop-color="#7fd0ff"/><stop offset="1" stop-color="#1f6fe0"/></linearGradient>
   <linearGradient id="bwFog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2a5c" stop-opacity="0"/><stop offset=".4" stop-color="#081a3c" stop-opacity=".6"/><stop offset="1" stop-color="#01040a" stop-opacity=".97"/></linearGradient>
   <filter id="bwB4" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
   <filter id="bwB9" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
   <filter id="bwB2"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`;
  // halo behind the skyline (separates it from the dark sky)
  s += `<ellipse cx="195" cy="712" rx="235" ry="46" fill="#2f86ff" opacity=".34" filter="url(#bwB9)"/>`;
  // far layer, hazy, faint rim
  s += `<path d="${back}" fill="#6fb4ff" opacity=".35"/><path d="${back}" fill="url(#bwBack)" transform="translate(0 1)" opacity=".95"/>`;
  s += `<g class="mistB"><ellipse cx="110" cy="${v === 'D2' ? 722 : 730}" rx="150" ry="7" fill="#9cc8ff" opacity=".15" filter="url(#bwB4)"/><ellipse cx="300" cy="${v === 'D2' ? 726 : 732}" rx="140" ry="7" fill="#9cc8ff" opacity=".13" filter="url(#bwB4)"/></g>`;
  // front: glow, rim, body
  s += `<path d="${front}" fill="#3a8fff" opacity=".55" filter="url(#bwB4)"/>`;
  s += `<path d="${front}" fill="url(#bwRim)"/><path d="${front}" fill="url(#bwCas)" transform="translate(0 1.5)"/>`;
  // pennants
  for (const [x, y, d] of flags) s += `<path d="M${f1(x)} ${f1(y)}q${f1(d * 6)} 1.6 ${f1(d * 11)} 3.4q${f1(-d * 5)} .2 ${f1(-d * 11)} 2.6z" fill="#0a1a3a" stroke="#8fd0ff" stroke-width=".7" stroke-linejoin="round"/>`;
  // gate: glowing arch + portcullis
  for (const g of gates) { const x0 = g.x - g.w / 2, y0 = g.y - g.h; const d = `M${f1(x0)} ${f1(g.y)}L${f1(x0)} ${f1(y0 + g.w / 2)}A${f1(g.w / 2)} ${f1(g.w / 2)} 0 0 1 ${f1(x0 + g.w)} ${f1(y0 + g.w / 2)}L${f1(x0 + g.w)} ${f1(g.y)}Z`;
    s += `<ellipse cx="${f1(g.x)}" cy="${f1(g.y - g.h * .45)}" rx="${f1(g.w * 1.3)}" ry="${f1(g.h * .9)}" fill="url(#bwWin)" opacity=".8"/><path d="${d}" fill="url(#bwGate)" opacity=".92"/>`;
    let bars = ''; for (let i = 1; i < 5; i++) { const x = x0 + g.w * i / 5; bars += `<line x1="${f1(x)}" y1="${f1(y0)}" x2="${f1(x)}" y2="${f1(g.y)}"/>`; } for (let j = 1; j < 5; j++) { const y = y0 + g.w / 2 + (g.h - g.w / 2) * j / 5; bars += `<line x1="${f1(x0)}" y1="${f1(y)}" x2="${f1(x0 + g.w)}" y2="${f1(y)}"/>`; }
    s += `<g stroke="#0a1c40" stroke-width="1" opacity=".75">${bars}</g><path d="${d}" fill="none" stroke="#9ad8ff" stroke-width=".8" opacity=".9"/>`; }
  // lit windows (none right behind the LOADING label)
  for (const [x, y, k, fr] of wins.filter(([x, y]) => !(y > 724 && Math.abs(x - CX) < 102))) { s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(4.2 * k)}" fill="url(#bwWin)" opacity="${fr ? .85 : .5}"/><rect x="${f1(x - .9 * k)}" y="${f1(y - 2 * k)}" width="${f1(1.8 * k)}" height="${f1(4 * k)}" rx="${f1(.9 * k)}" fill="#dff6ff"/>`; }
  // mist in front of the walls and fog to the bottom edge
  s += `<g class="mistA"><ellipse cx="60" cy="768" rx="120" ry="12" fill="#a9d2ff" opacity=".2" filter="url(#bwB4)"/><ellipse cx="330" cy="772" rx="120" ry="12" fill="#a9d2ff" opacity=".18" filter="url(#bwB4)"/><ellipse cx="195" cy="812" rx="240" ry="18" fill="#8fc2ff" opacity=".13" filter="url(#bwB4)"/></g>`;
  s += `<rect x="0" y="744" width="${W}" height="${H - 744}" fill="url(#bwFog)"/>`;
  return s + '</svg>';
}

const sparkle = (x, y, r, op = 1) => { const k = r * .18; return `<path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z" fill="#fff" opacity="${op}"/><circle cx="${x}" cy="${y}" r="${r * .22}" fill="#fff" opacity="${op}"/>`; };
const img = (k, w, cx, cy, filter) => { const m = IMG[k]; const h = m.h * w / m.w; return `<img class="ly" alt="" src="${m.src}" style="left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;filter:${filter}">`; };

// ---------------------------------------------------------------- scene helpers (v2 loader)
function motes(seed, n, y0, y1) {
  rnd(seed); let s = ''; for (let i = 0; i < n; i++) { const x = rnd() * W, y = y0 + rnd() * (y1 - y0), r = .5 + rnd() * 1.5; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r.toFixed(2)}" fill="#cfeaff" opacity="${(.2 + rnd() * .5).toFixed(2)}"/>`; }
  return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}
const beam = (x, y0, y1, w) => `<div class="ly" style="left:${x - w / 2}px;top:${y0}px;width:${w}px;height:${y1 - y0}px;background:linear-gradient(to top,rgba(150,215,255,.45),rgba(90,170,255,.14) 55%,rgba(60,140,255,0));filter:blur(12px);clip-path:polygon(40% 100%,60% 100%,100% 0,0 0)"></div>`;
const halo = (x, y, rx, ry, col) => `<div class="ly" style="left:${x - rx}px;top:${y - ry}px;width:${rx * 2}px;height:${ry * 2}px;border-radius:50%;background:radial-gradient(closest-side,${col},rgba(0,0,0,0))"></div>`;
const DRAGON_F = 'drop-shadow(0 0 1px rgba(190,230,255,.95)) drop-shadow(0 0 8px rgba(90,175,255,.65)) drop-shadow(0 0 22px rgba(40,120,255,.4))';
const CROWN_F = 'drop-shadow(0 0 10px rgba(110,190,255,.55))';
const FOGBOT = `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="bwFb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020509" stop-opacity="0"/><stop offset="1" stop-color="#020509" stop-opacity="1"/></linearGradient></defs><rect x="0" y="760" width="${W}" height="${H - 760}" fill="url(#bwFb)"/></svg>`;
const ground = (y) => `<div class="ly" style="left:0;top:${y}px;width:${W}px;height:${H - y}px;background:#02060f"></div>`;
const castle = (dy) => ground(770 + dy) + `<div class="ly" style="left:0;top:${dy}px;width:${W}px;height:${H}px">${fortress('D2')}</div>`;
