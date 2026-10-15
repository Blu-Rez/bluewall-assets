#!/usr/bin/env python3
"""AU1: five calm music tracks, SYNTHESIZED from nothing (numpy + scipy; every sample is computed here, nothing is sampled, nothing is copied from anyone's music) -> licence-safe.
Instruments are plain physical models: a harp-like pluck (decaying partials, higher ones die faster), warm string pad (detuned saws through a low-pass), a flute (sine + 2 weak
harmonics + breath noise + delayed vibrato), a low "cello" (one saw voice, vibrato), a soft bell (three decaying sine partials). A noise-built stereo reverb (RT60 3-4 s) joins them.
Every melody is written note by note below, diatonic and on chord tones, so nothing can clash. Each track is mastered to its own loudness target (LUFS) and encoded as
64 kbps (or the highest multiple of 8 that keeps the file under 392 KB) joint-stereo 32 kHz mp3 (<= 400 KB each).

usage:  au1_music.py [--out DIR] [--only dawn,meadow,...] [--wav DIR] [--png DIR]
"""
import numpy as np, scipy.signal as sg, scipy.io.wavfile as wf, subprocess, os, sys, re, json, argparse, tempfile

SR = 44100


def hz(m): return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69.0) / 12.0)
def tt(d): return np.arange(int(round(d * SR))) / SR
def lp(x, fc, order=2): return sg.sosfilt(sg.butter(order, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return sg.sosfilt(sg.butter(order, fc, 'high', fs=SR, output='sos'), x)
def bp(x, f0, f1, order=2): return sg.sosfilt(sg.butter(order, [f0, f1], 'band', fs=SR, output='sos'), x)


def swell(n, a, r):
    """raised-cosine attack of a seconds and release of r seconds on n samples (never a click)"""
    e = np.ones(n); na = min(int(a * SR), n // 2); nr = min(int(r * SR), n // 2)
    if na > 0: e[:na] = 0.5 - 0.5 * np.cos(np.pi * np.arange(na) / na)
    if nr > 0: e[n - nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)
    return e


# ------------------------------------------------------------------ instruments (all return mono float arrays)
def pluck(m, dur=3.2, vel=0.7):
    """harp / lute: partials k = 1..10 with 1/k^1.15 weights, the upper ones decay faster, a trace of string stiffness (stretched partials)"""
    f = float(hz(m)); t = tt(dur); y = np.zeros_like(t); tau = 2.6 * (330.0 / f) ** 0.2
    for k in range(1, 11):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > 6500: break
        y += (1.0 / k ** 1.35) * (1.0 if k % 2 else 0.85) * np.sin(2 * np.pi * fk * t) * np.exp(-t / (tau / (0.55 + 0.45 * k)))
    y *= np.minimum(1.0, t / 0.004) * np.minimum(1.0, (dur - t) / 0.15)
    return lp(y, 3200) * vel


def padchord(ms, dur, vel=0.5, att=1.4, rel=1.8, cut=1700, det=((-9, 2, 11), (-11, -2, 8)), seed=0):
    """warm string pad for a whole chord: per note 3 detuned saws per channel (L and R detune differently = width), summed, one low-pass, slow swell. returns (L, R)"""
    rng = np.random.default_rng(seed); n = int(dur * SR); t = np.arange(n) / SR; out = []
    for ch in range(2):
        y = np.zeros(n)
        for m in ms:
            for c in det[ch]:
                y += sg.sawtooth(2 * np.pi * float(hz(m)) * (1 + c / 1200.0) * t + rng.uniform(0, 2 * np.pi))
        y *= swell(n, att, rel) * (1 + 0.07 * np.sin(2 * np.pi * (0.11 + 0.04 * ch) * t + rng.uniform(0, 6.28)))
        out.append(lp(y, cut) * vel / (len(ms) * 3.0))
    return out[0], out[1]


def strings_line(m, dur, vel=0.5, cut=1250, att=0.16, rel=0.35):
    """one bowed note (cello-ish): two detuned saws with vibrato that blooms after 0.3 s"""
    f = float(hz(m)); n = int(dur * SR); t = np.arange(n) / SR
    vib = 0.0042 * np.clip((t - 0.3) / 0.5, 0, 1) * np.sin(2 * np.pi * 5.0 * t)
    ph = 2 * np.pi * np.cumsum(f * (1 + vib)) / SR
    y = sg.sawtooth(ph) + 0.8 * sg.sawtooth(ph * 1.0035 + 1.3)
    return lp(y, cut, 3) * swell(n, att, rel) * vel * 0.5


def flute(m, dur, vel=0.5, seed=0):
    f = float(hz(m)); n = int(dur * SR); t = np.arange(n) / SR; rng = np.random.default_rng(seed + int(m * 7))
    vib = 0.0045 * np.clip((t - 0.25) / 0.4, 0, 1) * np.sin(2 * np.pi * 5.1 * t)
    ph = 2 * np.pi * np.cumsum(f * (1 + vib)) / SR
    y = np.sin(ph) + 0.20 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    breath = bp(rng.standard_normal(n), min(f * 1.6, 9000), min(f * 4.5, 12000)) * 0.045
    env = swell(n, 0.07, 0.2) * (1 + 0.06 * np.sin(2 * np.pi * 0.8 * t))
    return (y + breath) * env * vel * 0.6


def bell(m, dur=4.0, vel=0.5):
    """soft celesta / glass bell in the low register: three sine partials (1, 2, 3) that die at different speeds"""
    f = float(hz(m)); t = tt(dur); y = np.zeros_like(t)
    for k, a, tau in ((1, 1.0, 2.6), (2.0, 0.22, 1.5), (3.0, 0.07, 0.8)):
        y += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / tau)
    y *= np.minimum(1.0, t / 0.006) * np.minimum(1.0, (dur - t) / 0.3)
    return y * vel


# ------------------------------------------------------------------ the score container, reverb, mastering
class Score:
    def __init__(self, bpm, bars, beats=4, tail=3.0, seed=1):
        self.spb = 60.0 / bpm; self.beats = beats; self.bars = bars; self.body = bars * beats * self.spb
        n = int((self.body + tail) * SR); self.n = n
        self.L = np.zeros(n); self.R = np.zeros(n); self.S = np.zeros(n); self.rng = np.random.default_rng(seed)

    def at(self, bar, beat=0.0): return (bar * self.beats + beat) * self.spb

    def _add(self, buf, sig, i):
        n = min(len(sig), self.n - i)
        if n > 0: buf[i:i + n] += sig[:n]

    def put(self, sig, t0, pan=0.0, gain=1.0, send=0.3, jitter=0.012):
        t0 = max(0.0, t0 + self.rng.uniform(-jitter, jitter)) if jitter else t0
        i = int(t0 * SR); g = gain * self.rng.uniform(0.92, 1.08) if jitter else gain
        self._add(self.L, sig * g * np.cos((pan + 1) * np.pi / 4), i); self._add(self.R, sig * g * np.sin((pan + 1) * np.pi / 4), i); self._add(self.S, sig * g * send, i)

    def put2(self, L, R, t0, gain=1.0, send=0.25):
        i = int(t0 * SR); self._add(self.L, L * gain, i); self._add(self.R, R * gain, i); self._add(self.S, (L + R) * 0.5 * gain * send, i)


def make_ir(rt60, pre=0.03, lpf=3600, seed=11):
    n = int(rt60 * 1.15 * SR); r = np.random.default_rng(seed); ir = np.zeros((2, n)); p = int(pre * SR)
    for ch in range(2):
        x = r.standard_normal(n) * np.exp(-6.9 * np.arange(n) / (rt60 * SR))
        x = lp(x, lpf); x = lp(x, 2200) * np.linspace(0, 1, n) ** 0.0       # a second, darker pole: the tail is warm
        ir[ch, p:] = x[:n - p]
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def lufs(y):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'm.wav'); wf.write(p, SR, y.astype(np.float32))
        r = subprocess.run(['ffmpeg', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]), float(re.findall(r'LRA:\s+([\d.]+) LU', r)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])


