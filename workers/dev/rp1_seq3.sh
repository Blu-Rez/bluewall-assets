#!/bin/bash
cd /home/claude/dev; C="python3 rp1c.py"
$C eval "(() => { __rp.cam('third'); __rp.setPos(40.95,21.98,-2.17); __rp.setLook(-2.17,0.2); __rp.setInput(0,0.9); __rp.sim(0.5); __rp.jump(); __rp.sim(0.27); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_jump
$C eval "(() => { __rp.setInput(0,0); __rp.setPos(40.95,21.98,-2.17); __rp.sim(0.4); __rp.dodge(); __rp.setInput(0,0.9); __rp.sim(0.3); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_dodge
$C eval "(() => { __rp.cam('first'); __rp.setInput(0,0); __rp.setPos(40.95,21.98,-2.17); __rp.setLook(-2.17,0.85); __rp.sim(0.5); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_first_down
$C eval "(() => { __rp.cam('third'); const d=__rp.door(); __rp.setInput(0,0); __rp.setPos(d.x+d.nx*3.4,d.z+d.nz*3.4,Math.atan2(-d.nx,-d.nz)); __rp.setLook(Math.atan2(-d.nx,-d.nz),0.12); __rp.sim(0.8); return JSON.stringify([__rp.pos(), d]); })()"
$C sleep 1; $C shot f_door
echo DONE > /home/claude/work/rp1/seq3.done
