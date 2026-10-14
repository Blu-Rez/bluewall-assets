import re, sys
P = '/home/claude/bot/bluebot_v2/bluewall/web/index.html'
s = open(P, encoding='utf-8').read()
def rep(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:70])
    s = s.replace(old, new)
def dellines(prefix):
    global s
    L = s.split('\n'); idx = [i for i, l in enumerate(L) if l.startswith(prefix)]
    assert len(idx) == 1, (prefix, len(idx)); del L[idx[0]]; s = '\n'.join(L)
def repline(prefix, new):
    global s
    L = s.split('\n'); idx = [i for i, l in enumerate(L) if l.startswith(prefix)]
    assert len(idx) == 1, (prefix, len(idx)); L[idx[0]] = new; s = '\n'.join(L)

# ---- CSS: stars static + a few tiny twinklers
repline('#ld-stars i{', '#ld-stars i{left:0;top:0;width:1px;height:1px;border-radius:50%;background:transparent}\n#ld-tws{left:0;top:0;width:100%;height:36%}\n#ld-tws i{width:3px;height:3px;margin:-1.5px 0 0 -1.5px;border-radius:50%;background:radial-gradient(closest-side,#fff,rgba(190,220,255,.7) 45%,rgba(150,200,255,0));opacity:.3;will-change:opacity;animation:ldTwk var(--d) ease-in-out var(--dl) infinite alternate}\n@keyframes ldTwk{from{opacity:.95}to{opacity:.2}}')
for p in ('#ld-stars .s1{', '#ld-stars .s2{', '#ld-stars .s3{'): dellines(p)
# moon halo + rays: static (painted once into the root layer, no GPU layers)
rep('will-change:opacity;animation:ldBreath 7s ease-in-out infinite alternate}', '}')
rep('position:absolute;will-change:opacity;animation:ldRay var(--d) ease-in-out var(--dl) infinite alternate}', 'position:absolute}')
# clouds: static (the 240 s drift was invisible but cost 14 Mpx of GPU layers)
rep('.ld-strip.rev{animation-direction:reverse}', '.ld-strip.rev{animation-direction:reverse}\n#ld-cl1,#ld-cl2{width:100%;will-change:auto;animation:none}')
# far plate: static
repline('#ld-far{', '#ld-far{}')
dellines('@keyframes ldKen')
# torches: one tiny layer per glow (was 3 full-plate layers)
dellines('.ld-tg{')
rep('.ld-t{width:var(--s);height:var(--s);', '.ld-t{will-change:opacity;animation:ldFl var(--d) ease-in-out var(--dl) infinite alternate;width:var(--s);height:var(--s);')
# snow: 34 tiny flakes (was one 468x1264 sheet + sway wrapper)
repline('#ld-snow{', '#ld-snow{left:0;top:0;width:100%;height:100%;overflow:hidden}')
repline('#ld-snow i{', '#ld-snow i{top:-8px;width:var(--s);height:var(--s);border-radius:50%;background:rgba(225,238,255,var(--o));box-shadow:0 0 calc(var(--s) * 1.8) rgba(190,220,255,.5);will-change:transform;animation:ldFlake var(--d) linear var(--dl) infinite}')
repline('@keyframes ldFall', '@keyframes ldFlake{from{transform:translate3d(0,0,0)}to{transform:translate3d(var(--dx),var(--fall,880px),0)}}')
dellines('#ld-snow b{'); dellines('@keyframes ldSway')
# shade + vignette: ONE tiny canvas (was two full-screen gradient layers)
repline('#ld-shade{', '#bw-load canvas{position:absolute;display:block;pointer-events:none}\n#ld-sv{left:0;top:0;width:100%;height:100%}')
dellines('#ld-vig{')
# dragon: one image (the wing/body split only existed for the flap, which is switched off)
dellines('#ld-dragon .dw{'); dellines('@keyframes ldBob')
repline('#ld-dragon img{', '#ld-dragon img{left:0;top:0;width:100%;height:100%;clip-path:polygon(0 0,100% 0,100% 47%,57% 47%,57% 100%,43% 100%,43% 47%,0 47%)}')
for p in ('#ld-dragon .dl{', '#ld-dragon .dr{', '#ld-dragon .db{', '@keyframes ldWingL', '@keyframes ldWingR', '/* the dragon glides', '#ld-dragon .dl,#ld-dragon .dr,#ld-dragon .dw{'): dellines(p)
# halo of light: low-resolution canvases (rotated by the compositor) instead of 520 px masked conic layers
repline('#ld-hal .rays{', '#ld-hal .rays{position:absolute;left:0;top:0;width:100%;height:100%;will-change:transform;animation:ldRot 40s linear infinite}')
repline('#ld-hal .glow{', '#ld-hal .glow{position:absolute;left:10%;top:31%;width:80%;height:38%;will-change:opacity,transform;animation:ldBr2 4.2s ease-in-out infinite alternate}')

