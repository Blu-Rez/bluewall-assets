import json, collections, sys
def rows(tag):
    d=json.load(open('out/ground_%s.json'%tag)); meta=d['meta']; r=d['res']['result']; G=collections.defaultdict(list); ceil=collections.Counter(); n=collections.Counter()
    for (lab,kind,sc,y,ym),(hy,nm),fh in zip(meta,r['out'],r['fast']):
        n[lab]+=1
        if hy is None: continue
        gap=hy-y
        if gap>0.9: ceil[lab]+=1; continue      # something overhead (a gate arch, a roof, a bridge deck above): not the floor
        G[lab].append(gap)
    return G,ceil,n
def q(a,p): a=sorted(a); return a[min(len(a)-1,int(p*(len(a)-1)))]
def label(l):
    return {'agent':'villagers at worksites','animal:cow':'pen cows','animal:horse':'pen / cart-yard horses','cart.driver':'cart drivers','cart.horse':'cart horses','pas.cow':'pasture cows','pas.horse':'pasture horses','pas.yard':'stable yard (horse + people)','dog':'dogs (town)','wolf':'wolves','knight':'knights\' horses'}.get(l,l)
if __name__=='__main__':
    for tag in sys.argv[1:]:
        G,ceil,n=rows(tag); print('==',tag)
        print('%-30s %5s %7s | surface - root (cm): p50   p95   max | within ±3 cm | sunk >8 cm | floating >8 cm'%('group','n','overhead'))
        for lab,a in sorted(G.items()):
            ok=sum(abs(x)<=0.03 for x in a)/len(a); sunk=sum(x>0.08 for x in a)/len(a); fl=sum(x<-0.08 for x in a)/len(a)
            print('%-30s %5d %7d | %6.1f %6.1f %6.1f | %5.0f%% | %5.1f%% | %5.1f%%'%(label(lab),len(a),ceil[lab],100*q(a,.5),100*q(a,.95),100*max(a),100*ok,100*sunk,100*fl))
