import json, sys
a=json.load(open(sys.argv[1]))
sm={}; off={}; an={}; bd={}; fn={}; n=0
for k,v in a.items():
    n+=v['n']
    for s in v['small']: sm.setdefault(s[0],[]).append((k,s[1],s[2]))
    for s in v['off']: off.setdefault(s[0],[]).append((k,)+tuple(s[1:]))
    for s in v['anim']: an.setdefault(s[0]+' '+s[1],[]).append(k)
    for s in v['bd']: bd.setdefault(s,[]).append(k)
    for s in v['font']: fn.setdefault(s[0]+' '+str(s[1]),[]).append(k)
print(len(a),'scenes;', n,'interactive targets measured')
print('targets < 44 px:', len(sm), '(distinct) /', sum(len(v) for v in sm.values()), '(total hits)')
for k,v in sorted(sm.items(), key=lambda x:-len(x[1]))[:25]: print('  ',k, v[0], len(v))
print('outside screen:', len(off)); [print('  ',k,v[0],len(v)) for k,v in list(off.items())[:10]]
print('endless animations (computed):', len(an)); [print('  ',k,len(v)) for k,v in list(an.items())[:10]]
print('backdrop-filter:', len(bd)); print('font < 10 px:', len(fn)); [print('  ',k,len(v)) for k,v in list(fn.items())[:10]]
