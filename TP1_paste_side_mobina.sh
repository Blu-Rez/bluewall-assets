mkdir -p /root/bw_art/tp1/v2 && cat > /root/bw_art/tp1_fix_side2.py <<'BWEOF'
# TP1_fix_side2.py - patches /root/bw_art/tp1_pics6.py: in the SIDE picture only ONE arm and ONE hand may be visible (the near, LEFT arm hangs along the hip; the far arm is hidden behind the body).
# Reason: "A-pose 40 degrees away from the body" made the model draw two arms apart (one forward, one back) in the side view, and Tripo built the arms like that (Mobina).
import sys
p = sys.argv[1]
s = open(p).read()
if "SIDE_POSE" in s:
    print("already patched"); sys.exit(0)


def rep(old, new):
    global s
    assert s.count(old) == 1, ("not found / not unique", old[:70], s.count(old))
    s = s.replace(old, new)


rep('END = ("NO weapon', '''SIDE_POSE = ("Standing straight and relaxed, seen exactly edge-on from her left side. Her arms hang straight down along the body, NOT forward and NOT backward: "
             "seen edge-on the two arms overlap, so only ONE arm and ONE hand are visible, her near LEFT arm hanging beside the hip with the open hand at upper-thigh level; "
             "her right arm is completely hidden behind her body and torso, with no second hand, no second sleeve and no second arm anywhere in the picture. "
             "Feet flat on the floor, both pointing to the left edge of the picture. "
             "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small margin, centred. ")
END = ("NO weapon''')
rep('+ REAL + POSE + costume(d, False) + END)', '+ REAL + SIDE_POSE + costume(d, False) + END)')
# the common intro says "the same pose as the front picture" - that would copy the spread arms into the side view, so drop it for the side only
rep('    return (same + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view', '    return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view')
open(p, "w").write(s)
print("patched", p)
BWEOF
cd /root/bluebot_v2
if python3 /root/bw_art/tp1_fix_side2.py /root/bw_art/tp1_pics6.py; then
  if [ -f /root/bw_art/tp1/v2/mobina/side.png ] && [ ! -f /root/bw_art/tp1/v2/mobina/side_prev.png ]; then cp /root/bw_art/tp1/v2/mobina/side.png /root/bw_art/tp1/v2/mobina/side_prev.png; fi
  ONLY=mobina VIEWS=side nohup ./.venv/bin/python /root/bw_art/tp1_pics6.py > /root/bw_art/tp1/v2/side_mobina.log 2>&1 &
  sleep 5; tail -n 5 /root/bw_art/tp1/v2/side_mobina.log
else
  echo "PATCH FAILED - nothing was run"
fi
