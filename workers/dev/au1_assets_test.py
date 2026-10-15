#!/usr/bin/env python3
"""AU1 assets test: the files in web/assets/audio/ against the tables of the REAL audio.js (exported as JSON by au1_export.js).
  - every TRACKS entry has its mp3; every mus_*.mp3 is in TRACKS (no orphan)
  - the 5 calm tracks added by AU1: each <= 400 KB (400000 bytes), together <= 2 MB (2000000 bytes), 30-120 s, quiet (-26..-17 LUFS), peak <= -1 dBFS (no clipping),
    first and last 20 ms below -50 dBFS (faded, no click), no pure tone above 1.8 kHz louder than -24 dBFS, stereo mp3
  - the 4 old tracks are byte-identical to the kit's originals (AU1 does not touch them)
  - every sfx_*.mp3 has a loudest-level entry in ONESHOT_MAX
usage: au1_assets_test.py <audio-tables.json>"""
import sys, os, json, re, subprocess, hashlib
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import au1_spectrum as S

AUDIO = S.AUDIO_DIR
ORIG = os.environ.get('AU1_ORIG', '/home/claude/base_snapshot/web/assets/audio')
NEW = ['mus_calm_dawn', 'mus_calm_meadow', 'mus_calm_river', 'mus_calm_hearth', 'mus_calm_moon']
OLD = ['mus_day1', 'mus_day2', 'mus_night', 'mus_epic']
fails = []


def ok(c, msg):
    print(('ok   ' if c else 'FAIL ') + msg)
    if not c: fails.append(msg)


def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = r[r.rindex('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))


def main():
    T = json.load(open(sys.argv[1])); tracks = [t['n'] for t in T['TRACKS']]
    files = sorted(f[:-4] for f in os.listdir(AUDIO) if f.startswith('mus_') and f.endswith('.mp3'))
    ok(all(os.path.exists(f'{AUDIO}/{n}.mp3') for n in tracks), f'every TRACKS entry has a file ({len(tracks)} tracks)')
    ok(set(files) == set(tracks), f'no orphan mus_*.mp3 (files {len(files)} = tracks {len(tracks)})')
    ok(all(t['g'] > 0 and t['g'] <= 1 and t['modes'] for t in T['TRACKS']), 'trims in (0, 1], every track has a mode')
    ok(all(n in tracks for n in NEW), 'the calm tracks are all in the playlist')
    sizes = {n: os.path.getsize(f'{AUDIO}/{n}.mp3') for n in NEW}
    for n, b in sizes.items(): ok(b <= 400000, f'{n}: {b} bytes <= 400000')
    ok(sum(sizes.values()) <= 2000000, f'new tracks together: {sum(sizes.values())} bytes <= 2000000')
    print('\n  track                  s     LUFS   peak   start/end rms   centroid  top sustained >1.8k')
    for n in NEW:
        x, sr = S.decode_mp3(f'{AUDIO}/{n}.mp3'); d = len(x) / sr; I, pk = lufs(f'{AUDIO}/{n}.mp3')
        r = S.analyse(x, sr, 0.0); a = int(0.02 * sr); rs = 20 * np.log10(np.sqrt(np.mean(x[:a] ** 2)) + 1e-9); re_ = 20 * np.log10(np.sqrt(np.mean(x[-a:] ** 2)) + 1e-9)     # first / last 20 ms
        print(f'  {n:<20} {d:5.1f} {I:6.1f} {pk:6.1f} {rs:7.1f}/{re_:6.1f}  {r["centroid_hz"]:7.0f}   {r["pure_hz"]} Hz @ {r["pure_dbfs"]}')
        ok(30 <= d <= 120, f'{n}: length {d:.1f} s in 30..120')
        ok(-26 <= I <= -17, f'{n}: {I:.1f} LUFS in -26..-17 (the old tracks are -10..-17)')
        ok(pk <= -1.0 and np.max(np.abs(x)) < 0.9, f'{n}: peak {pk:.1f} dBFS, no clipping')
        ok(rs < -50 and re_ < -50, f'{n}: first 20 ms {rs:.0f} dBFS, last 20 ms {re_:.0f} dBFS (faded: no click at the cut)')
        ok(not r['offender'], f'{n}: no pure tone above {S.PURE_HZ:.0f} Hz over {S.LIMIT_DBFS} dBFS')
        ch = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=channels,sample_rate', '-of', 'csv=p=0', f'{AUDIO}/{n}.mp3'], capture_output=True, text=True).stdout.strip()
        ok(ch.startswith('32000,2') or ch.startswith('2,32000') or '2' in ch.split(','), f'{n}: stereo mp3 ({ch})')
    if os.path.isdir(ORIG):
        for n in OLD:
            same = hashlib.md5(open(f'{AUDIO}/{n}.mp3', 'rb').read()).digest() == hashlib.md5(open(f'{ORIG}/{n}.mp3', 'rb').read()).digest()
            ok(same, f'{n}: identical to the kit original (AU1 does not touch it)')
    sfx = sorted(f[:-4] for f in os.listdir(AUDIO) if f.startswith('sfx_') and f.endswith('.mp3'))
    miss = [n for n in sfx if n not in T['ONESHOT_MAX']]
    ok(not miss, f'every sfx file has a loudest level in ONESHOT_MAX ({len(sfx)} files){": missing " + str(miss) if miss else ""}')
    if fails:
        print(f'FAIL {len(fails)} asset check(s)'); sys.exit(1)
    print('ok   assets')


if __name__ == '__main__':
    main()
