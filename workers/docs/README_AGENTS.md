# Dev harness for Blue Wall workstreams
- Start static servers: `bash /home/claude/dev/up.sh` (8777 = /home/claude/dev).
- Build YOUR bundle (never run client/build.sh — that is the integrator's):
  `bash /home/claude/dev/agent_build.sh <name>` -> /home/claude/dev/dev_<name>.html
- Screenshot: `PAGE=dev_<name>.html python3 /home/claude/dev/shot.py W H out.png QUALITY "<js after ready>" WAITSEC HOUR`
  e.g. `PAGE=dev_army.html python3 shot.py 390 844 a.png high "__cam(60,40,90, 0,2,30)" 40 12`
  env: WX=clear|rain|snow|storm|fog…  EXTRA="&s=2&sp=0.6" (season preview) "&wa=600" (keep welcome card up; default it auto-hides after 9 s)
  camera helpers (cam.js): __cam(px,py,pz, tx,ty,tz), __knight(i,dx,dy,dz), __look(materialName,dx,dy,dz), __follow(dx,dy,dz)
  Late models stream in after the first frame: wait ~40 s before screenshots of creatures.
- Eval JS: `PAGE=dev_<name>.html python3 /home/claude/dev/q.py "<expr>" WAITSEC` (q=low)
- Perf (swiftshader ms/frame + draw calls + tris): `PAGE=dev_<name>.html SLEEP=40 python3 /home/claude/dev/perf.py high`
- window.__bw = { THREE, scene, camera, ctl, world, renderer, ui, Q, settings, audio, t, frames, pause(v), P() }
