import sys, io, json, base64
import numpy as np
from PIL import Image
D = '/home/claude/dev/s35/port'
GHOST = {'imp', 'spear', 'sword', 'guard', 'archer', 'hill', 'shieldmaiden', 'cavalry', 'axerider', 'lord', 'legionary', 'captain', 'ogre', 'lich', 'treant', 'gryphonknight'}   # a faint second copy of the soldier (a spawn-fade ghost) sits beside the figure: cut everything below 0.75 alpha
def alpha_from_pair(k, w, ghost=False):
    kf = np.asarray(k.convert('RGB'), dtype=np.float32); wf = np.asarray(w.convert('RGB'), dtype=np.float32)
    a = 1.0 - np.clip((wf - kf).mean(axis=2) / 255.0, 0, 1)
    a = np.clip((a - 0.02) / 0.96, 0, 1)
    if ghost: a = np.clip((a - 0.72) / 0.2, 0, 1)
    F = np.where(a[..., None] > 0.01, kf / np.maximum(a[..., None], 0.01), 0.0)
    return np.clip(F, 0, 255), a
def make(t, size=192):
    k = Image.open(f'{D}/shots/{t}_k.png'); w = Image.open(f'{D}/shots/{t}_w.png')
    F, a = alpha_from_pair(k, w, t in GHOST)
    rgba = np.dstack([F, a * 255.0]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    return im.resize((size, size), Image.LANCZOS)
if __name__ == '__main__':
    out = {}
    for t in sys.argv[1:]:
        im = make(t); im.save(f'{D}/shots/{t}_a.png')
        b = io.BytesIO(); im.save(b, 'WEBP', quality=84, method=6); out[t] = base64.b64encode(b.getvalue()).decode(); print(t, len(b.getvalue()))
    json.dump(out, open(f'{D}/port3_part.json', 'w'))
