# a2_freeze.py : write work/a2/streams.json into the A2-STREAMS block of layout.js
import json
S=json.load(open('/home/claude/work/a2/streams.json'))
p='/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js'; s=open(p).read()
i=s.index("  // A2-STREAMS-BEGIN"); j=s.index("  // A2-STREAMS-END")+len("  // A2-STREAMS-END")
txt = """  // A2-STREAMS-BEGIN
  // A2 (owner 6 Oct 2026: «ساعت ۲ ... از بالا کوه از وسط کوه پایین و بیاد تو خندق» — «هر دو! ولی رود ۱ عریض‌تر»): two streams from the mountain at the 2 o'clock of the home camera. Each one runs down its own gorge with its own waterfall
  // (falls.js draws it from pts[0..1], like RIVER[0..1]), across the north plain and into the moat. k = width scale of the bed / banks / clearance (1 = like the p38 river). Planned OFFLINE by dev/a2_plan.mjs
  // (A* over the real terrain, clear of camp / quarry / mines / hamlets and their spurs / nomads, and of each other) and frozen here; roads.js bridges every road a stream meets.
  STREAMS: [\n"""
for st in S:
    body=",\n      ".join("["+", ".join(str(v) for v in q)+"]" for q in st['pts'])
    txt += "    { id: '%s', kind: 'stream', k: %s, pts: [\n      %s,\n    ] },\n" % (st['id'], st['k'], body)
txt += "  ],\n  // A2-STREAMS-END"
open(p,'w').write(s[:i]+txt+s[j:]); print('frozen', [st['id'] for st in S])
