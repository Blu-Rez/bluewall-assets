#!/usr/bin/env python3
"""AU1: spectrum tools for the "mosquito ding" hunt.

A sound is a *pure-tone offender* when a narrow spectral line above PURE_HZ (1.8 kHz) stands >= PROM_DB out of the broadband floor around it AND is
louder than LIMIT_DBFS (-24 dBFS) at the loudest level the game plays it.  `analyse(x, sr)` works on a mono float array (full scale = 1.0).

CLI:  python3 au1_spectrum.py mp3 <file.mp3> [gain_db]      one decoded mp3 file
      python3 au1_spectrum.py table                         every sfx_*.mp3 at its loudest in-game level (info table)
"""
import subprocess, sys, os, json
import numpy as np

PURE_HZ = 1800.0      # only tones above this count (the mosquito band)
LIMIT_DBFS = -24.0    # a pure tone above this level is an offender
PROM_DB = 18.0        # how far a line must stand above the floor around it to be called "pure"
SUSTAIN_S = 0.12      # a *ding* holds its pitch: the line must stay within +-2 bins for this long (a voice's gliding harmonics do not)
NFFT, HOP = 2048, 512

AUDIO_DIR = os.environ.get('AU1_AUDIO_DIR', '/home/claude/bot/bluebot_v2/bluewall/web/assets/audio')

# the loudest `vol` the game ever gives each file (audio.js play(...) calls; the bus sliders default to 1 and only lower it)
# default loudest levels (kept equal to ONESHOT_MAX in client/src/audio.js; au1_test.sh passes the real table exported from audio.js with --max-vol)
MAXVOL = {'sfx_bell': 0.55, 'sfx_rooster': 0.5, 'sfx_owl': 0.35, 'sfx_anvil': 0.3, 'sfx_click': 0.5, 'sfx_bark': 0.56, 'sfx_moo': 0.7,
          'sfx_neigh': 0.7, 'sfx_neigh2': 0.7, 'sfx_roar': 0.9, 'sfx_flap': 0.6, 'sfx_thunder1': 1.0, 'sfx_thunder2': 1.0, 'sfx_thunder3': 1.0, 'sfx_thunder4': 1.0}


def decode_mp3(path, sr=44100):
    """ffmpeg -> mono float32 at `sr`"""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64), sr


def stft_mag(x, sr, nfft=NFFT, hop=HOP):
    """sine-amplitude spectrogram: a full-scale sine shows as 1.0 (0 dBFS).  shape (frames, nfft/2+1)"""
    w = np.hanning(nfft)
    if len(x) < nfft: x = np.pad(x, (0, nfft - len(x)))
    n = 1 + (len(x) - nfft) // hop
    idx = np.arange(nfft)[None, :] + hop * np.arange(n)[:, None]
    X = np.fft.rfft(x[idx] * w[None, :], axis=1)
    return np.abs(X) * 2.0 / w.sum()


