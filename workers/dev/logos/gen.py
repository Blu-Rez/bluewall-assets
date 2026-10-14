import math, sys
# Attack-button logo candidates, hand-drawn SVG (viewBox 0 0 100 100), palette: steel / light blue / navy
def defs(p):
    return f'''<defs>
<linearGradient id="{p}bl" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d4e6f8"/><stop offset=".5" stop-color="#8aa6c6"/><stop offset="1" stop-color="#46618a"/></linearGradient>
<linearGradient id="{p}gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f7ff"/><stop offset=".45" stop-color="#8ea8c8"/><stop offset="1" stop-color="#34496b"/></linearGradient>
<linearGradient id="{p}gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f8f"/><stop offset="1" stop-color="#0b1c42"/></linearGradient>
<radialGradient id="{p}pm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9f1ff"/><stop offset=".5" stop-color="#4fb6f2"/><stop offset="1" stop-color="#1b5aa8"/></radialGradient>
<radialGradient id="{p}gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#4aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></radialGradient>
<linearGradient id="{p}sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d6"/><stop offset=".55" stop-color="#1c4a98"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient>
</defs>'''
def sword(p, x, y, rot=0, s=1.0, L=60, W=3.8, guard=13):
    # origin = centre of the cross-guard; blade points up (-y)
    tip=-L; sh=-(L-14)
    d=f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">'
    # blade: left half bright, right half dark, sharp tip
    d+=f'<path d="M{-W} -4 L{-W} {sh} L0 {tip} L0 -4Z" fill="url(#{p}bl)" />'
    d+=f'<path d="M0 -4 L0 {tip} L{W} {sh} L{W} -4Z" fill="#6d8bb2"/>'
    d+=f'<path d="M{-W} -4 L{-W} {sh} L0 {tip} L{W} {sh} L{W} -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/>'
    d+=f'<path d="M0 -9 L0 {sh+4}" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/>'   # fuller
    d+=f'<path d="M{-W+1.1} -5 L{-W+1.1} {sh+1}" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/>'
    # cross-guard: slightly curved, drooping quillons with ball ends
    g=guard
    d+=f'<path d="M{-g} 1 Q{-g} -3.5 {-g+4} -4.3 L{g-4} -4.3 Q{g} -3.5 {g} 1 Q{g-2} 2.2 {g-5} 1 L{-g+5} 1 Q{-g+2} 2.2 {-g} 1Z" fill="url(#{p}gd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/>'
    d+=f'<circle cx="{-g}" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="{g}" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/>'
    # grip with leather wrap and pommel
    d+=f'<rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#{p}gp)" stroke="#071229" stroke-width=".9"/>'
    for i in range(4): d+=f'<path d="M-2.3 {4+i*3.2} L2.3 {5.4+i*3.2}" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/>'
    d+=f'<circle cx="0" cy="19.6" r="3.9" fill="url(#{p}gd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#{p}pm)"/>'
    return d+'</g>'
def halo(p, cx=50, cy=48, r=44): return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{p}gl)"/>'
def shield(p, cx, cy, s=1.0):
    pts="M-20 -22 L20 -22 L20 2 Q20 18 0 28 Q-20 18 -20 2Z"
    return f'<g transform="translate({cx} {cy}) scale({s})"><path d="{pts}" fill="url(#{p}sh)" stroke="#071229" stroke-width="2" stroke-linejoin="round"/><path d="{pts}" fill="none" stroke="url(#{p}gd)" stroke-width="2.6" stroke-linejoin="round" transform="scale(.93)"/><path d="M0 -22 L0 28" stroke="#cfe6ff" stroke-width=".9" opacity=".35"/></g>'
def opt_A(p):  # one upright sword, radiant
    return defs(p)+halo(p)+'<g opacity=".9"><path d="M50 8 L52 30 L50 34 L48 30Z M50 92 L52 70 L50 66 L48 70Z" fill="#bfeaff" opacity=".0"/></g>'+sword(p,50,70,0,1.12,L=62,W=4.2,guard=15)
def opt_B(p):  # crossed swords (X): hilts low left/right, points high on the opposite side
    return defs(p)+halo(p)+sword(p,34,72,42,1.05,L=64,W=3.9,guard=12.5)+sword(p,66,72,-42,1.05,L=64,W=3.9,guard=12.5)
def opt_C(p):  # sword over heater shield
    return defs(p)+halo(p)+shield(p,50,52,1.08)+sword(p,50,66,0,.95,L=60,W=4.0,guard=15)
def wing(p, side):
    s=-1 if side=='l' else 1
    g=''
    for rot,L,w in [(112,30,6.2),(98,38,6.6),(84,45,7),(68,47,7),(52,43,6.6),(36,36,6)]:
        g+=f'<g transform="rotate({rot})"><path d="M0 0 C{w} {-L*.2:.1f} {w} {-L*.72:.1f} 0 {-L} C{-w} {-L*.72:.1f} {-w} {-L*.2:.1f} 0 0Z" fill="url(#{p}bl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 {-L*.1:.1f} L0 {-L*.82:.1f}" stroke="#7f9cc0" stroke-width=".8"/></g>'
    return f'<g transform="translate({s*5} 6) scale({s} 1)">{g}</g>'
