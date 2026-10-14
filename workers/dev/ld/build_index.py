import json, re, shutil, os
IDX = '/home/claude/bot/bluebot_v2/bluewall/web/index.html'
BAK = '/home/claude/dev/index.p15.bak.html'
if not os.path.exists(BAK): shutil.copy(IDX, BAK)
old = open(BAK, encoding='utf-8').read().split('\n')
var = open('/home/claude/dev/ld/variants.js', encoding='utf-8').read().split('\n')
tp = json.load(open('/home/claude/dev/ld/title_paths.json'))
TP = json.dumps({'bask': tp['bask']}, separators=(',', ':'))
L = lambda a, b: '\n'.join(old[a-1:b])        # old index lines (1-based, inclusive)
V = lambda a, b: '\n'.join(var[a-1:b])         # variants.js lines

# ---------- CSS
css = r'''@font-face{font-family:Vazirmatn;src:url(/pub/Vazirmatn-Regular.woff2) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:Vazirmatn;src:url(/pub/Vazirmatn-Bold.woff2) format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:Vazirmatn;src:url(/pub/Vazirmatn-Black.woff2) format("woff2");font-weight:900;font-display:swap}
@font-face{font-family:"Libre Baskerville";src:url(/pub/baskerville-700.woff2) format("woff2");font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:"Libre Baskerville";src:url(/pub/baskerville-400.woff2) format("woff2");font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:Cinzel;src:url(/pub/cinzel-900.woff2) format("woff2");font-weight:900;font-display:block}
@font-face{font-family:"Noto Sans Tai Viet";src:url(/pub/taiviet.woff2) format("woff2");font-display:swap}
:root{--bg:#050912;--ink:#dbe8ff;--dim:#7f93b8;--blue:#4aa8ff;--glow:#7cc8ff}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:Vazirmatn,system-ui,sans-serif;overflow:hidden;overscroll-behavior:none;touch-action:none;user-select:none;-webkit-user-select:none}
#game{position:fixed;inset:0}
#bw-load{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#020509;transition:opacity .6s ease;z-index:1000}
#bw-load.done{opacity:0;pointer-events:none}
#bw-stage{position:relative;flex:none;width:390px;height:844px;overflow:hidden;transform-origin:50% 50%;
  background:radial-gradient(ellipse 120% 70% at 50% 30%,#163f86 0%,#0b2152 30%,#06112b 56%,#020509 88%);font-family:Cinzel,Georgia,serif;font-weight:900;color:#d8f0ff;-webkit-user-select:none;user-select:none}
#bw-stage svg.bg,#bw-stage .fx{position:absolute;inset:0;pointer-events:none}
#bw-stage .ly{position:absolute;display:block;pointer-events:none}
#bw-stage img.ly{opacity:0;transition:opacity .7s ease}#bw-stage img.ly.on{opacity:1}
#bw-stage .tip{position:absolute;left:0;right:0;text-align:center;font:700 11.5px/1 'Libre Baskerville',Georgia,serif;letter-spacing:1.4px;color:#8fb6e0;text-shadow:0 1px 0 #000,0 0 8px rgba(0,0,0,.9)}
.wsweep{animation:sw 3.6s ease-in-out infinite}@keyframes sw{0%{transform:translateX(0) skewX(-18deg)}60%,100%{transform:translateX(560px) skewX(-18deg)}}
.spin1{animation:spin 70s linear infinite}.spin2{animation:spin 46s linear infinite reverse}@keyframes spin{to{transform:rotate(360deg)}}
.ebar{position:absolute;left:36px;width:318px}
.ebadge{position:absolute;top:-52px;left:calc(0% - 32px);width:64px;height:40px;transition:left .25s ease-out}.ebadge svg{position:absolute;inset:0}
.ebadge b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 16px Cinzel,serif;color:#f4feff;text-shadow:0 0 6px #3cb6ff}.ebadge i{font-style:normal;font-size:10px;margin-left:1px}
.etrack{height:18px;border-radius:9px;padding:2px;background:linear-gradient(#0a1a3a,#030a1a);box-shadow:0 0 0 1.4px #5fb8ff,0 0 14px rgba(40,140,255,.55),inset 0 2px 5px #000}
.efill{position:relative;height:100%;border-radius:7px;transition:width .25s ease-out;background:linear-gradient(#bff4ff,#46b6ff 42%,#1766e6 58%,#0e47b8);box-shadow:0 0 12px rgba(80,190,255,.9)}
.estripe{position:absolute;inset:0;border-radius:7px;overflow:hidden;background:repeating-linear-gradient(115deg,rgba(255,255,255,0) 0 9px,rgba(255,255,255,.2) 9px 15px);background-size:30px 100%;animation:stripe 1s linear infinite}
@keyframes stripe{to{background-position:30px 0}}
.egloss{position:absolute;left:3px;right:3px;top:1px;height:36%;border-radius:5px;background:linear-gradient(rgba(255,255,255,.8),rgba(255,255,255,0))}
.etip{position:absolute;right:-9px;top:50%;width:18px;height:18px;margin-top:-9px}.etip span{position:absolute;inset:0;border-radius:50%;background:radial-gradient(#fff,rgba(150,230,255,.9) 35%,rgba(60,170,255,0) 70%);animation:pulse 1.2s ease-in-out infinite}
.etip:before,.etip:after{content:"";position:absolute;left:50%;top:50%;background:#fff;opacity:.9;border-radius:2px}.etip:before{width:26px;height:1.4px;margin:-.7px 0 0 -13px}.etip:after{width:1.4px;height:26px;margin:-13px 0 0 -.7px}
@keyframes pulse{50%{transform:scale(1.35);opacity:.7}}
.eticks{display:block;margin-top:3px}.elab{text-align:center;margin-top:2px;font:900 11px Cinzel,serif;letter-spacing:5px;color:#8fc9ff;text-shadow:0 0 8px rgba(60,170,255,.8)}
#msg{display:none;position:fixed;left:0;right:0;bottom:12%;z-index:1100;text-align:center;padding:0 24px;line-height:1.9;font-size:17px;color:var(--ink);font-weight:700;direction:rtl;text-shadow:0 2px 0 #000,0 0 12px #000}
#msg.big{display:block}
'''

