mkdir -p /root/bw_art/tp1/v2 && cat > /root/bw_art/tp1_patch_right.py <<'BWEOF'
# TP1_patch_right.py - patches /root/bw_art/tp1_pics6.py (idempotent, safe to run twice):
#  1) SIDE picture (left side): only ONE arm / ONE hand visible (same as TP1_fix_side2.py, skipped if already applied)
#  2) NEW view "right": the RIGHT side picture (she faces the right edge, her right arm is the only visible arm)
#  3) default views = front, back, side(left), right, card ; Telegram captions say "left side" / "right side"
import sys
p = sys.argv[1]
s = open(p).read()
if '"right"' in s and "RIGHT_POSE" in s:
    print("already patched"); sys.exit(0)


def rep(old, new):
    global s
    assert s.count(old) == 1, ("not found / not unique", old[:70], s.count(old))
    s = s.replace(old, new)


if "SIDE_POSE" not in s:
    rep('END = ("NO weapon', '''SIDE_POSE = ("Standing straight and relaxed, seen exactly edge-on from her left side. Her arms hang straight down along the body, NOT forward and NOT backward: "
             "seen edge-on the two arms overlap, so only ONE arm and ONE hand are visible, her near LEFT arm hanging beside the hip with the open hand at upper-thigh level; "
             "her right arm is completely hidden behind her body and torso, with no second hand, no second sleeve and no second arm anywhere in the picture. "
             "Feet flat on the floor, both pointing to the left edge of the picture. "
             "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small margin, centred. ")
END = ("NO weapon''')
    rep('+ REAL + POSE + costume(d, False) + END)', '+ REAL + SIDE_POSE + costume(d, False) + END)')
    rep('    return (same + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view', '    return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view')

rep('END = ("NO weapon', '''RIGHT_POSE = ("Standing straight and relaxed, seen exactly edge-on from her right side. Her arms hang straight down along the body, NOT forward and NOT backward: "
              "seen edge-on the two arms overlap, so only ONE arm and ONE hand are visible, her near RIGHT arm hanging beside the hip with the open hand at upper-thigh level; "
              "her left arm is completely hidden behind her body and torso, with no second hand, no second sleeve and no second arm anywhere in the picture. "
              "Feet flat on the floor, both pointing to the right edge of the picture. "
              "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small margin, centred. ")
END = ("NO weapon''')
rep('    return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view',
    '''    if view == "right":
        return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view (exactly 90 degrees), her RIGHT side toward the camera, she faces the RIGHT edge of the picture, the cloak hanging straight down behind her, seen edge-on, with its outer side completely plain. " % n
                + REAL + RIGHT_POSE + costume(d, False) + END)
    return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view''')
rep('VIEW_ORDER = ("front", "back", "side", "card")', 'VIEW_ORDER = ("front", "back", "side", "right", "card")')
rep('or ["front", "back", "side", "card"]', 'or ["front", "back", "side", "right", "card"]')
rep('rest = [v for v in ("back", "side") if v in VIEWS]', 'rest = [v for v in ("back", "side", "right") if v in VIEWS]')
rep('order = [v for v in ("front", "back", "side") if v in got]', 'order = [v for v in ("front", "back", "side", "right") if v in got]')
rep('v.upper() + (" (player-pick card)" if v == "card" else "")', 'v.upper() + {"card": " (player-pick card)", "side": " (LEFT side)", "right": " (RIGHT side)"}.get(v, "")')
open(p, "w").write(s)
print("patched", p)
BWEOF
cd /root/bluebot_v2
if python3 /root/bw_art/tp1_patch_right.py /root/bw_art/tp1_pics6.py; then
  VIEWS=right nohup ./.venv/bin/python /root/bw_art/tp1_pics6.py > /root/bw_art/tp1/v2/right.log 2>&1 &
  sleep 5; tail -n 5 /root/bw_art/tp1/v2/right.log
else
  echo "PATCH FAILED - nothing was run"
fi
