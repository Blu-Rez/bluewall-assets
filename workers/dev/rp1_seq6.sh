#!/bin/bash
cd /home/claude/dev; C="python3 rp1c.py"
$C eval "(() => { const c=__bw.ctl; c.intro=null; __bw.world.setLevel(30); c.target.set(0,0,0); c.dist=190; c.polar=1.08; c.azim=0.95; return 1; })()"
$C click ".rp-open"
$C wait "!!document.querySelector('.rp-pick')" 60 | cut -c1-60
$C sleep 2; $C shot pick_new
$C click ".rp-card[data-k=elina]"
$C wait "!!(window.__rp && __rp.S.hero)" 120 | cut -c1-60
$C eval "(() => { __rp.pause(true); __rp.S.cool=99; __rp.cam('third'); __rp.setPos(30,20,-2.2); __rp.setLook(-2.2,0.2); __rp.setInput(0,0.75); __rp.sim(1.3); const b=document.querySelectorAll('.rp-b'); b[2].classList.add('on'); __rp.dodge(); return b.length; })()"
$C sleep 1; $C shot hud_new
echo DONE > /home/claude/work/rp1/seq6.done
