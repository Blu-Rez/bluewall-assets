import json, sys
def load(f): return json.load(open(f))
def table(d, title):
    print('==', title)
    print('%-12s %6s %6s %6s %6s %6s %6s %6s %7s %5s %8s' % ('name','dist','along','lat','tRoll','v0','vmax','vEnd','camAcc','inside','camMove'))
    for r in d['dirs'] + [d['extra']['noInput'], d['extra']['release']]:
        print('%-12s %6.2f %6.2f %6.2f %6s %6.2f %6.2f %6.2f %7.1f %5d %8.2f' % (r['name'], r['dist'], r['along'], r['lat'], r['tRoll'], r['v0'], r['vmax'], r['vEnd'], r['camMaxAcc'], r['insideFrames'], r['camMove']))
    w = d['walls']; print('wall trials', len(w), 'inside frames', sum(r['insideFrames'] for r in w))
if __name__ == '__main__':
    for f in sys.argv[1:]: table(load(f), f)