def analyse(x, sr, gain_db=0.0, pure_hz=PURE_HZ, prom_db=PROM_DB, sustain_s=SUSTAIN_S):
    """-> dict(peak_dbfs, dur_s, centroid_hz, bands, strict_*, pure_*, offender)
    strict_* = the loudest narrow line above pure_hz in ANY single frame (information only);
    pure_*   = the loudest line that also HOLDS its pitch for sustain_s (this is what makes a "ding"); offender = pure_dbfs > LIMIT_DBFS."""
    g = 10 ** (gain_db / 20.0)
    x = x * g
    M = stft_mag(x, sr)
    nb = M.shape[1]; df = sr / NFFT; hop_s = HOP / sr
    lo = int(pure_hz / df)
    L = 20 * np.log10(M + 1e-12)
    span = int(400 / df)                      # +-400 Hz neighbourhood for the floor
    guard = 4                                 # bins around the line left out of the floor
    strict = None; tracks = []; active = {}   # active: id -> [k, start, last, maxlev, maxk]
    nid = 0
    for fr in range(M.shape[0]):
        row = M[fr]; cands = []
        if row.max() >= 10 ** (-70 / 20):
            seg = row[lo:nb - 1]
            for k in np.where((seg > row[lo - 1:nb - 2]) & (seg >= row[lo + 1:nb]))[0] + lo:
                lev = L[fr, k]
                if lev < -70: continue
                a_, b_ = max(0, k - span), min(nb, k + span + 1)
                nbhd = np.r_[row[a_:max(a_, k - guard)], row[k + guard + 1:b_]]
                if len(nbhd) < 8: continue
                prom = lev - 20 * np.log10(np.sqrt(np.mean(nbhd ** 2)) + 1e-12)
                if prom >= prom_db:
                    cands.append((k, lev, prom))
                    if strict is None or lev > strict[1]: strict = (k * df, lev, prom)
        used = set()
        for tid, t in list(active.items()):
            if t[2] < fr - 2: tracks.append(t); del active[tid]            # lost for more than one frame
        for (k, lev, prom) in sorted(cands, key=lambda c: -c[1]):
            hit = None
            for tid, t in active.items():
                if tid not in used and abs(t[0] - k) <= 2: hit = tid; break
            if hit is None: nid += 1; hit = nid; active[hit] = [k, fr, fr, lev, k, prom]
            t = active[hit]; used.add(hit); t[0] = k; t[2] = fr
            if lev > t[3]: t[3] = lev; t[4] = k; t[5] = prom
    tracks += list(active.values())
    best = None
    for t in tracks:
        dur = (t[2] - t[1]) * hop_s + NFFT / sr * 0.5
        if dur >= sustain_s and (best is None or t[3] > best[1]): best = (t[4] * df, t[3], t[5], dur)
    pk = float(np.max(np.abs(x))) if len(x) else 0.0
    env = np.abs(x) > 10 ** (-60 / 20)
    dur = float(np.max(np.where(env)[0]) / sr) if env.any() else 0.0
    P = (M ** 2).sum(0) + 1e-18
    freqs = np.arange(nb) * df
    out = dict(peak_dbfs=round(20 * np.log10(pk + 1e-12), 1), dur_s=round(dur, 2), centroid_hz=int((P * freqs).sum() / P.sum()),
               strict_hz=None if strict is None else int(round(strict[0])), strict_dbfs=None if strict is None else round(float(strict[1]), 1),
               pure_hz=None if best is None else int(round(best[0])), pure_dbfs=None if best is None else round(float(best[1]), 1),
               pure_prom_db=None if best is None else round(float(best[2]), 1), pure_hold_s=None if best is None else round(float(best[3]), 2))
    out['offender'] = bool(best is not None and best[1] > LIMIT_DBFS)
    tot = P.sum()
    def band(f0, f1): return round(float(10 * np.log10(P[(freqs >= f0) & (freqs < f1)].sum() / tot + 1e-12)), 1)
    out['bands'] = {'<400': band(0, 400), '400-1.8k': band(400, 1800), '1.8-4k': band(1800, 4000), '>4k': band(4000, 1e9)}
    return out


def fmt(name, r):
    pure = '-' if r['pure_hz'] is None else f"{r['pure_hz']} Hz @ {r['pure_dbfs']} dBFS (+{r['pure_prom_db']} dB, holds {r['pure_hold_s']}s)"
    st = '' if r['strict_hz'] is None else f"  [any-frame line {r['strict_hz']} Hz @ {r['strict_dbfs']}]"
    return f"{name:<24} peak {r['peak_dbfs']:>6} dBFS {r['dur_s']:>5.2f}s ctr {r['centroid_hz']:>5} Hz  sustained>1.8k: {pure}{st}{'   <== OFFENDER' if r['offender'] else ''}"


def table(files=None, levels=None):
    res = {}
    names = files or sorted(f[:-4] for f in os.listdir(AUDIO_DIR) if f.startswith('sfx_') and f.endswith('.mp3'))
    for n in names:
        x, sr = decode_mp3(os.path.join(AUDIO_DIR, n + '.mp3'))
        vol = (levels or MAXVOL).get(n, 1.0)
        r = analyse(x, sr, 20 * np.log10(vol)); r['vol'] = vol; res[n] = r
    return res


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'mp3':
        x, sr = decode_mp3(sys.argv[2]); r = analyse(x, sr, float(sys.argv[3]) if len(sys.argv) > 3 else 0.0); print(fmt(os.path.basename(sys.argv[2]), r))
    else:
        for n, r in table().items(): print(fmt(n + f' (vol {r["vol"]})', r))
