import json, sys, random
from gr_run import build, run, analyse
port=int(sys.argv[1]); tag=sys.argv[2]; tracks=sys.argv[3]; cre=sys.argv[4].split(','); files=sys.argv[5:]
samples,meta=build(files,tracks); print('crowd samples',len(samples))
random.seed(5)
for fn in cre:
    R=json.load(open(fn))['result']
    for o in R['out']:
        rows=o['rows']; idx=[j for j in range(0,len(rows),12)]
        for j in idx:
            r=rows[j]; samples.append([r['x'],r['z'],r['y']]); meta.append((o['kind'],o['kind'],1,r['y'],None))
print('total samples',len(samples))
res=run(samples,port); print('ok',res.get('ok'),res.get('error'))
json.dump({'meta':meta,'res':res},open('out/ground_%s.json'%tag,'w'))
analyse(res,meta,tag)
