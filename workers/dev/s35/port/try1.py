import sys, json
from drive import *
# python3 try1.py type d ly [az up] -> shots/try_<type>.png  (live, black background, frozen frame)
t = sys.argv[1]; d = float(sys.argv[2]); ly = float(sys.argv[3]); az = float(sys.argv[4]) if len(sys.argv) > 4 else 0.7; up = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
SB = lambda c: "__bw.scene.background.set(%s); if (__bw.scene.fog && __bw.scene.fog.color) __bw.scene.fog.color.set(%s);" % (c, c)
WAIT = lambda ms: "await new Promise(r=>setTimeout(r,%d)); " % ms
print(run([{"js": ISO + "return 1;"}, {"js": "__bw.pause(false); __iso('%s'); " % t + SB('0x0c1f44') + WAIT(5000) + "const _r=__pt('%s',%s,%s,%s,%s,30); " % (t, d, ly, az, up) + WAIT(1000) + "__bw.pause(true); __bw.renderer.render(__bw.scene,__bw.camera); return _r;", "vp": 384, "shot": 'try_' + t}, {"js": "__bw.pause(false); return 1;"}]).split('\n')[0])
