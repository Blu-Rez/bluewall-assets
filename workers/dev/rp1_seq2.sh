#!/bin/bash
cd /home/claude/dev; C="python3 rp1c.py"
$C eval "(async () => { const h = await __rpLoad('?v=5'); await h.start('elina'); __rp.pause(true); __rp.S.cool=99; __rp.cam('third'); __rp.setPos(30,20,-2.2); __rp.setLook(-2.2,0.2); __rp.setInput(0,0.9); __rp.sim(0.6); __rp.jump(); __rp.sim(0.27); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_jump
$C eval "(() => { __rp.cam('first'); __rp.setPos(30,20,-2.2); __rp.setLook(-2.2,0.85); __rp.setInput(0,0); __rp.sim(0.5); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_first_down
$C eval "(() => { __rp.cam('first'); __rp.setLook(-2.2,0.05); __rp.sim(0.2); return 1; })()"
$C sleep 1; $C shot f_first_ahead
echo DONE > /home/claude/work/rp1/seq2.done
