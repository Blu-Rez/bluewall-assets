import sys, os, json, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont
# TR2-S3-R2 job 2, step 2: numbers + contact sheets from the frames of dev/tr2_s3_lodstrip.py.
#   python3 dev/tr2_s3_lodstrip_post.py DIR      ->  DIR/lodstrip_report.json, DIR/lodstrip_report.md, DIR/sheet_*.png, DIR/diff_*.png
D = sys.argv[1]
J = json.load(open(f'{D}/lodstrip.json'))
NZ, NA = J['NZ'], J['NA']
def ld(name): return np.asarray(Image.open(f'{D}/{name}.png').convert('RGB')).astype(np.int16)
def mad(a, b): return float(np.abs(a - b).mean())                       # mean absolute difference over all channels, 0..255
def pct(a, b, t=16): return float((np.abs(a - b).max(axis=2) > t).mean() * 100)   # % of pixels where any channel changes by more than t (a visible change)
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
except Exception: FONT = ImageFont.load_default()
steps = {(s['pass'], s['i']): s for s in J['steps']}
rep = {'noise': None, 'z': {}, 'a': {}}
n0 = ld('zh_00'); nn = ld('zh_noise')
rep['noise'] = {'mad': round(mad(n0, nn), 3), 'pct16': round(pct(n0, nn), 3)}
def seq(tag_h, tag_l, nat_tags, n, key):
    H = [ld(f'{tag_h}_{i:02d}') for i in range(n)]; L = [ld(f'{tag_l}_{i:02d}') for i in range(n)]
    out = {'poses': n, 'lod_full': [], 'motion': [], 'nat': {}}
    for i in range(n):
        out['lod_full'].append({'i': i, 'mad': round(mad(H[i], L[i]), 3), 'pct16': round(pct(H[i], L[i]), 3)})   # the biggest LOD change possible at this pose (every cell hi -> lo)
    for i in range(n - 1):
        out['motion'].append({'i': i, 'mad': round(mad(H[i], H[i + 1]), 3), 'pct16': round(pct(H[i], H[i + 1]), 3)})   # one camera step with the full model everywhere
    for t in nat_tags:
        rows = []
        for i in [s['i'] for s in J['steps'] if s['pass'] == t]:       # in the order the poses were SHOT (zb goes from the far pose back to the near one), so 'before -> after' is real camera motion
            if not os.path.exists(f'{D}/{t}_{i:02d}.png'): continue
            N = ld(f'{t}_{i:02d}'); s = steps.get((t, i), {})
            rows.append({'i': i, 'flips': s.get('flips', []), 'hi': s.get('hi'), 'lo': s.get('lo'), 'err_mad': round(mad(N, H[i]), 3), 'err_pct16': round(pct(N, H[i]), 3)})   # natural frame vs the all-full reference at the same pose = what lo cells cost in the picture
        out['nat'][t] = rows
    return out
rep['z'] = seq('zh', 'zl', ['zf', 'zb'], NZ, 'z')
rep['a'] = seq('ah', 'al', ['af'], NA, 'a')
# pop = the jump of the natural frame's error between two consecutive steps (a cell flips), against the camera-step difference and the render noise
pops = []
for k in ('z', 'a'):
    for t, rows in rep[k]['nat'].items():
        order = [r['i'] for r in rows]
        for a, b in zip(rows, rows[1:]):
            if b['flips']:
                pops.append({'seq': k, 'pass': t, 'from': a['i'], 'to': b['i'], 'flips': b['flips'], 'err_before': a['err_mad'], 'err_after': b['err_mad'], 'jump_mad': round(abs(b['err_mad'] - a['err_mad']), 3),
                             'err_pct_before': a['err_pct16'], 'err_pct_after': b['err_pct16'], 'jump_pct': round(abs(b['err_pct16'] - a['err_pct16']), 3)})
rep['pops'] = pops
json.dump(rep, open(f'{D}/lodstrip_report.json', 'w'), indent=1)

