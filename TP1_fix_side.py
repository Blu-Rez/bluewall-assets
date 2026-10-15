# TP1_fix_side.py - patches /root/bw_art/tp1_pics6.py: the emblem exists only on the middle of the BACK, so the FRONT and SIDE prompts must not draw it anywhere.
import sys
p = sys.argv[1]
s = open(p).read()
if "def costume(d, emblem=True)" in s:
    print("already patched"); sys.exit(0)

def rep(old, new):
    global s
    assert s.count(old) == 1, ("not found / not unique", old[:70], s.count(old))
    s = s.replace(old, new)

rep('''def costume(d):
    return ("Costume for a game model''', '''def costume(d, emblem=True):
    tail = ("the middle of the upper back carries %s, large and clear, about 25 cm tall. " % d["emblem"]) if emblem else \\
           ("the cloak is completely plain in this view: NO emblem, NO symbol, NO drawing, NO embroidery, NO pattern on it and none on her arms or sleeves (the emblem exists only on the middle of the back and cannot be seen from here). ")
    return ("Costume for a game model''')
rep('''+ "On her back: %s, hanging straight from the shoulders close to the body and ending just below the hips, so it covers the hips and buttocks (upper-thigh length, not shorter and not longer), "
              "one clean piece of fabric, not billowing, hanging behind her arms without covering them; the middle of the upper back carries %s, large and clear, about 25 cm tall. " % (d["cloak"], d["emblem"]))''',
    '''+ ("On her back: %s, hanging straight from the shoulders close to the body and ending just below the hips, so it covers the hips and buttocks (upper-thigh length, not shorter and not longer), "
               "one clean piece of fabric, not billowing, hanging behind her arms without covering them; " % d["cloak"]) + tail)''')
rep('+ REAL + POSE + face + costume(d) + END)', '+ REAL + POSE + face + costume(d, False) + END)')
rep('''the cloak hanging straight down behind her. " % n
            + REAL + POSE + costume(d) + END)''', '''the cloak hanging straight down behind her, seen edge-on, with its outer side completely plain. " % n
            + REAL + POSE + costume(d, False) + END)''')
open(p, "w").write(s)
print("patched", p)