# ---- JS
rep("const rays = () =>", "const lcg = (sd) => () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };\nconst flakes = () => { const r = lcg(11); let h = ''; for (let i = 0; i < 34; i++) { const z = 1.4 + r() * 2.2; h += `<i style=\"left:${f1(r() * 100)}%;--s:${f1(z)}px;--o:${f2(.35 + r() * .45)};--d:${f1(8 + r() * 9)}s;--dl:${f1(-r() * 16)}s;--dx:${Math.round((r() - .5) * 70)}px\"></i>`; } return h; };\nconst rays = () =>")
rep('<div id="ld-world"><img id="ld-far" alt=""><div id="ld-drake"><img alt=""></div><div id="ld-mi1" class="ld-strip" style="--tw:1200px;--d:150s"></div>\n <img id="ld-near" alt="" fetchpriority="high"><img id="ld-emis" alt=""><div id="ld-fx"></div>',
    '<div id="ld-world"><img id="ld-far" alt=""><img id="ld-near" alt="" fetchpriority="high"><img id="ld-emis" alt=""><div id="ld-drake"><img alt=""></div><div id="ld-mi1" class="ld-strip" style="--tw:1200px;--d:150s"></div><div id="ld-fx"></div>')
rep('<div id="ld-snow"><b><i style="--t:420px;--d:21s;--o:.5;background-image:url(/pub/ld_snow.webp)"></i></b></div>\n<div id="ld-shade"></div><div id="ld-vig"></div>',
    '<div id="ld-tws"></div><div id="ld-snow">${flakes()}</div>\n<canvas id="ld-sv"></canvas>')
