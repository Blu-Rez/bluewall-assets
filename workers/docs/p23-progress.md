# Blue Wall — package p23 (4 Oct 2026, morning) — loader made light (GPU-memory fix)

Only `bluewall/web/index.html` changes (no server / bot / client-bundle change). Same look (A/B screenshots at 390×844, 844×390, 360×640 identical to the eye).

## Cause (measured, `scratchpad/layers.py` = CDP LayerTree at dpr 3.28 on the real loader)
p22 loader = **57 composited layers ≈ 123 Mpx** (screen = 3.5 Mpx → 35 screens ≈ 470 MB at 4 B/px): 3 star fields as box-shadow layers (35 Mpx), god rays (26 Mpx), two cloud strips (14 Mpx), snow sheet (6 Mpx), 3 plate-size torch layers (11 Mpx), 2 full-screen gradient layers (7 Mpx), masked 520 px conic halo ×2 (6 Mpx) … Android's tile budget was blown while the three.js game booted → tiles dropped (video).

## Fix (all in `web/index.html`)
- stars, moon halo, rays, clouds, far plate, back mist = **static** (painted into the root layer, no GPU layer); 12 tiny twinkling stars (kept clear of the moon) replace the animated fields.
- snow = 34 tiny flakes (was one 468×1264 sheet); torches = one tiny layer each (was 3 plate-size layers); drake + emissive plate above the near plate so the near plate needs no layer.
- bottom shade + vignette = ONE half-res canvas (was 2 full-screen layers); halo rays/glow = low-res canvases rotated by the compositor (400² px instead of 520 css-px masked layers); dragon = one image with the union clip (wing split was only for the disabled flap).
- Result: **≈ 12 Mpx counted by the same tool (≈ 5 Mpx belong to the loader itself; the rest = `#game` + root)**, i.e. ≈ 10× less.

## Not verified
Real-phone behaviour (the sandbox compositor does not reproduce the tile loss, even with `--force-gpu-mem-available-mb`). Ask the owner to look at the loader once and send a new recording if anything still vanishes — then next step = also hide `#game` (`visibility:hidden`) until `ready` and cut the dragon/title filters.
