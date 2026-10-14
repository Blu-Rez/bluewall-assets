#!/bin/bash
# proof frames, part 1 (home map): walking, wall, first person, jump, dodge, door
cd /home/claude/dev; C="python3 rp1c.py"
$C eval "(async () => { const h = await __rpLoad('?v=4'); await h.start('elina'); __rp.pause(true); __rp.S.cool=99; __rp.setPos(30,20,-2.2); __rp.setInput(0,0.75); __rp.sim(1.3); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_third_walk
# wall: stand 1.3 m inside the outer wall, facing away from it (camera behind = in the wall)
$C eval "(() => { const S=__rp.S, b=S.boxes.find(b=>b.type==='wall'&&b.id===1); const nx=-b.vx*Math.sign(b.vx*(0-b.x)+b.vz*(0-b.z)||1), nz=-b.vz*Math.sign(b.vx*(0-b.x)+b.vz*(0-b.z)||1); const px=b.x+(-nx)*0, pz=b.z; const sgn=Math.sign((0-b.x)*b.vx+(0-b.z)*b.vz)||1; const ox=b.vx*sgn, oz=b.vz*sgn; const x=b.x+ox*(b.hd+1.3), z=b.z+oz*(b.hd+1.3); __rp.setInput(0,0); __rp.setPos(x,z,Math.atan2(ox,oz)); __rp.sim(0.6); return JSON.stringify([__rp.pos(), 'wall', b.x,b.z]); })()"
$C sleep 1; $C shot f_third_wall
$C eval "(() => { __rp.cam('first'); __rp.setPos(30,20,-2.2); __rp.setLook(-2.2,1.05); __rp.setInput(0,0); __rp.sim(0.5); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_first_down
$C eval "(() => { __rp.cam('third'); __rp.setPos(30,20,-2.2); __rp.setLook(-2.2,0.2); __rp.setInput(0,0.9); __rp.sim(0.6); __rp.jump(); __rp.sim(0.3); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_jump
$C eval "(() => { __rp.setPos(30,20,-2.2); __rp.setInput(0,0); __rp.sim(0.4); __rp.dodge(); __rp.setInput(0,0.9); __rp.sim(0.32); return JSON.stringify(__rp.pos()); })()"
$C sleep 1; $C shot f_dodge
$C eval "(() => { const d=__rp.door(); __rp.setInput(0,0); __rp.setPos(d.x+d.nx*7,d.z+d.nz*7,Math.atan2(-d.nx,-d.nz)); __rp.setLook(Math.atan2(-d.nx,-d.nz)+0.5,0.22); __rp.sim(0.6); return JSON.stringify([__rp.pos(), d]); })()"
$C sleep 1; $C shot f_door
