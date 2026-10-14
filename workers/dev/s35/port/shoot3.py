import json, sys, os
from drive import *
# python3 shoot3.py types [vp] -> shots/<type>_k.png (black bg) + <type>_w.png (white bg): the alpha is recovered in mkport3.py
FR = json.load(open(D + '/fr.json')); CFG = json.load(open(D + '/cfg3.json'))
DEF = dict(bf=0.62, az=0.6, dy=0.0, pad=1.12, up=0.3)
BIG = {'ogre','treant','gryphon','gryphonknight','darkrider','baby3','dragon3','pegasus', 'baby', 'dragon', 'dragonling', 'catapult', 'ram', 'cannon', 'trebuchet', 'werewolf', 'giant', 'hill'}
types = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] != 'all' else list(FR)
VP = int(sys.argv[2]) if len(sys.argv) > 2 else 384
FIND = json.load(open(D + '/find2.json')) if os.path.exists(D + '/find2.json') else {}
run([{"js": ISO + "return 1;"}]); run([{"js": "await new Promise(r=>setTimeout(r,1500)); return 1;", "vp": VP, "shot": "warm"}, {"js": "await new Promise(r=>setTimeout(r,1500)); return 1;", "vp": VP, "shot": "warm"}])
BG = lambda c: "__bw.scene.fog.color.set(%s);" % c
for t in types:
    c = dict(DEF)
    if t in BIG: c['bf'] = 1.0
    c.update(CFG.get(t, {}))
    d, ly, az, up, fov = FR[t]
    if c.get('fixed'):
        fd, fl = c['fixed']; js = cam(t, fd, fl, c['az'], c['up'])
    else:
        r = FIND.get(t) if (FIND.get(t) and abs(FIND.get('_az_' + t, c['az']) - c['az']) < 1e-6) else None
        if not r:
            run([{"js": "__iso('%s'); " % t + BG('0x0c1f44') + "await new Promise(r=>setTimeout(r,9000)); return 1;"}])
            r = find(t, d * 3, ly, c['az'], c['up'], vp=VP); FIND[t] = r; FIND['_az_' + t] = c['az']; json.dump(FIND, open(D + '/find2.json', 'w'))
        if not r: print(t, 'NOT FOUND'); continue
        top, bot = r['top'], r['bot']; H = top - bot
        if c.get('hb'): H = c['hb']; top = bot + H
        win = H * c['bf']; ctr = top - win / 2 + c['dy'] * H
        dd = max(win * c['pad'], (r['W'] * c.get('padw', 0.0))) / K
        js = cam(t, round(dd, 3), round(ctr, 3), c['az'], c['up'], sx=c.get('sx', 0.0) * K * dd)
    SB = lambda c: "__bw.scene.background.set(%s); if (__bw.scene.fog && __bw.scene.fog.color) __bw.scene.fog.color.set(%s);" % (c, c)
    WAIT = lambda ms: "await new Promise(r=>setTimeout(r,%d)); " % ms
    # frozen pair: settle with the camera in place, then PAUSE the loop and render the very same frame on black and on white (an animated unit never differs between the two)
    print(t, run([{"js": "__bw.pause(false); __iso('%s'); " % t + SB('0x000000') + WAIT(7000) + js.replace('return ', 'const _r=') + " " + WAIT(1200) + "__bw.pause(true); __bw.renderer.render(__bw.scene,__bw.camera); return _r;", "vp": VP, "shot": t + '_k'},
                {"js": SB('0xffffff') + "__bw.renderer.render(__bw.scene,__bw.camera); return 1;", "vp": VP, "shot": t + '_w'},
                {"js": "__bw.pause(false); " + SB('0x0c1f44') + "return 1;"}]).split('\n')[0], flush=True)
