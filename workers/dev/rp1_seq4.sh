#!/bin/bash
cd /home/claude/dev; C="python3 rp1c.py"
$C eval "(() => { __rp.cam('first'); __rp.setInput(0,0); __rp.setPos(40.95,21.98,-2.17); __rp.setLook(-2.17,1.22); __rp.sim(0.5); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_first_down
$C eval "(() => { __rp.cam('third'); const d=__rp.door(); const y=Math.atan2(-d.nx,-d.nz); __rp.setInput(0,0); __rp.setPos(d.x+d.nx*2.6,d.z+d.nz*2.6,y); __rp.setLook(y+1.15,0.14); __rp.sim(0.8); return JSON.stringify([__rp.pos(), d]); })()"
$C sleep 1; $C shot f_door
$C eval "(() => { window.__rpHold=9000; setTimeout(() => __rp.goUnder(), 0); return 1; })()"
$C sleep 3; $C shot f_loader
$C wait "!!(__rp.pos().where==='under' && !__rp.S.busy2)" 150 | cut -c1-80
$C eval "(() => { window.__rpHold=0; __rp.cam('third'); __rp.setInput(0,0); __rp.setLook(__rp.S.camYaw, 0.2); __rp.sim(0.3); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_under_a
$C eval "(() => { __rp.setPos(14,22,3.6); __rp.setLook(3.6,-0.05); __rp.sim(0.4); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_under_b
$C eval "(() => { __rp.setPos(0,56,0); __rp.setLook(0.35,0.06); __rp.sim(0.4); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_under_portal
$C eval "(() => { __rp.S.cool=0; __rp.setPos(0,68,0); __rp.setInput(0,1); __rp.sim(0.2); return JSON.stringify(__rp.pos()); })()"
$C wait "!!(__rp.pos().where==='home' && !__rp.S.busy2)" 120 | cut -c1-80
$C eval "(() => { __rp.setInput(0,0); __rp.S.cool=99; __rp.setLook(__rp.S.camYaw+2.4,0.18); __rp.sim(0.5); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_back_home
$C click ".rp-b:has-text('خروج')"
$C sleep 8; $C shot after_exit
$C eval "JSON.stringify([!!document.querySelector('.rp-on'), __bw.camera.near, __bw.renderer.info.autoReset, __bw.ctl.dist, __bw.scene.children.length])"
echo DONE > /home/claude/work/rp1/seq4.done