# ---------- loader script
js = []
js.append("(function () {")
js.append("const q = new URLSearchParams(location.search); const P0 = q.has('p') ? +q.get('p') : 0;   // ?p=NN previews a fixed percentage")
js.append(L(51, 54))                       # W,H,CX / IMG / rnd / f1
js.append(L(56, 160))                      # sky, vignette, fortress
js.append(L(182, 182))                     # sparkle
js.append("const img = (k, w, cx, cy, filter) => { const m = IMG[k]; const h = m.h * w / m.w; return `<img class=\"ly\" alt=\"\" src=\"${m.src}\" onload=\"this.classList.add('on')\" style=\"left:${cx - w / 2}px;top:${f1(cy - h / 2)}px;width:${w}px;height:${f1(h)}px;filter:${filter}\">`; };")
js.append(L(186, 194))                     # motes, beam, halo, DRAGON_F, CROWN_F, FOGBOT
js.append(L(197, 198))                     # ground, castle
js.append("const TP = " + TP + ";   // 'Blue Wall' lettering as plain vector paths (Libre Baskerville Bold): no font, no JS fitting, nothing that can double up")
js.append(V(6, 10))                        # titleG + defsBlur
js.append(V(59, 91))                       # titleN2, runeRing, dividerN2, barN2, setBarN2
js.append(r'''
// ---------------------------------------------------------------- compose: dragon over the crown over the glowing title, the fortress below
let html = sky(CX, 300, 42);
html += halo(CX, 262, 210, 190, 'rgba(110,190,255,.55)');
html += runeRing(CX, 266, 70);
html += beam(CX, 300, 700, 120) + motes(3, 40, 60, 600) + castle(-6);
html += img('dragon', 214, CX, 160, DRAGON_F) + halo(CX, 272, 70, 46, 'rgba(120,200,255,.5)') + img('crown', 116, CX, 272, CROWN_F);
html += `<svg class="fx" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${[[CX, 237, 6, 1], [150, 294, 3.5, .8], [242, 290, 4, .8], [60, 170, 4, .6], [336, 380, 3.5, .6]].map((s) => sparkle(...s)).join('')}</svg>`;
html += FOGBOT + vignette();
html += titleN2() + dividerN2(388) + barN2(P0);
html += `<div class="tip" id="bw-tip" style="bottom:30px">Preparing your kingdom…</div>`;
const stage = document.getElementById('bw-stage'); stage.innerHTML = html;
const fit = () => { const s = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; };
addEventListener('resize', fit); fit();
setBarN2(P0);
window.bwLoading = (p) => { p = Math.max(0, Math.min(100, Math.round(p))); const e = document.getElementById('pct'); if (e) e.innerHTML = `${p}<i>%</i>`; setBarN2(p); };
window.bwTip = (t) => { const e = document.getElementById('bw-tip'); if (e && t) e.textContent = t; };
window.bwLoadingDone = () => { const el = document.getElementById('bw-load'); el.classList.add('done'); setTimeout(() => el.remove(), 900); };
setTimeout(() => stage.querySelectorAll('img.ly').forEach((e) => e.classList.add('on')), 3000);   // safety: never leave a picture hidden
document.body.dataset.ready = 1;
})();''')
newjs = '\n'.join(js)

src = '\n'.join(old)
# swap the first <style> block contents
s0 = src.index('<style>') + len('<style>\n'); s1 = src.index('</style>')
src = src[:s0] + css + src[s1:]
# swap the first loader <script>…</script> (the IIFE that starts with const VARIANT)
a = src.index('(function () {\nconst VARIANT'); b = src.index('})();\n</script>', a) + len('})();')
src = src[:a] + newjs + src[b:]
src = src.replace('document.querySelector(".lbar")', 'document.querySelector(".ebar")')
# preload the two lettering fonts that appear in the first frame
src = src.replace('<title>Blue Wall</title>', '<title>Blue Wall</title>\n<link rel="preload" href="/pub/cinzel-900.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/pub/baskerville-700.woff2" as="font" type="font/woff2" crossorigin>')
open(IDX, 'w', encoding='utf-8').write(src)
print('index.html', len(src))