def opt_D(p):  # winged sword
    return defs(p)+halo(p)+f'<g transform="translate(50 50) scale(.92)">{wing(p,"l")}{wing(p,"r")}</g>'+sword(p,50,72,0,1.0,L=60,W=4.0,guard=11)
def helm(p, cx, cy, s=1.0):
    h=f'<g transform="translate({cx} {cy}) scale({s})">'
    h+=f'<path d="M-17 22 L-19 -4 Q-19 -26 0 -28 Q19 -26 19 -4 L17 22 Q8 26 0 26 Q-8 26 -17 22Z" fill="url(#{p}gd)" stroke="#071229" stroke-width="1.8" stroke-linejoin="round"/>'
    h+=f'<path d="M-15 0 L15 0 L15 5 L-15 5Z" fill="#06122c" stroke="#071229" stroke-width="1"/><path d="M-1 -26 L1 -26 L1 24 L-1 24Z" fill="#c7dcf3" opacity=".9"/>'
    h+=''.join(f'<circle cx="{x}" cy="{y}" r="1" fill="#06122c"/>' for x,y in [(-9,12),(-9,16),(-5,18),(5,18),(9,12),(9,16)])
    h+=f'<path d="M-16 -8 Q-8 -22 0 -24" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/></g>'
    return h
def opt_E(p):  # a diagonal strike with a light slash behind it
    slash=f'<path d="M10 80 C26 36 60 14 92 16 C66 26 40 46 10 80Z" fill="url(#{p}gl2)" opacity=".95"/><path d="M16 84 C34 44 64 26 90 26 C64 34 42 54 16 84Z" fill="#8fe0ff" opacity=".35"/>'
    return defs(p).replace('</defs>',f'<linearGradient id="{p}gl2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4aa8ff" stop-opacity="0"/><stop offset=".6" stop-color="#9fe6ff" stop-opacity=".9"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>')+halo(p)+slash+sword(p,30,72,45,1.12,L=60,W=3.9,guard=13)
def crown(p, cx, cy, s=1.0):
    c=f'<g transform="translate({cx} {cy}) scale({s})">'
    c+=f'<path d="M-22 10 L-26 -14 L-12 -2 L0 -22 L12 -2 L26 -14 L22 10Z" fill="url(#{p}gd)" stroke="#071229" stroke-width="1.8" stroke-linejoin="round"/>'
    c+=f'<rect x="-22" y="10" width="44" height="8" rx="2" fill="url(#{p}sh)" stroke="#071229" stroke-width="1.5"/>'
    c+=f'<circle cx="-26" cy="-14" r="3" fill="url(#{p}pm)" stroke="#071229" stroke-width="1"/><circle cx="0" cy="-22" r="3.4" fill="url(#{p}pm)" stroke="#071229" stroke-width="1"/><circle cx="26" cy="-14" r="3" fill="url(#{p}pm)" stroke="#071229" stroke-width="1"/>'
    c+=''.join(f'<circle cx="{x}" cy="14" r="1.5" fill="#bfeaff"/>' for x in (-13,0,13))
    return c+'</g>'
def opt_F(p):  # crossed swords under a crown
    return defs(p)+halo(p)+sword(p,34,74,42,1.0,L=60,W=3.8,guard=12)+sword(p,66,74,-42,1.0,L=60,W=3.8,guard=12)+crown(p,50,25,.62)
OPTS={'A':opt_A,'B':opt_B,'C':opt_C,'D':opt_D,'E':opt_E,'F':opt_F}
LABEL={'A':'Longsword','B':'Crossed blades','C':'Sword & shield','D':'Winged sword','E':'Strike','F':'Crown & blades'}
def svg(k, size=100, p=None):
    p=p or k.lower()
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">{OPTS[k](p)}</svg>'
if __name__=='__main__':
    cells=''
    for k in 'ABCDEF':
        cells+=f'''<div class="c"><div class="ring"><div class="core">{svg(k,176,k.lower())}</div></div><div class="t"><b>{k}</b> {LABEL[k]}</div></div>'''
    html=f'''<!doctype html><meta charset="utf-8"><style>
html,body{{margin:0;background:#050c1c;font-family:Georgia,serif;color:#eaf6ff}}
.g{{display:grid;grid-template-columns:repeat(3,1fr);gap:22px 10px;padding:22px 12px;width:860px}}
.c{{display:flex;flex-direction:column;align-items:center;gap:10px}}
.ring{{width:216px;height:216px;border-radius:50%;background:conic-gradient(from 200deg,#f2f7ff,#8aa0bd 20%,#3a4d6e 40%,#d6e4f5 58%,#6d83a6 78%,#f2f7ff);padding:7px;box-sizing:border-box;box-shadow:0 8px 22px rgba(0,0,0,.6)}}
.core{{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 50% 24%,#35609f,#0b1f4a 62%,#030a1c);display:grid;place-items:center;box-shadow:inset 0 3px 10px rgba(170,215,255,.4)}}
.t{{font-size:17px;letter-spacing:.5px}}.t b{{color:#8fe0ff;font-size:22px;margin-right:6px}}
</style><div class="g">{cells}</div>'''
    open('sheet.html','w').write(html)
