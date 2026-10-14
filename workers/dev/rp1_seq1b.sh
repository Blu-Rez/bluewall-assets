#!/bin/bash
cd /home/claude/dev; C="python3 rp1c.py"
$C eval "(() => { __rp.cam('third'); __rp.setPos(30,20,-2.2); __rp.setLook(-2.2,0.2); __rp.setInput(0,0); __rp.sim(0.4); __rp.dodge(); __rp.setInput(0,0.9); __rp.sim(0.32); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_dodge
$C eval "(() => { const d=__rp.door(); __rp.setInput(0,0); __rp.setPos(d.x+d.nx*7,d.z+d.nz*7,Math.atan2(-d.nx,-d.nz)); __rp.setLook(Math.atan2(-d.nx,-d.nz)+0.5,0.22); __rp.sim(0.6); return JSON.stringify([__rp.pos(), d]); })()"
$C sleep 1; $C shot f_door
echo DONE > /home/claude/work/rp1/seq1b.done