rep('<div id="ld-hal"><div class="rays"></div><div class="rays r2"></div><div class="glow"></div>', '<div id="ld-hal"><canvas class="rays"></canvas><canvas class="rays r2"></canvas><canvas class="glow"></canvas>')
rep('<div id="ld-dragon"><div class="dw"><img class="dl" alt=""><img class="dr" alt=""><img class="db" alt=""></div></div>', '<div id="ld-dragon"><img alt=""></div>')
# torches
a = s.index("  const tg = ['', '', ''];"); b = s.index("\n", s.index("tg.forEach((t, i) =>"))
s = s[:a] + "  W.torch.forEach(([x, y, sz], i) => { s += `<i class=\"ld-t\" style=\"left:${f2(x * 100)}%;top:${f2(y * 100)}%;--s:${f2(sz)}em;--d:${f2([.9, 1.27, 1.63][i % 3])}s;--dl:${f2(-(i % 3) * .4 - i * .07)}s\"></i>`; });" + s[b:]
# drawing helpers + layout hooks
rep("const $ = (id) => document.getElementById(id);\n", """const $ = (id) => document.getElementById(id);
// the halo of light, drawn once at low resolution (a canvas is a texture layer: 400x400 px instead of a 520 css-px masked layer at 3.3x)
function drawHal() {
  const cs = root.querySelectorAll('#ld-hal canvas.rays'), gl = root.querySelector('#ld-hal canvas.glow');
  try {
    const n = 400, a = cs[0]; a.width = a.height = n; const g = a.getContext('2d');
    if (g.createConicGradient) {
      const cg = g.createConicGradient(-Math.PI / 2, n / 2, n / 2), C = (al) => `rgba(150,205,255,${al})`;
      for (let k = 0; k < 15; k++) { const b = k * 24; cg.addColorStop(Math.min(1, b / 360), C(0)); cg.addColorStop((b + 9) / 360, C(0)); cg.addColorStop((b + 12) / 360, C(.15)); cg.addColorStop((b + 15) / 360, C(0)); }
      cg.addColorStop(1, C(0)); g.fillStyle = cg; g.fillRect(0, 0, n, n);
      g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      m.addColorStop(0, 'rgba(0,0,0,.95)'); m.addColorStop(.18, 'rgba(0,0,0,.95)'); m.addColorStop(.55, 'rgba(0,0,0,.35)'); m.addColorStop(.78, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, n, n);
      const b2 = cs[1]; b2.width = b2.height = n; b2.getContext('2d').drawImage(a, 0, 0);
    }
    gl.width = 200; gl.height = 96; const q = gl.getContext('2d'); q.translate(100, 48); q.scale(100, 48);
    const rg = q.createRadialGradient(0, 0, 0, 0, 0, 1); rg.addColorStop(0, 'rgba(110,180,255,.42)'); rg.addColorStop(.55, 'rgba(60,130,255,.16)'); rg.addColorStop(1, 'rgba(40,100,255,0)'); q.fillStyle = rg; q.fillRect(-1, -1, 2, 2);
  } catch (e) {}
}
// bottom shade + vignette: one half-resolution canvas (smooth gradients only)
function paintSV(vw, vh) {
  const c = $('ld-sv'); if (!c) return; const w = Math.max(2, Math.round(vw / 2)), h = Math.max(2, Math.round(vh / 2));
  if (c.width === w && c.height === h) return; c.width = w; c.height = h;
  const g = c.getContext('2d'), y0 = h * .66, sg = g.createLinearGradient(0, y0, 0, h);
  sg.addColorStop(0, 'rgba(2,5,12,0)'); sg.addColorStop(.45, 'rgba(2,5,12,.55)'); sg.addColorStop(1, 'rgba(1,3,8,.9)'); g.fillStyle = sg; g.fillRect(0, y0, w, h - y0);
  g.save(); g.translate(w * .5, h * .45); g.scale(w * .85, h * .7); const vg = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.55, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,2,8,.62)'); g.fillStyle = vg; g.fillRect(-2, -2, 4, 4); g.restore();
}
// a dozen twinkling stars (tiny layers) over the static star field, kept clear of the moon
function placeTw(vw, vh, mx, my, mr) {
  const t = $('ld-tws'); if (!t) return; const key = vw + 'x' + vh + ':' + Math.round(mx) + ',' + Math.round(my); if (t.dataset.k === key) return; t.dataset.k = key;
  const r = lcg(5); let h = '', n = 0, guard = 0;
  while (n < 12 && guard++ < 80) { const x = r() * vw, y = r() * vh * .34; if (Math.hypot(x - mx, y - my) < mr * 2.4) continue; n++; h += `<i style="left:${f1(x)}px;top:${f1(y)}px;--d:${f1(2 + r() * 3)}s;--dl:${f1(-r() * 4)}s"></i>`; }
  t.innerHTML = h;
}
drawHal();
""")
rep("c2.style.top = f1(my + 120 * s) + 'px'; c2.style.height = f1(330 * s) + 'px';\n}", "c2.style.top = f1(my + 120 * s) + 'px'; c2.style.height = f1(330 * s) + 'px';\n  paintSV(vw, vh); placeTw(vw, vh, mx, my, mr); $('ld-snow').style.setProperty('--fall', Math.round(vh + 24) + 'px');\n}")
open(P, 'w', encoding='utf-8').write(s)
print('patched OK', len(s))
