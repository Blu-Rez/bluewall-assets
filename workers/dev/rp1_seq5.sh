#!/bin/bash
cd /home/claude/dev; C="python3 rp1c.py"
$C eval "(async () => { const h = await __rpLoad('?v=6'); await h.start('elina'); __rp.pause(true); setTimeout(() => __rp.goUnder(), 0); return 1; })()"
$C wait "!!(__rp.pos().where==='under' && !__rp.S.busy2)" 150 | cut -c1-80
$C eval "(() => { __rp.setInput(0,0); __rp.S.cool=99; __rp.setLook(__rp.S.camYaw, 0.2); __rp.sim(0.3); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_under_a
$C eval "(() => { __rp.setPos(14,22,3.6); __rp.setLook(3.6,-0.05); __rp.sim(0.4); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_under_b
$C eval "(() => { const p=__rp.W().portal; __rp.setPos(p.x,p.z-7,0); __rp.setLook(0.5,0.05); __rp.sim(0.4); return JSON.stringify([__rp.pos(),p.x,p.z]); })()"
$C sleep 1; $C shot f_under_portal
$C eval "(() => { __rp.S.cool=0; __rp.setLook(0,0.2); __rp.setInput(0,1); __rp.sim(1.6); return JSON.stringify(__rp.pos()); })()"
$C wait "!!(__rp.pos().where==='home' && !__rp.S.busy2)" 120 | cut -c1-80
$C eval "(() => { __rp.setInput(0,0); __rp.S.cool=99; __rp.setLook(__rp.S.camYaw+2.4,0.18); __rp.sim(0.5); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_back_home
$C eval "(() => { __rp.exit(); return 1; })()"
$C sleep 8; $C shot after_exit
$C eval "JSON.stringify([!!document.querySelector('.rp-on'), __bw.camera.near, __bw.renderer.info.autoReset, __bw.ctl.dist, __bw.scene.children.length])"
echo DONE > /home/claude/work/rp1/seq5.done
