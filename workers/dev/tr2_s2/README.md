# dev/tr2_s2 — browser proof for the Tripo loader (S2): destruct hook, programs, texture memory, tier sweep
Software GL (SwiftShader) — NOT a phone number. One browser job at a time.
```
bash dev/tr2_s2/make_root.sh            # builds /tmp/tr2_root (symlinks: three, src = client/src, s2assets/tr2 = swap.json + the 45 castle GLBs from the lib-tripo clone)
cd /tmp/tr2_root && (setsid python3 -m http.server 8777 >/dev/null 2>&1 &) ; sleep 1
python3 /tmp/tr2_root/s2.py destruct  out_destruct.png     # 8 frames: intact, damage, collapse 0.12 .. 1.0 on a baked Tripo wall row + 2 towers (aB = target 1)
python3 /tmp/tr2_root/s2.py progs     out_progs.png        # programs / GPU textures: 1 vs 12 Tripo models, patched vs not, instanced
python3 /tmp/tr2_root/s2.py tiers     out_tiers.png        # cap 50 sweep 1..50: pieceTier per slot, lazy load, resident textures; sheet of 10 levels
```
Each run prints `window.__res` as JSON (also saved next to the png). Needs `/home/claude/lib` = clone of branch `lib-tripo` (override: `LIB=...`).