# ---- contact sheets (natural passes) -------------------------------------------------------------
def sheet(tag, n, cols, title):
    tw, th = 320, 180; rows = (n + cols - 1) // cols
    im = Image.new('RGB', (cols * tw, rows * (th + 30) + 26), (20, 20, 24)); dr = ImageDraw.Draw(im); dr.text((6, 5), title, fill=(255, 255, 255), font=FONT)
    for i in range(n):
        f = f'{D}/{tag}_{i:02d}.png'
        if not os.path.exists(f): continue
        t = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS); x, y = (i % cols) * tw, 26 + (i // cols) * (th + 30)
        im.paste(t, (x, y + 30)); s = steps.get((tag, i))
        cap = f'{i:02d}'
        if s: cap += f'  hi {s["hi"]} lo {s["lo"]}' + (('  FLIP ' + ' '.join(s['flips'])) if s['flips'] else '')
        dr.text((x + 4, y + 8), cap[:60], fill=(255, 210, 90) if (s and s['flips']) else (200, 200, 200), font=FONT)
    im.save(f'{D}/sheet_{tag}.png')
sheet('zf', NZ, 4, 'Z zoom out, natural LOD (camera 70 -> 190 m)'); sheet('zb', NZ, 4, 'Z zoom in, natural LOD (190 -> 70 m)'); sheet('af', NA, 4, 'A arc along the town wall, natural LOD')

# ---- the diff heat map of the worst pose + the natural pair around the biggest jump --------------------
def heat(a, b, gain=6):
    d = np.clip(np.abs(a - b).max(axis=2) * gain, 0, 255).astype(np.uint8)
    return Image.fromarray(np.stack([d, d // 2, 255 - d], axis=2).astype(np.uint8))
for k, n in (('z', NZ), ('a', NA)):
    lf = rep[k]['lod_full']; w = max(lf, key=lambda r: r['mad'])['i']
    h, l = Image.open(f'{D}/{k}h_{w:02d}.png').convert('RGB'), Image.open(f'{D}/{k}l_{w:02d}.png').convert('RGB')
    hm = heat(np.asarray(h).astype(np.int16), np.asarray(l).astype(np.int16))
    W, H = h.size; im = Image.new('RGB', (W * 3 // 2, H // 2 * 2 + 40), (20, 20, 24)); dr = ImageDraw.Draw(im)
    dr.text((6, 6), f'{k.upper()} pose {w}: full model | lo model | |diff| x6 (blue = same, red = changed)   mad {lf[w]["mad"]}  changed>16: {lf[w]["pct16"]}%', fill=(255, 255, 255), font=FONT)
    for j, t in enumerate((h, l, hm)): im.paste(t.resize((W // 2, H // 2), Image.LANCZOS), (j * (W // 2), 34))
    im.paste(h.resize((W // 2, H // 2)), (0, 34 + H // 2)); im.save(f'{D}/diff_{k}.png')

# ---- the frames around every flip: natural before | natural after | after minus the all-full reference (x6) ------------------------
def pair_img(k, t, a, b):
    A, B = Image.open(f'{D}/{t}_{a:02d}.png').convert('RGB'), Image.open(f'{D}/{t}_{b:02d}.png').convert('RGB')
    ref = f'{D}/{k}h_{b:02d}.png'
    W, H = A.size; im = Image.new('RGB', (W * 3 // 2, H // 2 + 34), (20, 20, 24)); dr = ImageDraw.Draw(im)
    st = steps.get((t, b), {}); dr.text((6, 6), f'{t} step {a} -> {b}   flips: {" ".join(st.get("flips", []))}   (left: before, middle: after, right: |after - all-full| x6)', fill=(255, 255, 255), font=FONT)
    im.paste(A.resize((W // 2, H // 2), Image.LANCZOS), (0, 34)); im.paste(B.resize((W // 2, H // 2), Image.LANCZOS), (W // 2, 34))
    if os.path.exists(ref): im.paste(heat(np.asarray(B).astype(np.int16), np.asarray(Image.open(ref).convert('RGB')).astype(np.int16)).resize((W // 2, H // 2), Image.LANCZOS), (W, 34))
    im.save(f'{D}/pair_{t}_{a:02d}_{b:02d}.png')
for pp in pops[:8]:
    try: pair_img(pp['seq'], pp['pass'], pp['from'], pp['to'])
    except Exception as e: print('pair failed', pp['seq'], pp['pass'], pp['from'], pp['to'], e)

# ---- a short text report ---------------------------------------------------------------------------
L = []
L.append(f'render noise (same pose, two frames): mad {rep["noise"]["mad"]}, changed>16 {rep["noise"]["pct16"]} %')
for k, nm in (('z', 'Z zoom'), ('a', 'A arc')):
    r = rep[k]; mot = [m['mad'] for m in r['motion']]; lf = [m['mad'] for m in r['lod_full']]
    L.append(f'{nm}: one camera step = mad {min(mot):.2f}..{max(mot):.2f} (median {np.median(mot):.2f});  ALL cells full vs ALL cells lo at one pose = mad {min(lf):.2f}..{max(lf):.2f} (max {max(lf):.2f}), changed>16 up to {max(m["pct16"] for m in r["lod_full"]):.2f} %')
L.append('flips (natural passes):')
for p in pops: L.append(f'  {p["seq"]}/{p["pass"]} step {p["from"]}->{p["to"]}: {", ".join(p["flips"])};  error vs all-full {p["err_before"]} -> {p["err_after"]} (jump {p["jump_mad"]} mad, {p["jump_pct"]} % px)')
open(f'{D}/lodstrip_report.md', 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