def master(sc, wet, rt60, target, name, lowcut=45, highcut=7000):
    ir = make_ir(rt60); n = sc.n
    wl = sg.fftconvolve(sc.S, ir[0])[:n]; wr = sg.fftconvolve(sc.S, ir[1])[:n]
    L = sc.L + wet * wl; R = sc.R + wet * wr
    y = np.stack([lp(hp(L, lowcut), highcut), lp(hp(R, lowcut), highcut)], 1)
    i = np.arange(n); fi = 0.5 - 0.5 * np.cos(np.pi * np.minimum(1.0, i / (0.5 * SR))); fo = 0.5 - 0.5 * np.cos(np.pi * np.minimum(1.0, (n - i) / (2.0 * SR)))
    y *= (fi * fo)[:, None]                                                  # 0.5 s fade-in, 2 s fade-out: no click at either end
    for _ in range(2):                                                    # land on the loudness target, then keep the peaks under -1.5 dBFS with a soft knee
        I, LRA, TP = lufs(y); y = y * 10 ** ((target - I) / 20.0)
        c = 0.84; y = c * np.tanh(y / c)
    I, LRA, TP = lufs(y)
    return y, dict(name=name, lufs=round(I, 1), lra=round(LRA, 1), tp=round(TP, 1), dur=round(n / SR, 1))


# ------------------------------------------------------------------ the five tracks
def N(name):
    return {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[name[0]] + (1 if '#' in name else 0) + 12 * (int(name[-1]) + 1)


def pad_bars(sc, chords, cut, vel, att=1.4, rel=1.8, extra=1.2, seed=0, send=0.25):
    for b, ms in enumerate(chords):
        L, R = padchord(ms, sc.beats * sc.spb + extra, vel, att, rel, cut, seed=seed + b)
        sc.put2(L, R, sc.at(b), 1.0, send)


def track_dawn(sc_only=False):
    """DAWN  (D major, 64 bpm): harp arpeggios over a string pad; the flute joins at bar 5.  ~48 s"""
    sc = Score(64, 12, 4, 3.0, seed=3)
    ch = [[50, 57, 61, 64, 66], [47, 54, 57, 62, 66], [43, 50, 54, 59, 62], [45, 52, 61, 64, 71]]
    seq = [0, 1, 2, 3, 0, 1, 2, 3, 0, 2, 3, 0]
    chords = [ch[i] for i in seq]
    pad_bars(sc, chords, 1700, 0.55, seed=10)
    for b, ms in enumerate(chords):
        sc.put(pluck(ms[0], 4.0, 0.55), sc.at(b), 0.0, 1.0, 0.2)                              # bass note on the bar
        up = [m + 12 for m in ms]
        for i, k in enumerate([0, 1, 2, 3, 2, 1, 3, 2]):
            sc.put(pluck(up[k], 3.2, 0.5 if i % 4 else 0.58), sc.at(b, i * 0.5), -0.3 if i % 2 else 0.3, 1.0, 0.5)
    mel = [(4, 0, 2, 81), (4, 2, 2, 78), (5, 0, 3, 74), (5, 3, 1, 76), (6, 0, 2, 74), (6, 2, 2, 71), (7, 0, 3, 73), (7, 3, 1, 76),
           (8, 0, 2, 78), (8, 2, 2, 81), (9, 0, 2, 79), (9, 2, 2, 74), (10, 0, 2, 76), (10, 2, 2, 73), (11, 0, 6, 74)]
    for b, bt, d, m in mel: sc.put(flute(m, d * sc.spb + 0.25, 0.52), sc.at(b, bt), 0.15, 1.0, 0.6, 0.006)
    return master(sc, 0.55, 3.4, -19.0, 'dawn')


def track_meadow():
    """MEADOW  (C major, 66 bpm, 3/4 lullaby): rolling harp arpeggio, pad, a flute tune.  ~49 s"""
    sc = Score(66, 17, 3, 2.6, seed=5)
    ch = {'C': [48, 55, 60, 64, 67], 'Am': [45, 52, 57, 60, 64], 'F': [41, 53, 57, 60, 65], 'G': [43, 50, 55, 59, 62]}
    seq = ['C', 'Am', 'F', 'G'] * 4 + ['C']
    chords = [ch[c] for c in seq]
    pad_bars(sc, chords, 1600, 0.5, att=1.2, rel=1.6, extra=0.8, seed=30)
    for b, ms in enumerate(chords):
        pat = [ms[0] + (12 if ms[0] < 45 else 0), ms[1] + 12, ms[2] + 12, ms[3] + 12, ms[2] + 12, ms[1] + 12]
        for i, m in enumerate(pat):
            sc.put(pluck(m, 3.0, 0.62 if i == 0 else 0.46), sc.at(b, i * 0.5), -0.28 if i % 2 else 0.28, 1.0, 0.5)
    mel = [(4, 0, 2, 76), (4, 2, 1, 79), (5, 0, 2, 81), (5, 2, 1, 79), (6, 0, 2, 72), (6, 2, 1, 69), (7, 0, 2, 71), (7, 2, 1, 74),
           (8, 0, 2, 79), (8, 2, 1, 76), (9, 0, 2, 81), (9, 2, 1, 76), (10, 0, 2, 77), (10, 2, 1, 81), (11, 0, 1.5, 79), (11, 1.5, 1.5, 74),
           (12, 0, 1, 76), (12, 1, 1, 79), (12, 2, 1, 84), (13, 0, 3, 81), (14, 0, 1.5, 81), (14, 1.5, 0.5, 79), (14, 2, 1, 77), (15, 0, 2, 74), (15, 2, 1, 71), (16, 0, 5, 72)]
    for b, bt, d, m in mel: sc.put(flute(m, d * sc.spb + 0.25, 0.5, seed=2), sc.at(b, bt), 0.12, 1.0, 0.6, 0.006)
    return master(sc, 0.55, 3.2, -19.0, 'meadow')


def track_hearth():
    """HEARTH  (A minor, 54 bpm): a slow lute, a dark pad and one low string voice singing a long line.  ~47 s"""
    sc = Score(54, 10, 4, 3.0, seed=7)
    ch = {'Am': [45, 52, 57, 60, 64], 'F': [41, 48, 53, 57, 60], 'C': [48, 55, 60, 64, 67], 'G': [43, 50, 55, 59, 62]}
    seq = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F']
    chords = [ch[c] for c in seq]
    pad_bars(sc, chords, 1150, 0.62, att=1.8, rel=2.2, extra=1.5, seed=50)
    for b, ms in enumerate(chords):
        for i, m in enumerate([ms[0], ms[2] + 12, ms[3] + 12, ms[4] + 12]):
            sc.put(pluck(m, 3.6, 0.55 if i == 0 else 0.42), sc.at(b, i), -0.2 if i % 2 else 0.2, 1.0, 0.4)
    mel = [(2, 0, 3, 67), (2, 3, 1, 64), (3, 0, 2, 62), (3, 2, 2, 59), (4, 0, 2, 60), (4, 2, 2, 64), (5, 0, 1, 57), (5, 1, 1, 60), (5, 2, 2, 65),
           (6, 0, 3, 64), (6, 3, 1, 67), (7, 0, 3, 62), (7, 3, 1, 59), (8, 0, 4, 57), (9, 0, 2, 60), (9, 2, 3.5, 57)]
    for b, bt, d, m in mel: sc.put(strings_line(m, d * sc.spb + 0.4, 0.62), sc.at(b, bt), -0.1, 1.0, 0.45, 0.01)
    return master(sc, 0.5, 3.6, -21.0, 'hearth')


def track_moon():
    """MOON  (E minor, 46 bpm): a very slow, very quiet pad with a few soft bells.  ~47 s"""
    sc = Score(46, 9, 4, 3.5, seed=9)
    ch = {'Em': [40, 47, 52, 55, 59], 'C': [48, 52, 55, 59, 64], 'G': [43, 50, 55, 59, 62], 'D': [50, 54, 57, 62, 66]}
    seq = ['Em', 'Em', 'C', 'C', 'G', 'G', 'D', 'D', 'Em']
    for b, c in enumerate(seq):
        if b % 2 == 0 or b == 8:
            L, R = padchord(ch[c], 2 * sc.beats * sc.spb + 2.6 if b < 8 else sc.beats * sc.spb + 3.0, 0.7, 2.6, 3.2, 950, seed=70 + b)
            sc.put2(L, R, sc.at(b), 1.0, 0.3)
    notes = [(1, 2.0, 71), (2, 1.0, 64), (3, 2.5, 67), (4, 1.5, 74), (5, 0.5, 71), (5, 3.0, 67), (6, 2.0, 66), (7, 1.0, 69), (7, 3.0, 62), (8, 1.0, 71)]
    for b, bt, m in notes: sc.put(bell(m, 4.5, 0.5), sc.at(b, bt), 0.25 if m % 2 else -0.25, 1.0, 0.7, 0.02)
    return master(sc, 0.62, 3.9, -24.0, 'moon')


def track_river():
    """RIVER  (G major, 80 bpm): a running harp, a pad, a flute with a lilting tune.  ~50 s"""
    sc = Score(80, 16, 4, 2.6, seed=13)
    ch = {'G': [43, 50, 55, 59, 62], 'Em': [40, 47, 55, 59, 62], 'C': [48, 55, 60, 64, 67], 'D': [50, 57, 62, 66, 69]}
    seq = ['G', 'Em', 'C', 'D'] * 3 + ['G', 'C', 'D', 'G']
    chords = [ch[c] for c in seq]
    pad_bars(sc, chords, 1650, 0.5, att=1.1, rel=1.5, extra=1.0, seed=90)
    for b, ms in enumerate(chords):
        sc.put(pluck(ms[0], 3.5, 0.5), sc.at(b), 0.0, 1.0, 0.2)
        up = [m + 12 for m in ms]
        for i, k in enumerate([1, 2, 3, 2, 4, 3, 2, 3]):
            sc.put(pluck(up[k], 2.6, 0.4 if i % 2 else 0.48), sc.at(b, i * 0.5), -0.32 if i % 2 else 0.32, 1.0, 0.5)
    mel = [(4, 0, 2, 74), (4, 2, 1, 71), (4, 3, 1, 74), (5, 0, 2, 76), (5, 2, 2, 79), (6, 0, 2, 76), (6, 2, 2, 72), (7, 0, 2, 69), (7, 2, 2, 78),
           (8, 0, 2, 79), (8, 2, 2, 74), (9, 0, 2, 71), (9, 2, 2, 76), (10, 0, 3, 79), (10, 3, 1, 76), (11, 0, 2, 78), (11, 2, 2, 74),
           (12, 0, 1, 74), (12, 1, 3, 79), (13, 0, 1, 72), (13, 1, 1, 76), (13, 2, 2, 79), (14, 0, 2, 78), (14, 2, 2, 81), (15, 0, 6, 79)]
    for b, bt, d, m in mel: sc.put(flute(m, d * sc.spb + 0.25, 0.5, seed=4), sc.at(b, bt), 0.14, 1.0, 0.6, 0.006)
    return master(sc, 0.55, 3.2, -19.0, 'river')


TRACKS = {'dawn': (track_dawn, 'mus_calm_dawn'), 'meadow': (track_meadow, 'mus_calm_meadow'), 'river': (track_river, 'mus_calm_river'),
          'hearth': (track_hearth, 'mus_calm_hearth'), 'moon': (track_moon, 'mus_calm_moon')}


def encode(y, path, kbps=64):
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, 't.wav'); wf.write(w, SR, y.astype(np.float32))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-ar', '32000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', f'{kbps}k', '-joint_stereo', '1', '-metadata', 'comment=AU1 synthesized', path], check=True)
    return os.path.getsize(path)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default='.'); ap.add_argument('--only', default=''); ap.add_argument('--wav', default=''); ap.add_argument('--png', default='')
    a = ap.parse_args(); names = a.only.split(',') if a.only else list(TRACKS)
    rep = {}
    for k in names:
        fn, fname = TRACKS[k]; y, info = fn(); size = encode(y, os.path.join(a.out, fname + '.mp3'), 64 if info['dur'] * 8000 <= 392000 else int(392000 * 8 / info['dur'] / 1000 // 8 * 8)); info['file'] = fname + '.mp3'; info['bytes'] = size; rep[k] = info
        if a.wav: wf.write(os.path.join(a.wav, fname + '.wav'), SR, y.astype(np.float32))
        if a.png:
            import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
            fig, ax = plt.subplots(1, 1, figsize=(13, 4)); ax.specgram(y.mean(1), NFFT=4096, Fs=SR, noverlap=3072, cmap='magma', vmin=-130, vmax=-40); ax.set_ylim(0, 8000); ax.set_title(f'{fname}  {info["dur"]}s  {info["lufs"]} LUFS')
            plt.tight_layout(); plt.savefig(os.path.join(a.png, fname + '.png'), dpi=60); plt.close(fig)
        print(json.dumps(info), flush=True)
    print('total bytes', sum(v['bytes'] for v in rep.values()))


if __name__ == '__main__':
    main()
